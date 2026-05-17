/* eslint-disable no-console */
/**
 * Seed initial liquidity into ObscuraAMM for every listed asset, and push
 * fresh Pyth price updates so the AMM can quote immediately.
 *
 * Strategy (oracle-priced AMM):
 *   - Mint mock-asset balance for the deployer via each token's faucet.
 *   - Pull EURC + USDC from the deployer's wallet (must be funded via the
 *     Circle faucet at https://faucet.circle.com).
 *   - Deposit (asset, USDC) at amounts that roughly match the live Pyth
 *     oracle price so the pool has matching inventory in both legs.
 *
 * Reference seeding (USDC budget ~25 USDC):
 *   EURC  : 5 USDC <-> ~4.6 EURC  (EUR/USD ~1.08)
 *   JPYC  : 5 USDC <-> ~750 JPYC  (USD/JPY ~150 -> $1 = 150 JPY)
 *   GOLD  : 4.5 USDC <-> 0.001 GOLD     (~$4500/oz)
 *   AAPL  : 4.4 USDC <-> 0.02 AAPL      (~$220 /share)
 *   MSTR  : 5.1 USDC <-> 0.003 MSTR     (~$1700/share)
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

const ARC_USDC = '0x3600000000000000000000000000000000000000';
const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

// USDC seeded per pool (raw USDC units, 6 decimals).
const POOL_USDC_SEED = {
  EURC: 5_000_000n,   // 5  USDC
  JPYC: 5_000_000n,   // 5  USDC
  GOLD: 4_500_000n,   // 4.5 USDC -> 0.001 GOLD @ $4500
  AAPL: 4_400_000n,   // 4.4 USDC -> 0.02 AAPL @ $220
  MSTR: 5_100_000n,   // 5.1 USDC -> 0.003 MSTR @ $1700
};

// Asset units seeded per pool (raw, in token's own decimals).
const POOL_ASSET_SEED = {
  EURC: 4_600_000n,                  // 4.6 EURC (6 dec)  -> 1.087 USDC/EUR
  JPYC: 750n * 10n ** 18n,           // 750 JPYC (18 dec) -> 0.00667 USDC/JPY
  GOLD: 1n * 10n ** 15n,             // 0.001 GOLD (18 dec)
  AAPL: 2n * 10n ** 16n,             // 0.02  AAPL (18 dec)
  MSTR: 3n * 10n ** 15n,             // 0.003 MSTR (18 dec)
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployment = loadDeployment();
  const ammAddr = deployment.contracts.ObscuraAMM;
  const pythAddr = deployment.pyth;

  console.log(' Seeding ObscuraAMM at', ammAddr);
  console.log(' Deployer            ', deployer.address);
  console.log(' Pyth                ', pythAddr);

  const amm = await hre.ethers.getContractAt('ObscuraAMM', ammAddr);
  const usdc = await hre.ethers.getContractAt('IERC20', ARC_USDC);
  const eurc = await hre.ethers.getContractAt('IERC20', ARC_EURC);

  // 0) Push fresh Pyth price updates so the AMM has prices to quote against.
  await pushPythUpdates(deployment, deployer);

  // 1) Approve USDC + EURC once for total seed.
  const totalUSDC = Object.values(POOL_USDC_SEED).reduce((a, b) => a + b, 0n);
  console.log(`\n Approving ${totalUSDC} USDC (raw) to AMM...`);
  await wait(usdc.approve(ammAddr, totalUSDC));

  if (POOL_ASSET_SEED.EURC && POOL_ASSET_SEED.EURC > 0n) {
    console.log(` Approving ${POOL_ASSET_SEED.EURC} EURC (raw) to AMM...`);
    await wait(eurc.approve(ammAddr, POOL_ASSET_SEED.EURC));
  }

  // 2) Seed EURC pool first (real Arc EURC, no faucet — must be funded).
  if (POOL_USDC_SEED.EURC && POOL_ASSET_SEED.EURC) {
    const eurcBal = await eurc.balanceOf(deployer.address);
    if (eurcBal < POOL_ASSET_SEED.EURC) {
      console.warn(
        `\n  WARNING: deployer EURC balance ${eurcBal} < seed ${POOL_ASSET_SEED.EURC}. ` +
          'Get testnet EURC from https://faucet.circle.com (Arc Testnet, EURC). ' +
          'Skipping EURC pool seed.'
      );
    } else {
      console.log(`\n  EURC  asset=${POOL_ASSET_SEED.EURC}  usdc=${POOL_USDC_SEED.EURC}`);
      const tx = await amm.addLiquidity(ARC_EURC, POOL_ASSET_SEED.EURC, POOL_USDC_SEED.EURC);
      const r = await tx.wait();
      console.log(`   ok (gas used ${r.gasUsed})`);
    }
  }

  // 3) Seed mock-token pools (faucet -> approve -> addLiquidity).
  for (const [sym, info] of Object.entries(deployment.contracts.tokens)) {
    const usdcSeed = POOL_USDC_SEED[sym];
    const assetSeed = POOL_ASSET_SEED[sym];
    if (!usdcSeed || !assetSeed) {
      console.log(`  - skipping ${sym} (no seed configured)`);
      continue;
    }

    console.log(`\n  ${sym}  asset=${assetSeed}  usdc=${usdcSeed}`);
    const token = await hre.ethers.getContractAt('MockToken', info.address);

    const faucetAmt = await token.faucetAmount();
    let bal = await token.balanceOf(deployer.address);
    while (bal < assetSeed) {
      console.log(`   minting ${faucetAmt} via faucet...`);
      await wait(token.mint());
      bal = await token.balanceOf(deployer.address);
    }

    console.log('   approving asset to AMM...');
    await wait(token.approve(ammAddr, assetSeed));

    console.log('   addLiquidity...');
    const tx = await amm.addLiquidity(info.address, assetSeed, usdcSeed);
    const r = await tx.wait();
    console.log(`   ok (gas used ${r.gasUsed})`);
  }

  console.log('\n  Liquidity seeded.');
  console.log('     Each pool serves swaps at the live Pyth oracle price.');
}

async function wait(txPromise) {
  const tx = await txPromise;
  return tx.wait();
}

async function pushPythUpdates(deployment, deployer) {
  const ids = [
    deployment.contracts.EURC.priceId,
    ...Object.values(deployment.contracts.tokens).map((t) => t.priceId),
  ].filter(Boolean);

  if (ids.length === 0) {
    console.log('  - no Pyth feeds to update');
    return;
  }

  console.log(`\n Pushing ${ids.length} Pyth price updates from Hermes...`);
  const url =
    'https://hermes.pyth.network/v2/updates/price/latest?' +
    ids.map((id) => `ids[]=${id}`).join('&');

  let body;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Hermes ${res.status}`);
    body = await res.json();
  } catch (e) {
    console.warn(
      `   WARNING: Hermes fetch failed (${e.message}). Pools will need a manual price push before the UI can quote them.`
    );
    return;
  }

  const updates = (body?.binary?.data || []).map((d) => '0x' + d);
  if (updates.length === 0) {
    console.warn('   WARNING: Hermes returned no updates.');
    return;
  }

  const PYTH_ABI = [
    'function getUpdateFee(bytes[] updateData) view returns (uint256)',
    'function updatePriceFeeds(bytes[] updateData) payable',
  ];
  const pyth = new hre.ethers.Contract(deployment.pyth, PYTH_ABI, deployer);

  const fee = await pyth.getUpdateFee(updates);
  console.log(`   fee = ${fee} wei`);

  const tx = await pyth.updatePriceFeeds(updates, { value: fee });
  const r = await tx.wait();
  console.log(`   pushed (gas used ${r.gasUsed})`);
}

function loadDeployment() {
  const p = path.resolve(__dirname, '..', 'deployments', 'arc-testnet.json');
  if (!fs.existsSync(p)) {
    throw new Error(
      'deployments/arc-testnet.json not found. Run scripts/deploy.cjs first.'
    );
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

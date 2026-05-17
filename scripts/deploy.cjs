/* eslint-disable no-console */
/**
 * Deploy Obscura's full stack to Arc Testnet.
 *
 * Order:
 *   1. MockToken for synthetic markets (JPYC, GOLD, AAPL, MSTR)
 *   2. ObscuraAMM (USDC + Pyth)
 *   3. ObscuraShield (privacy levels)
 *   4. ObscuraRFQ (EIP-712 + Pyth ceiling)
 *   5. List every supported asset in AMM + RFQ (with Pyth feed id + inverted flag)
 *   6. Whitelist USDC/EURC/JPYC + every mock in Shield
 *   7. Set the deployer as the initial RFQ maker
 *   8. Write deployments/arc-testnet.json + auto-generate
 *      src/config/contracts.generated.ts so the frontend picks up addresses
 *      automatically.
 *
 * Pools are NOT seeded here — see scripts/seedLiquidity.cjs for that step.
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

// Native USDC ERC-20 interface on Arc Testnet (6 decimals).
const ARC_USDC = '0x3600000000000000000000000000000000000000';

// Native EURC ERC-20 on Arc Testnet (6 decimals).
// Source: https://docs.arc.io/arc/references/contract-addresses
const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

// Pyth contract on Arc Testnet.
const PYTH_ARC_TESTNET = '0x2880aB155794e7179c9eE2e38200202908C17B43';

// Pyth Stable price feed IDs.
// Source: https://docs.pyth.network/price-feeds/core/price-feeds
const PYTH_FEEDS = {
  EUR_USD: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b', // EUR/USD
  USD_JPY: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52', // USD/JPY (inverted!)
  GOLD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',     // XAU/USD
  AAPL: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  MSTR: '0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09',
};

// Mock tokens we deploy ourselves (everything except USDC and EURC, which
// already exist as real Arc Testnet contracts).
//
// JPYC: Pyth quotes USD/JPY (yen per dollar) so we set `inverted=true` to
//       derive USD per JPY at runtime.
// GOLD/AAPL/MSTR: Pyth quotes USD per asset directly, so `inverted=false`.
const MOCK_TOKENS = [
  {
    symbol: 'JPYC',
    name: 'Mock Japanese Yen Coin',
    decimals: 18,
    faucet: 100_000n * 10n ** 18n,    // ~$650 worth at 150 JPY/USD
    initialSupply: 0n,
    priceId: PYTH_FEEDS.USD_JPY,
    inverted: true,
  },
  {
    symbol: 'GOLD',
    name: 'Mock Tokenized Gold',
    decimals: 18,
    faucet: 5n * 10n ** 18n,
    initialSupply: 0n,
    priceId: PYTH_FEEDS.GOLD,
    inverted: false,
  },
  {
    symbol: 'AAPL',
    name: 'Mock Apple Equity',
    decimals: 18,
    faucet: 10n * 10n ** 18n,
    initialSupply: 0n,
    priceId: PYTH_FEEDS.AAPL,
    inverted: false,
  },
  {
    symbol: 'MSTR',
    name: 'Mock MicroStrategy',
    decimals: 18,
    faucet: 10n * 10n ** 18n,
    initialSupply: 0n,
    priceId: PYTH_FEEDS.MSTR,
    inverted: false,
  },
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log('────────────────────────────────────────────');
  console.log(' Obscura — Arc Testnet deployment');
  console.log('────────────────────────────────────────────');
  console.log(` network    : ${network} (chainId=${chainId})`);
  console.log(` deployer   : ${deployer.address}`);
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log(` balance    : ${hre.ethers.formatUnits(bal, 18)} (native, USDC on Arc)`);
  console.log(` USDC (Arc) : ${ARC_USDC}`);
  console.log(` EURC (Arc) : ${ARC_EURC}`);
  console.log(` Pyth (Arc) : ${PYTH_ARC_TESTNET}`);
  console.log('────────────────────────────────────────────\n');

  if (chainId !== 5042002n && network !== 'hardhat' && network !== 'localhost') {
    console.warn(` Warning: chainId ${chainId} is not Arc Testnet (5042002).`);
  }

  // ---------- 1. Mock tokens ----------
  console.log('[1/8] Deploying MockToken contracts...');
  const MockToken = await hre.ethers.getContractFactory('MockToken');
  const tokens = {};
  for (const t of MOCK_TOKENS) {
    const c = await MockToken.deploy(t.name, t.symbol, t.decimals, t.initialSupply, t.faucet);
    await c.waitForDeployment();
    const addr = await c.getAddress();
    tokens[t.symbol] = {
      address: addr,
      decimals: t.decimals,
      name: t.name,
      priceId: t.priceId,
      inverted: t.inverted,
    };
    console.log(`   ${t.symbol.padEnd(5)} -> ${addr}  inverted=${t.inverted}`);
  }

  // ---------- 2. AMM ----------
  console.log('\n[2/8] Deploying ObscuraAMM (Pyth-priced)...');
  const AMM = await hre.ethers.getContractFactory('ObscuraAMM');
  const amm = await AMM.deploy(ARC_USDC, PYTH_ARC_TESTNET);
  await amm.waitForDeployment();
  const ammAddr = await amm.getAddress();
  console.log(`   ObscuraAMM    -> ${ammAddr}`);

  // ---------- 3. Shield ----------
  console.log('\n[3/8] Deploying ObscuraShield...');
  const Shield = await hre.ethers.getContractFactory('ObscuraShield');
  const shield = await Shield.deploy();
  await shield.waitForDeployment();
  const shieldAddr = await shield.getAddress();
  console.log(`   ObscuraShield -> ${shieldAddr}`);

  // ---------- 4. RFQ ----------
  console.log('\n[4/8] Deploying ObscuraRFQ (EIP-712 + Pyth ceiling)...');
  const RFQ = await hre.ethers.getContractFactory('ObscuraRFQ');
  const rfq = await RFQ.deploy(PYTH_ARC_TESTNET);
  await rfq.waitForDeployment();
  const rfqAddr = await rfq.getAddress();
  console.log(`   ObscuraRFQ    -> ${rfqAddr}`);

  // ---------- 4b. Nanopay ----------
  console.log('\n[5/8] Deploying ObscuraNanopay (USDC micropayment channels)...');
  const Nano = await hre.ethers.getContractFactory('ObscuraNanopay');
  const nano = await Nano.deploy(ARC_USDC);
  await nano.waitForDeployment();
  const nanoAddr = await nano.getAddress();
  console.log(`   ObscuraNanopay -> ${nanoAddr}`);

  // ---------- 5. List in AMM + RFQ ----------
  console.log('\n[6/8] Listing assets...');

  // AMM: list every non-USDC asset (EURC + JPYC + GOLD/AAPL/MSTR).
  console.log('   AMM:');
  await wait(amm.listAsset(ARC_EURC, PYTH_FEEDS.EUR_USD, 6, false));
  console.log(`     listed EURC (real)`);
  for (const [sym, info] of Object.entries(tokens)) {
    await wait(amm.listAsset(info.address, info.priceId, info.decimals, info.inverted));
    console.log(`     listed ${sym}  feed=${info.priceId.slice(0, 10)}... inverted=${info.inverted}`);
  }

  // RFQ: list everything including USDC (special-cased via listUSDC).
  console.log('   RFQ:');
  await wait(rfq.listUSDC(ARC_USDC));
  console.log('     listed USDC (fixed $1)');
  await wait(rfq.listAsset(ARC_EURC, PYTH_FEEDS.EUR_USD, 6, false));
  console.log('     listed EURC (real)');
  for (const [sym, info] of Object.entries(tokens)) {
    await wait(rfq.listAsset(info.address, info.priceId, info.decimals, info.inverted));
    console.log(`     listed ${sym}`);
  }

  // ---------- 6. Whitelist in Shield ----------
  console.log('\n[7/8] Whitelisting assets in Shield...');
  const shieldAssets = [
    { symbol: 'USDC', address: ARC_USDC },
    { symbol: 'EURC', address: ARC_EURC },
    ...Object.entries(tokens).map(([sym, info]) => ({ symbol: sym, address: info.address })),
  ];
  for (const a of shieldAssets) {
    await wait(shield.setAssetWhitelist(a.address, true));
    console.log(`   whitelisted ${a.symbol}`);
  }

  // ---------- 7. Maker registration ----------
  // The deploy script supports a synthetic maker pool. We always register the
  // deployer (matches the browser-side default in src/lib/rfqMaker.ts), and
  // additionally register optional makers passed via `RFQ_EXTRA_MAKERS`
  // (comma-separated addresses) so a multi-maker demo works out of the box.
  console.log('\n[8/8] Setting deployer + extra RFQ makers...');
  await wait(rfq.setMaker(deployer.address, true));
  console.log(`   maker  -> ${deployer.address}  (deployer / Wintermute persona)`);

  const extra = (process.env.RFQ_EXTRA_MAKERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.startsWith('0x') && s.length === 42);
  for (const m of extra) {
    await wait(rfq.setMaker(m, true));
    console.log(`   maker  -> ${m}  (extra)`);
  }
  if (extra.length === 0) {
    console.log(
      '   tip: pass RFQ_EXTRA_MAKERS=0x...,0x... to also register Jump+Citadel personas.'
    );
  }

  // ---------- Persist ----------
  const deployment = {
    network,
    chainId: Number(chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    pyth: PYTH_ARC_TESTNET,
    contracts: {
      USDC: { address: ARC_USDC, decimals: 6, native: true },
      EURC: { address: ARC_EURC, decimals: 6, native: true, priceId: PYTH_FEEDS.EUR_USD },
      ObscuraAMM: ammAddr,
      ObscuraShield: shieldAddr,
      ObscuraRFQ: rfqAddr,
      ObscuraNanopay: nanoAddr,
      tokens,
    },
    rfqMaker: deployer.address,
    rfqExtraMakers: extra,
  };

  const outDir = path.resolve(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'arc-testnet.json');
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`\n  Wrote ${outPath}`);

  const generated = generateConfigModule(deployment);
  const genPath = path.resolve(__dirname, '..', 'src', 'config', 'contracts.generated.ts');
  fs.writeFileSync(genPath, generated);
  console.log(`  Wrote ${genPath}`);

  console.log('\n  Deployment complete.');
  console.log('     Next: npx hardhat run scripts/seedLiquidity.cjs --network arcTestnet');
}

async function wait(txPromise) {
  const tx = await txPromise;
  return tx.wait();
}

function generateConfigModule(d) {
  const tokenLines = Object.entries(d.contracts.tokens)
    .map(
      ([sym, info]) =>
        `  ${sym}: { address: '${info.address}' as \`0x\${string}\`, decimals: ${info.decimals}, name: ${JSON.stringify(info.name)}, priceId: '${info.priceId}' as \`0x\${string}\`, inverted: ${info.inverted} },`
    )
    .join('\n');

  return `// AUTO-GENERATED by scripts/deploy.cjs — do not edit by hand.
// Re-run \`npx hardhat run scripts/deploy.cjs --network arcTestnet\` to update.

export const ARC_TESTNET_CHAIN_ID = ${d.chainId};

export const ARC_USDC_ADDRESS = '${d.contracts.USDC.address}' as \`0x\${string}\`;
export const ARC_USDC_DECIMALS = ${d.contracts.USDC.decimals};

export const ARC_EURC_ADDRESS = '${d.contracts.EURC.address}' as \`0x\${string}\`;
export const ARC_EURC_DECIMALS = ${d.contracts.EURC.decimals};
export const ARC_EURC_PRICE_ID = '${d.contracts.EURC.priceId}' as \`0x\${string}\`;

export const PYTH_CONTRACT_ADDRESS = '${d.pyth}' as \`0x\${string}\`;

export const OBSCURA_AMM_ADDRESS = '${d.contracts.ObscuraAMM}' as \`0x\${string}\`;
export const OBSCURA_SHIELD_ADDRESS = '${d.contracts.ObscuraShield}' as \`0x\${string}\`;
export const OBSCURA_RFQ_ADDRESS = '${d.contracts.ObscuraRFQ}' as \`0x\${string}\`;
export const OBSCURA_NANOPAY_ADDRESS = '${d.contracts.ObscuraNanopay}' as \`0x\${string}\`;

export const RFQ_MAKER_ADDRESS = '${d.rfqMaker}' as \`0x\${string}\`;
export const RFQ_EXTRA_MAKERS = ${JSON.stringify(d.rfqExtraMakers || [])} as readonly string[];

export const MOCK_TOKENS = {
${tokenLines}
} as const;

export type MockTokenSymbol = keyof typeof MOCK_TOKENS;
`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/* eslint-disable no-console */
/**
 * Verify a successful Arc Testnet deployment by reading on-chain state and
 * printing a summary that judges/agents can sanity-check at a glance.
 */
const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const p = path.resolve(__dirname, '..', 'deployments', 'arc-testnet.json');
  if (!fs.existsSync(p)) throw new Error('deployments/arc-testnet.json missing.');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  console.log(' Obscura on-chain status');
  console.log('   chainId      :', d.chainId);
  console.log('   AMM          :', d.contracts.ObscuraAMM);
  console.log('   Shield       :', d.contracts.ObscuraShield);
  console.log('   USDC (Arc)   :', d.contracts.USDC.address);

  const amm = await hre.ethers.getContractAt('ObscuraAMM', d.contracts.ObscuraAMM);
  const shield = await hre.ethers.getContractAt('ObscuraShield', d.contracts.ObscuraShield);

  const len = await amm.listedAssetsLength();
  console.log(`\n  AMM listed assets (${len}):`);
  for (let i = 0; i < Number(len); i++) {
    const a = await amm.listedAssets(i);
    const [rA, rU] = await amm.reserves(a);
    const price = await amm.getPrice(a);
    console.log(`   - ${a}  reserves(asset=${rA}, usdc=${rU})  spot=${price} (1e18 scale)`);
  }

  const slen = await shield.whitelistedAssetsLength();
  console.log(`\n  Shield whitelist (${slen}):`);
  for (let i = 0; i < Number(slen); i++) {
    const a = await shield.whitelistedAssets(i);
    console.log(`   - ${a}`);
  }
  for (const lvl of [0, 1, 2]) {
    const lock = await shield.levelLock(lvl);
    console.log(`   level ${lvl} lock: ${lock}s`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

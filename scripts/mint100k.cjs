const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const deploymentPath = path.resolve(__dirname, "..", "deployments", "arc-testnet.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("No deployment found");
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const ammAddr = deployment.contracts.ObscuraAMM;
    const amm = await hre.ethers.getContractAt("ObscuraAMM", ammAddr);

    const ARC_USDC = deployment.contracts.USDC.address;
    const usdc = await hre.ethers.getContractAt("IERC20", ARC_USDC);

    for (const [sym, info] of Object.entries(deployment.contracts.tokens)) {
        console.log(`Processing ${sym}...`);
        const token = await hre.ethers.getContractAt("MockToken", info.address);

        // We want to mint 100,000 tokens for testing
        const amount = 100_000n * (10n ** BigInt(info.decimals));

        console.log(`  Minting 100k to deployer...`);
        await (await token.adminMint(deployer.address, amount)).wait();
    }
    console.log("Done minting 100k for each mock token!");
}

main().catch(console.error);

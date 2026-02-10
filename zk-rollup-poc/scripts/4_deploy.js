/**
 * ============================================================
 * Script 4: Deploy Verifier and Rollup Contracts
 * ============================================================
 *
 * Deploys:
 *   1. Groth16Verifier — the snarkjs-generated verifier
 *   2. Rollup — the main rollup contract, initialized with the
 *      old state root as the genesis state
 *
 * Usage:
 *   npx hardhat run scripts/4_deploy.js --network xrplEvmSidechain
 *   npx hardhat run scripts/4_deploy.js --network sepolia
 *   npx hardhat run scripts/4_deploy.js --network hardhat
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("============================================");
  console.log("  ZK-Rollup PoC — Contract Deployment");
  console.log("============================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`  Network:  ${network}`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${hre.ethers.formatEther(balance)} ETH\n`);

  // ---- Load genesis state root ----
  const rootsPath = path.join("build", "state_roots.json");
  let initialStateRoot;

  if (fs.existsSync(rootsPath)) {
    const roots = JSON.parse(fs.readFileSync(rootsPath, "utf8"));
    initialStateRoot = roots.oldStateRoot;
    console.log(`  Genesis state root: ${initialStateRoot}`);
  } else {
    // Default fallback for testing
    initialStateRoot = "0";
    console.log("  ⚠️  No state_roots.json found. Using 0 as genesis root.");
    console.log("     Run 'node scripts/generate_input.js' first for real values.\n");
  }

  // ---- Deploy Verifier ----
  console.log("\n[1/2] Deploying Groth16Verifier...");
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log(`   ✅ Verifier deployed at: ${verifierAddr}`);

  // ---- Deploy Rollup ----
  console.log("\n[2/2] Deploying Rollup...");
  const Rollup = await hre.ethers.getContractFactory("Rollup");
  const rollup = await Rollup.deploy(verifierAddr, initialStateRoot);
  await rollup.waitForDeployment();
  const rollupAddr = await rollup.getAddress();
  console.log(`   ✅ Rollup deployed at: ${rollupAddr}`);

  // ---- Verify deployment ----
  const currentRoot = await rollup.stateRoot();
  const operator = await rollup.operator();

  console.log("\n  Post-deployment verification:");
  console.log(`    State root: ${currentRoot}`);
  console.log(`    Operator:   ${operator}`);
  console.log(`    Batch count: ${await rollup.batchCount()}`);

  // ---- Save deployment info ----
  const deployment = {
    network: network,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      verifier: verifierAddr,
      rollup: rollupAddr,
    },
    initialStateRoot: initialStateRoot,
  };

  const deployPath = path.join("build", `deployment_${network}.json`);
  fs.writeFileSync(deployPath, JSON.stringify(deployment, null, 2));

  console.log("\n============================================");
  console.log("  ✅ Deployment Complete!");
  console.log("============================================");
  console.log(`\n  Saved to: ${deployPath}`);
  console.log(`\n  Verifier: ${verifierAddr}`);
  console.log(`  Rollup:   ${rollupAddr}`);
  console.log(`\n  Next step: npx hardhat run scripts/5_submit_rollup.js --network ${network}`);

  // Update .env suggestion
  console.log(`\n  Update your .env file:`);
  console.log(`    VERIFIER_CONTRACT_ADDRESS=${verifierAddr}`);
  console.log(`    ROLLUP_CONTRACT_ADDRESS=${rollupAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

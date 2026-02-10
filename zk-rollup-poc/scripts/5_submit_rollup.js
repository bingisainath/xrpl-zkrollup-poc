/**
 * ============================================================
 * Script 5: Submit Rollup Batch Proof On-Chain
 * ============================================================
 *
 * This script:
 *   1. Loads the generated proof and public signals
 *   2. Loads the deployed contract addresses
 *   3. Calls Rollup.submitBatch() with the zk-SNARK proof
 *   4. Verifies the state root was updated on-chain
 *
 * Usage:
 *   npx hardhat run scripts/5_submit_rollup.js --network xrplEvmSidechain
 *   npx hardhat run scripts/5_submit_rollup.js --network sepolia
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("============================================");
  console.log("  ZK-Rollup PoC — Batch Proof Submission");
  console.log("============================================\n");

  const [signer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log(`  Network:    ${network}`);
  console.log(`  Submitter:  ${signer.address}\n`);

  // ---- Load deployment info ----
  const deployPath = path.join("build", `deployment_${network}.json`);
  if (!fs.existsSync(deployPath)) {
    console.error(`ERROR: Deployment file not found at ${deployPath}`);
    console.error(`Run deployment first: npx hardhat run scripts/4_deploy.js --network ${network}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deployPath, "utf8"));
  console.log(`  Rollup contract:   ${deployment.contracts.rollup}`);
  console.log(`  Verifier contract: ${deployment.contracts.verifier}`);

  // ---- Load proof data ----
  const proofCalldataPath = path.join("build", "proof_calldata.json");
  const stateRootsPath = path.join("build", "state_roots.json");

  if (!fs.existsSync(proofCalldataPath)) {
    console.error("ERROR: proof_calldata.json not found. Generate proof first.");
    process.exit(1);
  }

  const proofData = JSON.parse(fs.readFileSync(proofCalldataPath, "utf8"));
  const stateRoots = JSON.parse(fs.readFileSync(stateRootsPath, "utf8"));

  console.log(`\n  Old state root: ${stateRoots.oldStateRoot}`);
  console.log(`  New state root: ${stateRoots.newStateRoot}`);

  // ---- Connect to Rollup contract ----
  const rollupAbi = (
    await hre.artifacts.readArtifact("Rollup")
  ).abi;

  const rollup = new hre.ethers.Contract(
    deployment.contracts.rollup,
    rollupAbi,
    signer
  );

  // ---- Pre-submission checks ----
  const currentRoot = await rollup.stateRoot();
  const currentBatchCount = await rollup.batchCount();
  const operator = await rollup.operator();

  console.log("\n  Pre-submission state:");
  console.log(`    Current root:   ${currentRoot}`);
  console.log(`    Batch count:    ${currentBatchCount}`);
  console.log(`    Operator:       ${operator}`);
  console.log(`    Signer match:   ${operator.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);

  if (currentRoot.toString() !== stateRoots.oldStateRoot) {
    console.error(`\n  ❌ State root mismatch!`);
    console.error(`     On-chain: ${currentRoot}`);
    console.error(`     Expected: ${stateRoots.oldStateRoot}`);
    process.exit(1);
  }

  // ---- Submit batch ----
  console.log("\n[1/2] Submitting rollup batch proof...");
  console.log("       (calling Rollup.submitBatch)");

  const tx = await rollup.submitBatch(
    proofData.pA,
    proofData.pB,
    proofData.pC,
    stateRoots.oldStateRoot,
    stateRoots.newStateRoot
  );

  console.log(`\n  Transaction hash: ${tx.hash}`);
  console.log("  Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`  Gas used: ${receipt.gasUsed.toString()}`);

  // ---- Parse events ----
  const batchEvent = receipt.logs.find((log) => {
    try {
      const parsed = rollup.interface.parseLog(log);
      return parsed?.name === "BatchVerified";
    } catch {
      return false;
    }
  });

  if (batchEvent) {
    const parsed = rollup.interface.parseLog(batchEvent);
    console.log("\n  📋 BatchVerified Event:");
    console.log(`     Batch ID:       ${parsed.args.batchId}`);
    console.log(`     Old State Root: ${parsed.args.oldStateRoot}`);
    console.log(`     New State Root: ${parsed.args.newStateRoot}`);
    console.log(`     Submitter:      ${parsed.args.submitter}`);
  }

  // ---- Post-submission verification ----
  console.log("\n[2/2] Verifying on-chain state...");
  const newRoot = await rollup.stateRoot();
  const newBatchCount = await rollup.batchCount();

  console.log(`  New state root:  ${newRoot}`);
  console.log(`  Batch count:     ${newBatchCount}`);

  if (newRoot.toString() === stateRoots.newStateRoot) {
    console.log("\n============================================");
    console.log("  ✅ ROLLUP BATCH SUCCESSFULLY VERIFIED!");
    console.log("============================================");
    console.log("  The zk-SNARK proof was verified on-chain");
    console.log("  and the rollup state root has been updated.");
    console.log("============================================\n");
  } else {
    console.error("\n  ❌ State root did not update as expected!");
    process.exit(1);
  }

  // ---- Save result ----
  const result = {
    network,
    batchId: newBatchCount.toString(),
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    oldStateRoot: stateRoots.oldStateRoot,
    newStateRoot: stateRoots.newStateRoot,
    timestamp: new Date().toISOString(),
  };

  const resultPath = path.join("build", `batch_result_${network}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`  Result saved to: ${resultPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Submission failed:", error);
    process.exit(1);
  });

/**
 * ============================================================
 * Script 3: Generate zk-SNARK Proof (Groth16)
 * ============================================================
 *
 * This script:
 *   1. Loads the circuit input (input.json)
 *   2. Generates the witness using the WASM witness generator
 *   3. Creates a Groth16 proof using the proving key (zkey)
 *   4. Verifies the proof locally against the verification key
 *   5. Exports proof data formatted for on-chain submission
 *
 * Prerequisites:
 *   - Circuit compiled (script 1)
 *   - Trusted setup complete (script 2)
 *   - Input generated (generate_input.js)
 *
 * Usage:
 *   node scripts/3_generate_proof.js
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const BUILD_DIR = "build";

async function main() {
  console.log("============================================");
  console.log("  ZK-Rollup PoC — Proof Generation");
  console.log("============================================\n");

  // ---- Verify prerequisites ----
  const wasmPath = path.join(BUILD_DIR, "batch_verify_js", "batch_verify.wasm");
  const zkeyPath = path.join(BUILD_DIR, "circuit_final.zkey");
  const inputPath = path.join(BUILD_DIR, "input.json");
  const vkeyPath = path.join(BUILD_DIR, "verification_key.json");

  for (const [name, fpath] of [
    ["WASM", wasmPath],
    ["zkey", zkeyPath],
    ["input", inputPath],
    ["vkey", vkeyPath],
  ]) {
    if (!fs.existsSync(fpath)) {
      console.error(`ERROR: ${name} file not found at ${fpath}`);
      console.error("Make sure you've run the previous scripts first.");
      process.exit(1);
    }
  }

  // ---- Load input ----
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  console.log("📋 Circuit Input:");
  console.log(`   Old State Root: ${input.oldStateRoot}`);
  console.log(`   New State Root: ${input.newStateRoot}`);
  console.log(`   TX1: from=${input.tx1_from} to=${input.tx1_to} amount=${input.tx1_amount}`);
  console.log(`   TX2: from=${input.tx2_from} to=${input.tx2_to} amount=${input.tx2_amount}`);

  // ---- Step 1: Generate Witness ----
  console.log("\n[1/3] Generating witness...");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  console.log("   ✅ Witness generated and proof computed!");
  console.log(`\n   Public Signals:`);
  console.log(`     [0] oldStateRoot = ${publicSignals[0]}`);
  console.log(`     [1] newStateRoot = ${publicSignals[1]}`);

  // ---- Step 2: Verify proof locally ----
  console.log("\n[2/3] Verifying proof locally...");
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
  const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

  if (isValid) {
    console.log("   ✅ Proof is VALID!");
  } else {
    console.error("   ❌ Proof is INVALID! Something went wrong.");
    process.exit(1);
  }

  // ---- Step 3: Export for on-chain submission ----
  console.log("\n[3/3] Exporting proof for on-chain submission...");

  // Format proof for Solidity verifier
  // snarkjs Groth16 proof format → Solidity calldata
  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

  // Parse the calldata string
  // Format: pA, pB, pC, pubSignals
  const calldataParsed = JSON.parse(`[${calldata}]`);

  const proofData = {
    // Raw proof object (for reference)
    proof: proof,
    publicSignals: publicSignals,

    // Formatted for Solidity verifier
    solidity: {
      pA: calldataParsed[0],
      pB: calldataParsed[1],
      pC: calldataParsed[2],
      pubSignals: calldataParsed[3],
    },

    // Raw calldata string for direct contract interaction
    calldata: calldata,
  };

  // Save proof
  const proofPath = path.join(BUILD_DIR, "proof.json");
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));

  // Save public signals
  const pubPath = path.join(BUILD_DIR, "public.json");
  fs.writeFileSync(pubPath, JSON.stringify(publicSignals, null, 2));

  // Save formatted proof for deployment
  const solidityProofPath = path.join(BUILD_DIR, "proof_calldata.json");
  fs.writeFileSync(solidityProofPath, JSON.stringify(proofData.solidity, null, 2));

  // Save full calldata
  const calldataPath = path.join(BUILD_DIR, "calldata.txt");
  fs.writeFileSync(calldataPath, calldata);

  console.log("\n============================================");
  console.log("  ✅ Proof Generation Complete!");
  console.log("============================================");
  console.log(`\n  Outputs:`);
  console.log(`    ${proofPath}           — Raw proof`);
  console.log(`    ${pubPath}          — Public signals`);
  console.log(`    ${solidityProofPath}  — Formatted for Solidity`);
  console.log(`    ${calldataPath}       — Raw calldata`);
  console.log("\n  Proof Summary:");
  console.log(`    π_a: [${proof.pi_a[0].substring(0, 20)}..., ${proof.pi_a[1].substring(0, 20)}...]`);
  console.log(`    π_b: [[...], [...]]`);
  console.log(`    π_c: [${proof.pi_c[0].substring(0, 20)}..., ${proof.pi_c[1].substring(0, 20)}...]`);
  console.log(`\n  Next step: npx hardhat run scripts/4_deploy.js --network <network>`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

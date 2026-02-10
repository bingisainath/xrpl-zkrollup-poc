/**
 * ============================================================
 * Generate Circuit Input from Real Testnet Transactions
 * ============================================================
 *
 * This script:
 *   1. Reads captured transaction data (from the frontend or manual input)
 *   2. Constructs the rollup state model (accounts, balances, nonces)
 *   3. Computes old and new state roots using the same hash as the circuit
 *   4. Writes the input.json file consumed by the witness generator
 *
 * The hash function used here MUST match the circuit exactly.
 * Our circuit uses: H(a,b) = a*b + a + b + 1
 *
 * Usage:
 *   node scripts/generate_input.js [--tx-file captured_txs.json]
 *   node scripts/generate_input.js --interactive
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// Hash functions — MUST match the circom circuit exactly
// ============================================================

/**
 * HashTwo: H(a, b) = a * b + a + b + 1
 * Operating in BigInt to match circom field arithmetic.
 * The BN128 scalar field prime:
 */
const FIELD_PRIME = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function hashTwo(a, b) {
  a = BigInt(a);
  b = BigInt(b);
  // (a * b + a + b + 1) mod p
  let result = ((a * b) % FIELD_PRIME + a + b + 1n) % FIELD_PRIME;
  // Ensure positive
  if (result < 0n) result += FIELD_PRIME;
  return result;
}

function hashThree(a, b, c) {
  const h1 = hashTwo(a, b);
  return hashTwo(h1, c);
}

/**
 * Compute account leaf: Hash(pubkey, balance, nonce)
 */
function accountLeaf(pubkey, balance, nonce) {
  return hashThree(BigInt(pubkey), BigInt(balance), BigInt(nonce));
}

/**
 * Compute state root: Hash(leaf0, leaf1)
 */
function stateRoot(leaf0, leaf1) {
  return hashTwo(leaf0, leaf1);
}

// ============================================================
// Default example: Two accounts, two transactions
// ============================================================

function generateDefaultInput() {
  console.log("============================================");
  console.log("  ZK-Rollup PoC — Circuit Input Generator");
  console.log("============================================\n");

  // --- Account setup ---
  // Using simplified pubkey identifiers (in a real system, these would be
  // derived from Ethereum addresses or public keys)
  const PUBKEY_A = 1n; // Account A identifier
  const PUBKEY_B = 2n; // Account B identifier

  // Starting balances (in smallest unit, e.g., wei / 1e12 for manageability)
  // These represent the rollup's internal balance tracking
  const INITIAL_BALANCE_A = 1000n;
  const INITIAL_BALANCE_B = 500n;
  const INITIAL_NONCE_A = 0n;
  const INITIAL_NONCE_B = 0n;

  console.log("📋 Initial State:");
  console.log(`   Account A (index 0): pubkey=${PUBKEY_A}, balance=${INITIAL_BALANCE_A}, nonce=${INITIAL_NONCE_A}`);
  console.log(`   Account B (index 1): pubkey=${PUBKEY_B}, balance=${INITIAL_BALANCE_B}, nonce=${INITIAL_NONCE_B}`);

  // Compute initial state root
  const leaf0_old = accountLeaf(PUBKEY_A, INITIAL_BALANCE_A, INITIAL_NONCE_A);
  const leaf1_old = accountLeaf(PUBKEY_B, INITIAL_BALANCE_B, INITIAL_NONCE_B);
  const oldRoot = stateRoot(leaf0_old, leaf1_old);

  console.log(`\n   Old leaf 0: ${leaf0_old}`);
  console.log(`   Old leaf 1: ${leaf1_old}`);
  console.log(`   Old state root: ${oldRoot}`);

  // --- Transactions ---
  // tx1: Account A → Account B, amount=100, nonce=0
  const TX1_FROM = 0n;   // index 0 = Account A
  const TX1_TO = 1n;     // index 1 = Account B
  const TX1_AMOUNT = 100n;
  const TX1_NONCE = 0n;  // matches Account A's current nonce

  // tx2: Account B → Account A, amount=50, nonce=0
  const TX2_FROM = 1n;   // index 1 = Account B
  const TX2_TO = 0n;     // index 0 = Account A
  const TX2_AMOUNT = 50n;
  const TX2_NONCE = 0n;  // matches Account B's current nonce

  console.log("\n📋 Transactions:");
  console.log(`   TX1: Account A → Account B, amount=${TX1_AMOUNT}, nonce=${TX1_NONCE}`);
  console.log(`   TX2: Account B → Account A, amount=${TX2_AMOUNT}, nonce=${TX2_NONCE}`);

  // --- Apply TX1 ---
  let bal_A = INITIAL_BALANCE_A;
  let bal_B = INITIAL_BALANCE_B;
  let nonce_A = INITIAL_NONCE_A;
  let nonce_B = INITIAL_NONCE_B;

  // TX1: A sends 100 to B
  bal_A -= TX1_AMOUNT;    // 1000 - 100 = 900
  bal_B += TX1_AMOUNT;    // 500 + 100 = 600
  nonce_A += 1n;          // 0 → 1

  console.log(`\n   After TX1: A=(bal=${bal_A}, nonce=${nonce_A}), B=(bal=${bal_B}, nonce=${nonce_B})`);

  // TX2: B sends 50 to A
  bal_B -= TX2_AMOUNT;    // 600 - 50 = 550
  bal_A += TX2_AMOUNT;    // 900 + 50 = 950
  nonce_B += 1n;          // 0 → 1

  console.log(`   After TX2: A=(bal=${bal_A}, nonce=${nonce_A}), B=(bal=${bal_B}, nonce=${nonce_B})`);

  // Compute new state root
  const leaf0_new = accountLeaf(PUBKEY_A, bal_A, nonce_A);
  const leaf1_new = accountLeaf(PUBKEY_B, bal_B, nonce_B);
  const newRoot = stateRoot(leaf0_new, leaf1_new);

  console.log(`\n   New leaf 0: ${leaf0_new}`);
  console.log(`   New leaf 1: ${leaf1_new}`);
  console.log(`   New state root: ${newRoot}`);

  // --- Build circuit input ---
  const input = {
    // Public inputs
    oldStateRoot: oldRoot.toString(),
    newStateRoot: newRoot.toString(),

    // Account state (pre-batch)
    pubkey_0: PUBKEY_A.toString(),
    balance_0: INITIAL_BALANCE_A.toString(),
    nonce_0: INITIAL_NONCE_A.toString(),

    pubkey_1: PUBKEY_B.toString(),
    balance_1: INITIAL_BALANCE_B.toString(),
    nonce_1: INITIAL_NONCE_B.toString(),

    // Transaction 1
    tx1_from: TX1_FROM.toString(),
    tx1_to: TX1_TO.toString(),
    tx1_amount: TX1_AMOUNT.toString(),
    tx1_nonce: TX1_NONCE.toString(),

    // Transaction 2
    tx2_from: TX2_FROM.toString(),
    tx2_to: TX2_TO.toString(),
    tx2_amount: TX2_AMOUNT.toString(),
    tx2_nonce: TX2_NONCE.toString(),
  };

  return { input, oldRoot, newRoot };
}

// ============================================================
// Generate input from captured transaction file
// ============================================================

function generateFromCapturedTxs(txFilePath) {
  console.log(`Reading captured transactions from: ${txFilePath}\n`);
  const txData = JSON.parse(fs.readFileSync(txFilePath, "utf8"));

  // Expected format from frontend:
  // {
  //   accountA: { address, pubkeyId },
  //   accountB: { address, pubkeyId },
  //   initialBalanceA, initialBalanceB,
  //   initialNonceA, initialNonceB,
  //   transactions: [
  //     { from: 0|1, to: 0|1, amount, nonce, txHash }
  //   ]
  // }

  const PUBKEY_A = BigInt(txData.accountA?.pubkeyId || 1);
  const PUBKEY_B = BigInt(txData.accountB?.pubkeyId || 2);

  let bal_A = BigInt(txData.initialBalanceA);
  let bal_B = BigInt(txData.initialBalanceB);
  let nonce_A = BigInt(txData.initialNonceA || 0);
  let nonce_B = BigInt(txData.initialNonceB || 0);

  const leaf0_old = accountLeaf(PUBKEY_A, bal_A, nonce_A);
  const leaf1_old = accountLeaf(PUBKEY_B, bal_B, nonce_B);
  const oldRoot = stateRoot(leaf0_old, leaf1_old);

  const txs = txData.transactions;
  if (txs.length < 2) {
    throw new Error("Need at least 2 transactions for the batch");
  }

  const input = {
    oldStateRoot: oldRoot.toString(),
    pubkey_0: PUBKEY_A.toString(),
    balance_0: bal_A.toString(),
    nonce_0: nonce_A.toString(),
    pubkey_1: PUBKEY_B.toString(),
    balance_1: bal_B.toString(),
    nonce_1: nonce_B.toString(),
    tx1_from: txs[0].from.toString(),
    tx1_to: txs[0].to.toString(),
    tx1_amount: txs[0].amount.toString(),
    tx1_nonce: txs[0].nonce.toString(),
    tx2_from: txs[1].from.toString(),
    tx2_to: txs[1].to.toString(),
    tx2_amount: txs[1].amount.toString(),
    tx2_nonce: txs[1].nonce.toString(),
  };

  // Apply txs to compute new root
  const tx1 = txs[0];
  if (tx1.from === 0) {
    bal_A -= BigInt(tx1.amount);
    bal_B += BigInt(tx1.amount);
    nonce_A += 1n;
  } else {
    bal_B -= BigInt(tx1.amount);
    bal_A += BigInt(tx1.amount);
    nonce_B += 1n;
  }

  const tx2 = txs[1];
  if (tx2.from === 0) {
    bal_A -= BigInt(tx2.amount);
    bal_B += BigInt(tx2.amount);
    nonce_A += 1n;
  } else {
    bal_B -= BigInt(tx2.amount);
    bal_A += BigInt(tx2.amount);
    nonce_B += 1n;
  }

  const leaf0_new = accountLeaf(PUBKEY_A, bal_A, nonce_A);
  const leaf1_new = accountLeaf(PUBKEY_B, bal_B, nonce_B);
  const newRoot = stateRoot(leaf0_new, leaf1_new);

  input.newStateRoot = newRoot.toString();

  return { input, oldRoot, newRoot };
}

// ============================================================
// Main
// ============================================================

function main() {
  let result;

  const txFileArg = process.argv.indexOf("--tx-file");
  if (txFileArg !== -1 && process.argv[txFileArg + 1]) {
    result = generateFromCapturedTxs(process.argv[txFileArg + 1]);
  } else {
    result = generateDefaultInput();
  }

  const { input, oldRoot, newRoot } = result;

  // Write input.json
  const outputPath = path.join("build", "input.json");
  fs.mkdirSync("build", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(input, null, 2));

  // Also write roots for deployment script
  const rootsPath = path.join("build", "state_roots.json");
  fs.writeFileSync(
    rootsPath,
    JSON.stringify(
      {
        oldStateRoot: oldRoot.toString(),
        newStateRoot: newRoot.toString(),
      },
      null,
      2
    )
  );

  console.log("\n============================================");
  console.log("  ✅ Circuit Input Generated!");
  console.log("============================================");
  console.log(`  → ${outputPath}`);
  console.log(`  → ${rootsPath}`);
  console.log("\nNext step: node scripts/3_generate_proof.js");
}

main();

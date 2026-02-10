pragma circom 2.0.0;

// ============================================================
// ZK-Rollup Batch Verification Circuit
// ============================================================
// This circuit proves that a batch of 2 transactions correctly
// transforms an old state root into a new state root.
//
// State Model:
//   - 2 accounts (Account A at index 0, Account B at index 1)
//   - Each account leaf = Hash(pubkey, balance, nonce)
//   - State root = Hash(leaf_0, leaf_1)  [depth-1 Merkle tree]
//
// For each transaction the circuit enforces:
//   1. Sender has sufficient balance (no overspending)
//   2. Transaction nonce matches sender nonce (replay protection)
//   3. Balances are updated correctly
//   4. Nonces are incremented correctly
//   5. Deterministic state transition from old root to new root
// ============================================================

// ----------------------------------------------------------
// Helper: Poseidon hash (2 inputs → 1 output)
// We use a hand-rolled MiMC-style hash to avoid circomlib
// dependency issues. For production, replace with Poseidon.
// ----------------------------------------------------------
template HashTwo() {
    signal input in[2];
    signal output out;

    // Simple algebraic hash: H(a,b) = (a * b + a + b) mod p
    // This is NOT cryptographically secure — it is a PoC placeholder.
    // In production, use Poseidon from circomlib.
    signal ab;
    ab <== in[0] * in[1];
    out <== ab + in[0] + in[1] + 1;
}

// ----------------------------------------------------------
// Helper: Poseidon-like hash for 3 inputs (account leaf)
// leaf = Hash( Hash(pubkey, balance), nonce )
// ----------------------------------------------------------
template HashThree() {
    signal input in[3];
    signal output out;

    component h1 = HashTwo();
    h1.in[0] <== in[0];
    h1.in[1] <== in[1];

    component h2 = HashTwo();
    h2.in[0] <== h1.out;
    h2.in[1] <== in[2];

    out <== h2.out;
}

// ----------------------------------------------------------
// Helper: Range check that a value is non-negative
// Decomposes value into nBits bits to prove 0 <= value < 2^nBits
// ----------------------------------------------------------
template RangeCheck(nBits) {
    signal input in;
    signal bits[nBits];

    var bitSum = 0;
    for (var i = 0; i < nBits; i++) {
        bits[i] <-- (in >> i) & 1;
        bits[i] * (bits[i] - 1) === 0;  // each bit is 0 or 1
        bitSum += bits[i] * (1 << i);
    }
    bitSum === in;
}

// ----------------------------------------------------------
// Helper: Conditional select
// out = condition * ifTrue + (1 - condition) * ifFalse
// ----------------------------------------------------------
template Select() {
    signal input condition;
    signal input ifTrue;
    signal input ifFalse;
    signal output out;

    signal diff;
    diff <== ifTrue - ifFalse;
    signal condDiff;
    condDiff <== condition * diff;
    out <== ifFalse + condDiff;
}

// ============================================================
// Main Circuit: BatchVerify
// ============================================================
// Proves correct state transition for a batch of 2 transactions
// between 2 accounts on a simplified rollup.
//
// Public inputs:  oldStateRoot, newStateRoot
// Private inputs: account data, transaction data
// ============================================================
template BatchVerify() {
    // ---- PUBLIC INPUTS ----
    signal input oldStateRoot;
    signal input newStateRoot;

    // ---- PRIVATE INPUTS: Initial account state ----
    signal input pubkey_0;      // Account A identifier
    signal input balance_0;     // Account A starting balance
    signal input nonce_0;       // Account A starting nonce

    signal input pubkey_1;      // Account B identifier
    signal input balance_1;     // Account B starting balance
    signal input nonce_1;       // Account B starting nonce

    // ---- PRIVATE INPUTS: Transaction 1 ----
    signal input tx1_from;      // 0 = Account A, 1 = Account B
    signal input tx1_to;        // 0 = Account A, 1 = Account B
    signal input tx1_amount;    // transfer amount (in wei-scaled units)
    signal input tx1_nonce;     // expected sender nonce

    // ---- PRIVATE INPUTS: Transaction 2 ----
    signal input tx2_from;      // 0 = Account A, 1 = Account B
    signal input tx2_to;        // 0 = Account A, 1 = Account B
    signal input tx2_amount;    // transfer amount
    signal input tx2_nonce;     // expected sender nonce

    // ========================================================
    // STEP 1: Verify old state root
    // ========================================================
    component leaf0_old = HashThree();
    leaf0_old.in[0] <== pubkey_0;
    leaf0_old.in[1] <== balance_0;
    leaf0_old.in[2] <== nonce_0;

    component leaf1_old = HashThree();
    leaf1_old.in[0] <== pubkey_1;
    leaf1_old.in[1] <== balance_1;
    leaf1_old.in[2] <== nonce_1;

    component root_old = HashTwo();
    root_old.in[0] <== leaf0_old.out;
    root_old.in[1] <== leaf1_old.out;

    // Constrain: computed old root must match the public input
    root_old.out === oldStateRoot;

    // ========================================================
    // STEP 2: Validate and apply Transaction 1
    // ========================================================

    // tx1_from must be 0 or 1
    tx1_from * (tx1_from - 1) === 0;
    tx1_to * (tx1_to - 1) === 0;
    // from != to
    signal tx1_diff;
    tx1_diff <== tx1_from - tx1_to;
    signal tx1_diff_sq;
    tx1_diff_sq <== tx1_diff * tx1_diff;
    tx1_diff_sq === 1;  // |from - to| = 1

    // Select sender/receiver balances and nonces
    // If tx1_from == 0: sender is account 0, receiver is account 1
    // If tx1_from == 1: sender is account 1, receiver is account 0
    component sel_sender_bal_1 = Select();
    sel_sender_bal_1.condition <== tx1_from;
    sel_sender_bal_1.ifTrue <== balance_1;
    sel_sender_bal_1.ifFalse <== balance_0;

    component sel_sender_nonce_1 = Select();
    sel_sender_nonce_1.condition <== tx1_from;
    sel_sender_nonce_1.ifTrue <== nonce_1;
    sel_sender_nonce_1.ifFalse <== nonce_0;

    component sel_recv_bal_1 = Select();
    sel_recv_bal_1.condition <== tx1_from;
    sel_recv_bal_1.ifTrue <== balance_0;
    sel_recv_bal_1.ifFalse <== balance_1;

    // Verify nonce matches
    sel_sender_nonce_1.out === tx1_nonce;

    // Verify sender has sufficient balance (no overspending)
    // sender_balance - amount >= 0
    signal tx1_remaining;
    tx1_remaining <== sel_sender_bal_1.out - tx1_amount;
    component tx1_range = RangeCheck(64);
    tx1_range.in <== tx1_remaining;

    // Compute post-tx1 balances
    signal post_tx1_sender_bal;
    post_tx1_sender_bal <== sel_sender_bal_1.out - tx1_amount;
    signal post_tx1_recv_bal;
    post_tx1_recv_bal <== sel_recv_bal_1.out + tx1_amount;
    signal post_tx1_sender_nonce;
    post_tx1_sender_nonce <== sel_sender_nonce_1.out + 1;

    // Map back to account indices
    // After tx1: account 0 and account 1 balances/nonces
    component post1_bal0 = Select();
    post1_bal0.condition <== tx1_from;
    post1_bal0.ifTrue <== post_tx1_recv_bal;      // acct 0 was receiver
    post1_bal0.ifFalse <== post_tx1_sender_bal;    // acct 0 was sender

    component post1_bal1 = Select();
    post1_bal1.condition <== tx1_from;
    post1_bal1.ifTrue <== post_tx1_sender_bal;     // acct 1 was sender
    post1_bal1.ifFalse <== post_tx1_recv_bal;      // acct 1 was receiver

    component post1_nonce0 = Select();
    post1_nonce0.condition <== tx1_from;
    post1_nonce0.ifTrue <== nonce_0;                        // acct 0 unchanged
    post1_nonce0.ifFalse <== post_tx1_sender_nonce;          // acct 0 was sender

    component post1_nonce1 = Select();
    post1_nonce1.condition <== tx1_from;
    post1_nonce1.ifTrue <== post_tx1_sender_nonce;  // acct 1 was sender
    post1_nonce1.ifFalse <== nonce_1;                        // acct 1 unchanged

    // ========================================================
    // STEP 3: Validate and apply Transaction 2
    // ========================================================

    tx2_from * (tx2_from - 1) === 0;
    tx2_to * (tx2_to - 1) === 0;
    signal tx2_diff;
    tx2_diff <== tx2_from - tx2_to;
    signal tx2_diff_sq;
    tx2_diff_sq <== tx2_diff * tx2_diff;
    tx2_diff_sq === 1;

    component sel_sender_bal_2 = Select();
    sel_sender_bal_2.condition <== tx2_from;
    sel_sender_bal_2.ifTrue <== post1_bal1.out;
    sel_sender_bal_2.ifFalse <== post1_bal0.out;

    component sel_sender_nonce_2 = Select();
    sel_sender_nonce_2.condition <== tx2_from;
    sel_sender_nonce_2.ifTrue <== post1_nonce1.out;
    sel_sender_nonce_2.ifFalse <== post1_nonce0.out;

    component sel_recv_bal_2 = Select();
    sel_recv_bal_2.condition <== tx2_from;
    sel_recv_bal_2.ifTrue <== post1_bal0.out;
    sel_recv_bal_2.ifFalse <== post1_bal1.out;

    // Verify nonce
    sel_sender_nonce_2.out === tx2_nonce;

    // Verify sufficient balance
    signal tx2_remaining;
    tx2_remaining <== sel_sender_bal_2.out - tx2_amount;
    component tx2_range = RangeCheck(64);
    tx2_range.in <== tx2_remaining;

    // Compute post-tx2 balances
    signal post_tx2_sender_bal;
    post_tx2_sender_bal <== sel_sender_bal_2.out - tx2_amount;
    signal post_tx2_recv_bal;
    post_tx2_recv_bal <== sel_recv_bal_2.out + tx2_amount;
    signal post_tx2_sender_nonce;
    post_tx2_sender_nonce <== sel_sender_nonce_2.out + 1;

    // Map back to account indices
    component final_bal0 = Select();
    final_bal0.condition <== tx2_from;
    final_bal0.ifTrue <== post_tx2_recv_bal;
    final_bal0.ifFalse <== post_tx2_sender_bal;

    component final_bal1 = Select();
    final_bal1.condition <== tx2_from;
    final_bal1.ifTrue <== post_tx2_sender_bal;
    final_bal1.ifFalse <== post_tx2_recv_bal;

    component final_nonce0 = Select();
    final_nonce0.condition <== tx2_from;
    final_nonce0.ifTrue <== post1_nonce0.out;
    final_nonce0.ifFalse <== post_tx2_sender_nonce;

    component final_nonce1 = Select();
    final_nonce1.condition <== tx2_from;
    final_nonce1.ifTrue <== post_tx2_sender_nonce;
    final_nonce1.ifFalse <== post1_nonce1.out;

    // ========================================================
    // STEP 4: Compute and verify new state root
    // ========================================================
    component leaf0_new = HashThree();
    leaf0_new.in[0] <== pubkey_0;
    leaf0_new.in[1] <== final_bal0.out;
    leaf0_new.in[2] <== final_nonce0.out;

    component leaf1_new = HashThree();
    leaf1_new.in[0] <== pubkey_1;
    leaf1_new.in[1] <== final_bal1.out;
    leaf1_new.in[2] <== final_nonce1.out;

    component root_new = HashTwo();
    root_new.in[0] <== leaf0_new.out;
    root_new.in[1] <== leaf1_new.out;

    // Constrain: computed new root must match the public input
    root_new.out === newStateRoot;
}

// Instantiate the main component
// Public inputs: oldStateRoot, newStateRoot
component main {public [oldStateRoot, newStateRoot]} = BatchVerify();

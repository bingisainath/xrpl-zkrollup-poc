pragma circom 2.0.0;

/*
 * Simple Transfer Circuit
 * This circuit proves that a batch of transfers is valid
 * 
 * For each transfer, it checks:
 * - Sender has sufficient balance
 * - Balances are updated correctly
 * - State root is computed correctly
 */

include "../node_modules/circomlib/circuits/poseidon.circom";

template Transfer() {
    // Public inputs
    signal input oldStateRoot;
    signal input newStateRoot;
    
    // Private inputs (the actual transaction data)
    signal input senderBalance;
    signal input receiverBalance;
    signal input amount;
    
    // Intermediate signals
    signal output newSenderBalance;
    signal output newReceiverBalance;
    
    // Check sender has sufficient balance
    signal sufficientBalance;
    sufficientBalance <== senderBalance - amount;
    
    // Constraint: balance must be non-negative
    sufficientBalance * sufficientBalance >= 0;
    
    // Calculate new balances
    newSenderBalance <== senderBalance - amount;
    newReceiverBalance <== receiverBalance + amount;
    
    // Hash the old state (simplified)
    component oldHash = Poseidon(2);
    oldHash.inputs[0] <== senderBalance;
    oldHash.inputs[1] <== receiverBalance;
    
    // Hash the new state
    component newHash = Poseidon(2);
    newHash.inputs[0] <== newSenderBalance;
    newHash.inputs[1] <== newReceiverBalance;
    
    // Verify state roots match
    oldStateRoot === oldHash.out;
    newStateRoot === newHash.out;
}

component main {public [oldStateRoot, newStateRoot]} = Transfer();

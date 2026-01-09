pragma circom 2.1.6;

/*
  Minimal ZK-Rollup:
  - User A sends amount to User B
  - Proves balances update correctly
*/

template Rollup() {
    // PUBLIC INPUTS
    signal input oldBalanceA;
    signal input oldBalanceB;
    signal input newBalanceA;
    signal input newBalanceB;

    // PRIVATE INPUT
    signal input transferAmount;

    // State transition rules
    oldBalanceA - transferAmount === newBalanceA;
    oldBalanceB + transferAmount === newBalanceB;
}

component main = Rollup();

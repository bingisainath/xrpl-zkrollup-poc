pragma circom 2.1.6;

template Rollup() {
    signal input oldBalanceA;
    signal input oldBalanceB;
    signal input oldBalanceC;

    signal input transferAtoC;
    signal input transferBtoC;

    signal output newBalanceA;
    signal output newBalanceB;
    signal output newBalanceC;
    signal output totalTransferred;

    // --- simple computation, remove invalid >= check ---
    signal enoughA;
    signal enoughB;

    enoughA <== oldBalanceA - transferAtoC;
    enoughB <== oldBalanceB - transferBtoC;

    // --- state transition ---
    newBalanceA <== oldBalanceA - transferAtoC;
    newBalanceB <== oldBalanceB - transferBtoC;
    newBalanceC <== oldBalanceC + transferAtoC + transferBtoC;

    totalTransferred <== transferAtoC + transferBtoC;
}

component main = Rollup();

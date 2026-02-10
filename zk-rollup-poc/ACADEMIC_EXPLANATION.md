# ZK-Rollup Proof of Concept — Academic Explanation

## 1. Introduction

This document provides a rigorous academic explanation of the ZK-Rollup Proof of Concept (PoC), suitable for inclusion in a Master's dissertation. It covers the theoretical foundations, architecture, implementation decisions, mapping to production systems, and honest discussion of limitations.

---

## 2. How L2 Transactions Are Batched

### 2.1 The Rollup Execution Model

In a ZK-Rollup, Layer 2 (L2) transactions are executed off-chain but their correctness is guaranteed by on-chain verification. The key insight is that verifying a proof of computation is far cheaper than re-executing the computation itself.

The batching process in this PoC follows the canonical rollup pipeline:

1. **Transaction Origination**: Users sign transactions using their wallets (MetaMask). In this PoC, these are real testnet ETH transfers that represent L2 operations.

2. **Transaction Collection**: A rollup operator collects confirmed transactions from the network. Each transaction captures: sender address, receiver address, transfer amount, nonce, and transaction hash.

3. **Batch Construction**: The operator groups transactions into a batch and constructs the state transition:
   - **Pre-state (`oldStateRoot`)**: A cryptographic commitment (hash) to all account states before the batch.
   - **Transaction list**: The ordered sequence of transactions to apply.
   - **Post-state (`newStateRoot`)**: The resulting state commitment after applying all transactions.

4. **State Model**: Account states are represented as leaves in a Merkle-like structure. Each leaf is `Hash(pubkey, balance, nonce)`. The state root is computed as `Hash(leaf_0, leaf_1, ..., leaf_n)`. This PoC uses a depth-1 tree with 2 accounts, extensible to arbitrary depth.

### 2.2 Deterministic State Transitions

The batch is a pure function: given the same `oldStateRoot` and the same ordered transactions, the resulting `newStateRoot` is always identical. This determinism is essential — it means any party can independently verify the transition by replaying the transactions.

---

## 3. How the zk-SNARK Guarantees Correctness

### 3.1 Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge

A zk-SNARK is a cryptographic proof system with three properties:

- **Zero-Knowledge**: The proof reveals nothing about the private inputs (transaction details, balances) beyond what is implied by the public inputs (state roots).
- **Succinct**: The proof is constant-size (~256 bytes for Groth16) regardless of the computation's complexity.
- **Non-Interactive**: The proof is generated once and can be verified by anyone without further communication.

### 3.2 The Arithmetic Circuit

The core of the ZK system is an arithmetic circuit written in circom. This circuit encodes the rollup's transition rules as polynomial constraints over a finite field (BN128 scalar field, order ≈ 2^254).

**Public inputs** (known to the verifier):
- `oldStateRoot` — commitment to pre-batch state
- `newStateRoot` — commitment to post-batch state

**Private inputs** (known only to the prover):
- Account balances, nonces, and identifiers
- Transaction details (from, to, amount, nonce)

**Constraints enforced by the circuit:**

1. **State Root Integrity**: The circuit recomputes the `oldStateRoot` from the provided account data and constrains it to equal the public input. This proves the prover knows the actual account states.

2. **Balance Sufficiency**: For each transaction, `sender_balance - amount ≥ 0` is enforced via range-check decomposition (proving the result fits in 64 bits).

3. **Nonce Correctness**: Each transaction's nonce must match the sender's current nonce, preventing replay attacks. After processing, the sender's nonce is incremented.

4. **Correct Balance Updates**: Sender balance decreases by the transfer amount; receiver balance increases by the same amount. Conservation of value is implicit.

5. **New State Root**: After applying all transactions, the circuit recomputes the state root from updated account data and constrains it to equal the `newStateRoot` public input.

### 3.3 The Groth16 Proof System

This PoC uses Groth16, the most widely deployed zk-SNARK scheme:

- **Trusted Setup**: A one-time ceremony generates the proving key and verification key. The ceremony uses "Powers of Tau" (universal phase) followed by a circuit-specific phase. Security relies on at least one honest participant in the ceremony.

- **Proof Generation**: The prover uses the witness (all input values satisfying the constraints) and the proving key to produce a proof consisting of three elliptic curve points (π_A, π_B, π_C).

- **Proof Verification**: The verifier uses only the verification key, public inputs, and the proof. Verification involves a constant number of elliptic curve pairing operations (bilinear maps on BN128), making it extremely efficient — O(1) regardless of circuit size.

### 3.4 Soundness Guarantee

The Groth16 scheme provides computational soundness: under the q-PKE, d-PDH, and q-SDH assumptions on BN128, no polynomial-time adversary can produce a valid proof for a false statement except with negligible probability. Concretely, this means:

- A valid proof for `(oldStateRoot, newStateRoot)` guarantees that there exist valid transactions transforming the old state into the new state.
- The prover cannot forge a proof for an invalid transition (e.g., overspending, wrong nonce, fabricated balances).

---

## 4. How On-Chain Verification Works

### 4.1 The Verification Contract

The on-chain verification consists of two contracts:

**Groth16Verifier.sol** (generated by snarkjs):
- Implements the Groth16 verification equation: `e(π_A, π_B) = e(α, β) · e(L, γ) · e(π_C, δ)`
- Where `e` is the BN128 pairing, and `α, β, γ, δ` are verification key elements
- Uses Ethereum precompiled contracts for elliptic curve operations (EIP-196, EIP-197):
  - `ecAdd` (0x06), `ecMul` (0x07), `ecPairing` (0x08)
- Gas cost: ~200,000–300,000 gas regardless of the batch size

**Rollup.sol** (the state manager):
1. Receives `submitBatch(pA, pB, pC, oldStateRoot, newStateRoot)`
2. Checks `oldStateRoot` matches the current on-chain state root (prevents out-of-order submissions)
3. Calls `Verifier.verifyProof(pA, pB, pC, [oldStateRoot, newStateRoot])`
4. If verification succeeds: updates `stateRoot = newStateRoot` and increments `batchCount`
5. If verification fails: reverts the transaction

### 4.2 Security Properties

The on-chain verification provides:

- **Validity**: Only state transitions backed by a valid zk-SNARK proof are accepted. Invalid batches are rejected at the EVM level.
- **Ordering**: The `oldStateRoot` check ensures batches are applied sequentially and no state transitions are skipped.
- **Finality**: Once a batch is verified and the state root updated, the transition is final (subject to the underlying L1's finality guarantees).
- **Transparency**: The verification is fully on-chain and auditable by any party.

---

## 5. Mapping to Production ZK-Rollup Systems

### 5.1 zkSync (Era)

| Aspect | This PoC | zkSync Era |
|--------|----------|------------|
| Proof system | Groth16 (snarkjs) | Custom PLONK + FRI (Boojum) |
| Circuit | circom (R1CS) | Custom Rust prover |
| State model | 2-account Merkle tree | Full Sparse Merkle Tree (depth 256) |
| Transactions/batch | 2 | Hundreds to thousands |
| Data availability | Not implemented | On-chain calldata (L1 DA) |
| Operator | Single centralized | Sequencer with decentralization roadmap |
| EVM compatibility | N/A (simplified model) | zkEVM (bytecode-level) |

**Architectural parallel**: Both systems follow the same pipeline: batch transactions → generate validity proof → verify on L1 → update state root. zkSync's Boojum prover generates STARK proofs that are recursively compressed into a SNARK for cheaper L1 verification.

### 5.2 Scroll

| Aspect | This PoC | Scroll |
|--------|----------|--------|
| Proof system | Groth16 | Halo2-based (KZG) |
| Circuit | Hand-written circom | zk-circuits for EVM opcodes |
| Prover | Client-side (snarkjs) | Distributed GPU prover network |
| Verification | Single verifier contract | Multi-layer verification pipeline |

**Architectural parallel**: Scroll and this PoC share the core concept of encoding state transition rules as arithmetic constraints. Scroll extends this to full EVM opcode coverage (zkEVM Type 2), proving that every EVM instruction in a block was executed correctly.

### 5.3 StarkNet

| Aspect | This PoC | StarkNet |
|--------|----------|----------|
| Proof system | Groth16 (pairing-based) | STARKs (hash-based, no trusted setup) |
| Field | BN128 scalar field | Stark-friendly prime field (2^251 + 17·2^192 + 1) |
| Trusted setup | Required (Powers of Tau) | Not required (transparent setup) |
| Post-quantum | No (pairing-based) | Yes (hash-based) |
| Proof size | ~256 bytes | ~50–200 KB |
| Verification cost | ~200K gas (pairing check) | ~500K–1M gas (FRI verification) |

**Key difference**: StarkNet uses STARKs instead of SNARKs, eliminating the trusted setup requirement at the cost of larger proofs. The Cairo VM replaces the EVM for execution.

### 5.4 Shared Architecture

Despite implementation differences, all production ZK-Rollups share this PoC's core architecture:

```
User Txs → Sequencer/Operator → Batch → Prover → Proof → L1 Verifier → State Root Update
```

This PoC implements each stage of this pipeline in a minimal but functionally complete manner.

---

## 6. Alignment with XRPL EVM Sidechain Architecture

### 6.1 XRPL EVM Sidechain Overview

The XRPL EVM Sidechain is an EVM-compatible blockchain connected to the XRP Ledger via a bridge. It supports standard EVM operations including:
- Solidity smart contracts
- EVM precompiles (required for Groth16 verification)
- MetaMask connectivity
- Standard JSON-RPC interface

### 6.2 Compatibility

This PoC is directly deployable to the XRPL EVM Sidechain because:

1. **EVM Precompiles**: The Groth16 verifier requires `ecAdd`, `ecMul`, and `ecPairing` precompiles. These are part of the EVM specification and are available on the XRPL EVM Sidechain.

2. **Solidity Support**: Both `Rollup.sol` and `Verifier.sol` are standard Solidity 0.8.20 contracts.

3. **MetaMask Integration**: The frontend connects to the XRPL EVM Sidechain via MetaMask using the custom RPC endpoint.

4. **Potential Applications**: A ZK-Rollup on the XRPL EVM Sidechain could provide scalability for DeFi applications, payment channels, or cross-chain state verification between the sidechain and the XRP Ledger.

---

## 7. Limitations

This PoC is designed to demonstrate core ZK-Rollup concepts with academic rigour. The following limitations are intentional simplifications that would be addressed in a production system:

### 7.1 Simplified State Model

**Limitation**: The PoC uses a depth-1 Merkle tree with 2 accounts and a simplified hash function.

**Production requirement**: Production rollups use Sparse Merkle Trees (depth 160–256) with cryptographically secure hash functions (Poseidon, which is SNARK-friendly) to support millions of accounts. The simplified hash (`H(a,b) = a·b + a + b + 1`) is algebraically structured but not collision-resistant; it serves only to demonstrate the state commitment mechanism.

**Extension path**: Replace `HashTwo` with circomlib's Poseidon template and extend the tree depth. The circuit structure (verify old root → apply transactions → verify new root) remains identical.

### 7.2 Centralized Rollup Operator

**Limitation**: A single operator (the deployer) collects transactions and submits proofs.

**Production requirement**: Production rollups implement sequencer decentralization (shared sequencing, based sequencing, or committee-based sequencing) to prevent censorship and ensure liveness.

**Implication**: The centralized operator could theoretically censor transactions (refuse to include them in batches) but cannot forge invalid state transitions (the zk-SNARK prevents this).

### 7.3 No Data Availability Layer

**Limitation**: Transaction data is not posted on-chain. Only the state roots and proof are on-chain.

**Production requirement**: ZK-Rollups must post transaction data (or state diffs) to L1 to ensure that anyone can reconstruct the L2 state. Without this, users could lose access to their funds if the operator disappears. Solutions include: calldata posting (Scroll, zkSync), EIP-4844 blobs, or dedicated DA layers (Celestia, EigenDA).

### 7.4 No Fraud/Challenge Period

**Limitation**: State transitions are immediately final once the proof is verified.

**Note**: This is actually correct behaviour for a ZK-Rollup (as opposed to an Optimistic Rollup). ZK-Rollups provide immediate finality because validity proofs guarantee correctness at submission time. The absence of a challenge period is a feature, not a limitation. Optimistic Rollups, by contrast, require a 7-day challenge period because they assume optimistic execution and rely on fraud proofs for security.

### 7.5 Fixed Batch Size

**Limitation**: The circuit processes exactly 2 transactions per batch.

**Production requirement**: Production circuits support variable-length batches (hundreds to thousands of transactions) through recursive proof composition or flexible circuit designs. Recursive SNARKs (e.g., Nova, SNARK-on-SNARK) allow aggregating multiple batch proofs into a single proof for L1 submission.

### 7.6 Simplified Transaction Model

**Limitation**: Only simple ETH transfers between two accounts are supported.

**Production requirement**: Full zkEVM implementations (zkSync, Scroll) support arbitrary smart contract execution by proving correct execution of every EVM opcode within the zk circuit.

---

## 8. Conclusion

This PoC demonstrates that the fundamental ZK-Rollup architecture — batch L2 transactions, generate a validity proof, verify on-chain, update state — is both implementable and functional with real testnet transactions. Despite its simplifications, every component maps directly to a production equivalent, making it a sound foundation for understanding and evaluating ZK-Rollup technology.

The key insight is the separation of execution (off-chain, by the operator) from verification (on-chain, by the proof system). This separation is what enables ZK-Rollups to scale: the L1 chain only needs to verify a constant-size proof, regardless of how many transactions were processed off-chain.

---

## References

1. Ben-Sasson, E., et al. "Scalable, transparent, and post-quantum secure computational integrity." *IACR Cryptology ePrint Archive* (2018).
2. Groth, J. "On the size of pairing-based non-interactive arguments." *EUROCRYPT 2016*.
3. Buterin, V. "An Incomplete Guide to Rollups." *vitalik.ca* (2021).
4. zkSync documentation: https://docs.zksync.io
5. Scroll documentation: https://docs.scroll.io
6. XRPL EVM Sidechain: https://docs.xrpl.org/evm-sidechain
7. circom & snarkjs: https://docs.circom.io
8. EIP-196/197: Precompiled contracts for elliptic curve operations on BN128.

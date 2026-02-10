# ZK Rollup Tutorial for XRPL EVM

## What is a ZK Rollup?

A **Zero-Knowledge Rollup** is a Layer 2 scaling solution that:
- **Batches** multiple transactions together off-chain
- **Generates** a cryptographic proof (ZK-SNARK) that these transactions are valid
- **Submits** only the proof and new state to Layer 1 (XRPL EVM)
- **Reduces** costs by ~100x compared to processing each transaction on L1

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Users                                │
│  (Submit transactions to off-chain operator)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Off-Chain Operator                      │
│  1. Collects transactions                                │
│  2. Executes them to compute new state                   │
│  3. Generates ZK proof of validity                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              XRPL EVM (Layer 1)                          │
│  ┌─────────────────────────────────────┐                │
│  │     SimpleRollup Contract           │                │
│  │  - Stores current state root        │                │
│  │  - Verifies ZK proofs               │                │
│  │  - Updates state root if valid      │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. State Management

The rollup maintains a **state root** (Merkle root) representing all account balances:

```
State Root = Hash(Account1_Balance, Account2_Balance, ...)
```

### 2. Transaction Processing

**On XRPL EVM (L1):**
- Cost per transaction: ~$0.10 - $1.00
- TPS: ~10-15

**On ZK Rollup (L2):**
- Cost per transaction: ~$0.001 - $0.01
- TPS: ~2000+
- Process 100 transactions in one L1 batch!

### 3. Zero-Knowledge Proofs

A ZK proof proves that:
```
"I executed these 100 transactions correctly,
 and the new state root is valid"
```

Without revealing the actual transaction details!

## Step-by-Step Usage

### Step 1: Installation

```bash
cd zk-rollup-xrpl
npm install
```

### Step 2: Configuration

Create a `.env` file:
```bash
cp .env.example .env
# Edit .env and add your private key
```

### Step 3: Compile Contracts

```bash
npx hardhat compile
```

### Step 4: Run Tests

```bash
npx hardhat test
```

Expected output:
```
  SimpleRollup
    Deployment
      ✔ Should set the correct initial state root
      ✔ Should set the correct operator
    Deposits
      ✔ Should allow users to deposit ETH
    Batch Submission
      ✔ Should allow operator to submit batch with valid proof
      ...
```

### Step 5: Run Complete Demo

```bash
npx hardhat run scripts/demo.js
```

This runs a full demo showing:
1. Contract deployment
2. User deposits
3. Off-chain transaction batching
4. ZK proof generation
5. Batch submission to XRPL EVM

### Step 6: Deploy to XRPL EVM Testnet

```bash
# Deploy to testnet
npm run deploy:testnet

# Generate a proof
npm run generate-proof

# Submit the batch
npx hardhat run scripts/submit-batch.js --network xrpl-evm-testnet
```

## Understanding the Code

### SimpleRollup.sol

```solidity
// The main rollup contract
contract SimpleRollup {
    bytes32 public stateRoot;  // Current state
    IVerifier public verifier;  // ZK proof verifier
    
    function submitBatch(
        bytes32 _newStateRoot,
        bytes calldata _proof,
        uint256[] calldata _publicInputs
    ) external {
        // 1. Verify the ZK proof
        require(verifier.verifyProof(_proof, _publicInputs));
        
        // 2. Verify old state root matches
        require(bytes32(_publicInputs[0]) == stateRoot);
        
        // 3. Update to new state root
        stateRoot = _newStateRoot;
    }
}
```

### Key Concepts

**State Root**: A cryptographic commitment to the entire rollup state
- Similar to a Merkle root
- Changes with every batch
- Allows efficient state verification

**ZK Proof**: Cryptographic proof that transactions are valid
- Generated off-chain using circom/snarkjs
- Verified on-chain in ~200k gas (constant regardless of batch size!)
- Proves correctness without revealing details

**Batch**: A collection of transactions processed together
- Reduces costs by amortizing L1 gas
- 100 transactions in one batch = 100x cheaper per transaction

## Production Considerations

This is a simplified educational example. A production ZK rollup needs:

### 1. Circuit Design
```circom
// Real circuits are much more complex
template BalanceUpdate() {
    // Verify signature
    // Check balance >= amount
    // Update balances
    // Compute new Merkle root
    // ...hundreds of constraints...
}
```

### 2. Data Availability
- Store transaction data on-chain or via DA layer
- Users need data to reconstruct state
- Consider: Ethereum calldata, XRPL, Celestia, etc.

### 3. Withdrawal Mechanism
```solidity
function withdraw(
    uint256 amount,
    bytes32[] proof  // Merkle proof of balance
) external {
    // Verify proof against state root
    // Transfer funds to user
}
```

### 4. Force Inclusion
- Allow users to force their transactions on-chain
- Prevents censorship by operator

### 5. Decentralization
- Multiple operators or sequencer rotation
- Decentralized proof generation
- Governance for upgrades

### 6. Security
- Formal verification of circuits
- Multiple audits
- Bug bounty programs
- Gradual decentralization

## Real-World ZK Rollups

Popular production ZK rollups include:

- **zkSync Era**: General-purpose EVM-compatible
- **StarkNet**: Custom VM with Cairo language
- **Polygon zkEVM**: EVM-equivalent rollup
- **Scroll**: Bytecode-level EVM compatibility

## Resources

- [Vitalik's Rollup Guide](https://vitalik.ca/general/2021/01/05/rollup.html)
- [zkSNARKs Explained](https://z.cash/technology/zksnarks/)
- [Circom Documentation](https://docs.circom.io/)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [XRPL EVM Documentation](https://docs.xrplevm.org/)

## Next Steps

1. **Implement Real Circuits**: Use circom to build actual ZK circuits
2. **Add Data Availability**: Store transaction data on-chain
3. **Build Withdrawal System**: Allow users to exit the rollup
4. **Create SDK**: Build tools for users and developers
5. **Optimize Gas**: Minimize on-chain verification costs
6. **Add Governance**: Decentralize the operator role

## Questions?

This example demonstrates the core concepts of ZK rollups. For production use:
- Study existing rollup implementations
- Understand ZK cryptography deeply
- Consider security implications carefully
- Work with experienced cryptographers

Happy building! 🚀

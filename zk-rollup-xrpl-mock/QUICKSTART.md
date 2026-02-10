# Quick Start Guide

Get your ZK Rollup running in 5 minutes!

## Prerequisites

- Node.js v16 or higher
- Basic understanding of Ethereum/EVM
- Some test ETH on XRPL EVM testnet (optional, for deployment)

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. (Optional) Add your private key to .env for testnet deployment
# PRIVATE_KEY=your_private_key_here
```

## Quick Demo (Local)

Run the complete demo on a local Hardhat network:

```bash
npx hardhat run scripts/demo.js
```

This will:
- ✅ Deploy the rollup contracts
- ✅ Simulate user deposits
- ✅ Process transactions in batches
- ✅ Generate ZK proofs
- ✅ Submit batches on-chain

## Run Tests

```bash
npx hardhat test
```

Expected output:
```
  SimpleRollup
    ✔ Should set the correct initial state root
    ✔ Should allow users to deposit ETH
    ✔ Should allow operator to submit batch with valid proof
    ✔ Should reject batch from non-operator
    ...
  20 passing (2s)
```

## Deploy to XRPL EVM Testnet

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy to testnet
npm run deploy:testnet

# 3. Generate a proof for a batch
npm run generate-proof

# 4. Submit the batch
npx hardhat run scripts/submit-batch.js --network xrpl-evm-testnet
```

## Project Structure

```
zk-rollup-xrpl/
├── contracts/           # Solidity smart contracts
│   ├── SimpleRollup.sol    # Main rollup contract
│   ├── Verifier.sol        # ZK proof verifier
│   └── IVerifier.sol       # Verifier interface
├── circuits/            # Circom circuits (for ZK proofs)
│   └── transfer.circom     # Transfer validation circuit
├── scripts/             # Deployment and interaction scripts
│   ├── deploy.js           # Deploy contracts
│   ├── demo.js             # Complete demo
│   ├── generate-proof.js   # Generate ZK proofs
│   └── submit-batch.js     # Submit batches
├── test/                # Contract tests
│   └── SimpleRollup.test.js
├── hardhat.config.js    # Hardhat configuration
├── package.json         # Dependencies
├── README.md           # Project overview
├── TUTORIAL.md         # Detailed tutorial
└── QUICKSTART.md       # This file
```

## Understanding the Flow

### 1. Deploy Contracts
```javascript
// Deploy verifier and rollup
const verifier = await Verifier.deploy();
const rollup = await SimpleRollup.deploy(verifier.address, initialStateRoot);
```

### 2. Users Deposit
```javascript
// Users deposit ETH into the rollup
await rollup.connect(user1).deposit({ value: ethers.parseEther("1.0") });
```

### 3. Process Transactions Off-Chain
```javascript
// Operator batches transactions
const transactions = [
    { from: user1, to: user2, amount: "0.5" },
    { from: user2, to: user3, amount: "0.3" },
    // ... 100s more transactions
];
```

### 4. Generate ZK Proof
```javascript
// Generate proof that batch is valid
const proof = await generateProof(transactions, oldStateRoot);
```

### 5. Submit Batch On-Chain
```javascript
// Submit proof and new state to L1
await rollup.submitBatch(newStateRoot, proof, publicInputs);
```

## Key Concepts

**State Root**: Cryptographic commitment to all account balances
```
StateRoot = Hash(Balance1, Balance2, Balance3, ...)
```

**ZK Proof**: Proves "I computed the new state correctly" without revealing details

**Batch**: Group of transactions processed together
- 1 transaction on L1 = $0.50
- 100 transactions in rollup batch = $0.50 total = $0.005 each!

## Common Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run single test file
npx hardhat test test/SimpleRollup.test.js

# Deploy to testnet
npm run deploy:testnet

# Run complete demo
npx hardhat run scripts/demo.js

# Check contract size
npx hardhat size-contracts
```

## Troubleshooting

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### "Insufficient funds"
Get test ETH from XRPL EVM testnet faucet

### "Nonce too low"
Reset your account nonce:
```bash
npx hardhat clean
```

## Next Steps

1. **Read the Tutorial**: Check `TUTORIAL.md` for detailed explanations
2. **Modify the Circuit**: Edit `circuits/transfer.circom` to add features
3. **Add More Tests**: Expand `test/SimpleRollup.test.js`
4. **Deploy to Mainnet**: Follow deployment guide in README
5. **Build a Frontend**: Create a UI for users to interact with the rollup

## Learn More

- 📚 [Full Tutorial](TUTORIAL.md)
- 📖 [XRPL EVM Docs](https://docs.xrplevm.org/)
- 🔐 [ZK-SNARKs Guide](https://z.cash/technology/zksnarks/)
- 🛠️ [Circom Documentation](https://docs.circom.io/)

## Support

- Create an issue on GitHub
- Check XRPL EVM Discord
- Review existing ZK rollup implementations

Happy coding! 🚀

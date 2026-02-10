# Simple ZK Rollup Example on XRPL EVM

This is a simplified educational example of a ZK rollup implementation on XRPL EVM.

## Overview

This example demonstrates:
- **Off-chain transaction batching**: Multiple transactions are processed off-chain
- **ZK proof generation**: A cryptographic proof verifies the batch is valid
- **On-chain verification**: The XRPL EVM verifies the proof and updates state

## Project Structure

```
zk-rollup-xrpl/
├── contracts/
│   ├── SimpleRollup.sol        # Main rollup contract
│   ├── Verifier.sol             # ZK proof verifier
│   └── IVerifier.sol            # Verifier interface
├── circuits/
│   └── transfer.circom          # Circuit for transfer validation
├── scripts/
│   ├── deploy.js                # Deploy contracts
│   ├── generate-proof.js        # Generate ZK proofs
│   └── submit-batch.js          # Submit rollup batch
└── test/
    └── SimpleRollup.test.js     # Tests

```

## How It Works

1. **Off-chain Processing**: Users submit transactions to an operator
2. **Batch Creation**: Operator batches multiple transactions together
3. **Proof Generation**: Operator generates a ZK proof that the batch is valid
4. **On-chain Submission**: Proof + new state root submitted to XRPL EVM
5. **Verification**: Contract verifies proof and updates state

## Setup

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install --save-dev snarkjs circomlib
npm install ethers
```

## Usage

1. Deploy contracts: `npx hardhat run scripts/deploy.js --network xrpl-evm`
2. Generate proof: `node scripts/generate-proof.js`
3. Submit batch: `node scripts/submit-batch.js`

## Note

This is a simplified example for educational purposes. A production ZK rollup would need:
- Proper circuit design and trusted setup
- Data availability solutions
- Withdrawal mechanisms
- More sophisticated state management
- Security audits


# Output:

npx hardhat run scripts/demo.js

Downloading compiler 0.8.20
Compiled 3 Solidity files successfully (evm target: paris).
============================================================
ZK ROLLUP DEMO FOR XRPL EVM
============================================================

📋 Accounts:
Operator/Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
User 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
User 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
User 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906

============================================================
STEP 1: DEPLOYING CONTRACTS
============================================================

🚀 Deploying MockVerifier...
✅ MockVerifier deployed: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🌱 Initial State Root: 0x14bdefaf5c5acb814a87246cd1d74e6b5f63374b0d250494809922ec2d5e990e

🚀 Deploying SimpleRollup...
✅ SimpleRollup deployed: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

============================================================
STEP 2: USERS DEPOSIT FUNDS TO ROLLUP
============================================================

💰 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 depositing 1.0 ETH...
✅ Deposit confirmed! Rollup balance: 1.0 ETH

💰 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC depositing 0.5 ETH...
✅ Deposit confirmed! Rollup balance: 0.5 ETH

💰 0x90F79bf6EB2c4f870365E785982E1f101E93b906 depositing 2.0 ETH...
✅ Deposit confirmed! Rollup balance: 2.0 ETH

============================================================
STEP 3: OFF-CHAIN TRANSACTION PROCESSING
============================================================

📝 Transaction Batch:
  1. 0x709979... → 0x3C44Cd... : 0.3 ETH
  2. 0x3C44Cd... → 0x90F79b... : 0.2 ETH
  3. 0x90F79b... → 0x709979... : 0.5 ETH

============================================================
STEP 4: GENERATING ZK PROOF
============================================================

🔐 Computing state transition...
Old State Root: 0x14bdefaf5c5acb814a87246cd1d74e6b5f63374b0d250494809922ec2d5e990e
New State Root: 0x4999dc4287757eeb443be6d074d83ad40a57356bb6e0df8ed7af655229137e38

⚡ Generating ZK proof (simulated)...
✅ Proof generated!
Proof size: 514 chars

============================================================
STEP 5: SUBMITTING BATCH TO ROLLUP
============================================================

📊 State before submission:
  Batch Number: 0
  State Root: 0x14bdefaf5c5acb814a87246cd1d74e6b5f63374b0d250494809922ec2d5e990e

📤 Submitting batch to XRPL EVM...
Transaction hash: 0x6f4f4a2a93c9a7967c3d4666fc9f7ca5c69f4fa6d1b595a964cacf12b08036ed
⏳ Waiting for confirmation...
✅ Transaction confirmed in block: 6
⛽ Gas used: 65505

📊 State after submission:
  Batch Number: 1
  State Root: 0x4999dc4287757eeb443be6d074d83ad40a57356bb6e0df8ed7af655229137e38

============================================================
STEP 6: SUBMITTING SECOND BATCH
============================================================

📝 Second Transaction Batch:
  1. 0x709979... → 0x90F79b... : 0.1 ETH
  2. 0x3C44Cd... → 0x709979... : 0.15 ETH

🔐 Generating proof for second batch...

📤 Submitting second batch...

📊 Final State:
  Batch Number: 2
  State Root: 0x5e2f495d9616ca040bd522253b3b5ef4b56406dd40b5c296a5c3a9d590d85977

============================================================
DEMO COMPLETE! 🎉
============================================================

📈 Summary:
  ✅ Deployed rollup contracts to XRPL EVM
  ✅ Processed 5 transactions in 2 batches
  ✅ Generated and verified ZK proofs
  ✅ Updated state root on-chain

💡 Key Benefits of ZK Rollups:
  • Scalability: Process 100s of txs in one batch
  • Cost: Much cheaper than L1 transactions
  • Security: Inherit security from L1 (XRPL EVM)
  • Privacy: ZK proofs don't reveal transaction details

🔗 Contract Addresses:
  Verifier: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  Rollup: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

💾 Demo results saved to demo-results.json




In Test-Net

bingi@Shirisha MINGW64 ~/github.com/bingisainath/xrpl-zkrollup-poc/zk-rollup-xrpl (main)
$ npm run deploy:testnet
> zk-rollup-xrpl@1.0.0 deploy:testnet
> hardhat run scripts/deploy.js --network xrpl-evm-testnet
Deploying ZK Rollup to XRPL EVM...
Deploying with account: 0x7086bE70ea7d1156ECB0930191e212C8b4AB3FD3
Account balance: 97247797271875000000
1. Deploying MockVerifier...
MockVerifier deployed to: 0x8D0d5981d532925062A1306b7b7baEe8335a1101
2. Initial State Root: 0x483d24d5fc82b952c119ba0af7476f8c2ae295587995fdbc6dfb305a43c193c5
3. Deploying SimpleRollup...
SimpleRollup deployed to: 0x121eC755eD20821e67d948Ceb844b8b7311CEfCc
4. Verifying deployment...
Current State Root: 0x483d24d5fc82b952c119ba0af7476f8c2ae295587995fdbc6dfb305a43c193c5
Current Batch Number: 0
Operator: 0x7086bE70ea7d1156ECB0930191e212C8b4AB3FD3
=== Deployment Summary ===
{
  "network": "xrpl-evm-sidechain",
  "verifier": "0x8D0d5981d532925062A1306b7b7baEe8335a1101",
  "rollup": "0x121eC755eD20821e67d948Ceb844b8b7311CEfCc",
  "initialStateRoot": "0x483d24d5fc82b952c119ba0af7476f8c2ae295587995fdbc6dfb305a43c193c5",       
  "operator": "0x7086bE70ea7d1156ECB0930191e212C8b4AB3FD3",
  "timestamp": "2026-02-09T17:41:00.770Z"
}

bingi@Shirisha MINGW64 ~/github.com/bingisainath/xrpl-zkrollup-poc/zk-rollup-xrpl (main)
$ npm run submit-batch

> zk-rollup-xrpl@1.0.0 submit-batch
> hardhat run scripts/submit-batch.js --network xrpl-evm-testnet

Submitting batch to XRPL EVM rollup...
Submitting as operator: 0x7086bE70ea7d1156ECB0930191e212C8b4AB3FD3

Before submission:
- State Root: 0x483d24d5fc82b952c119ba0af7476f8c2ae295587995fdbc6dfb305a43c193c5
- Batch Number: 0

Submitting batch...
Transaction hash: 0xf03c311f759b17da07ce321f685e4d1c8618e3db8b62099ceb830dd016823aa9
Waiting for confirmation...
Transaction confirmed in block: 5393491
Gas used: 65493

After submission:
- State Root: 0x6c1c13f774a61c092c9275d4b6918f3ec87d01fd799d7d4ec25d9d32353734f3
- Batch Number: 1

Events emitted:
- BatchSubmitted:
  Batch Number: 1
  Old State Root: 0x483d24d5fc82b952c119ba0af7476f8c2ae295587995fdbc6dfb305a43c193c5
  New State Root: 0x6c1c13f774a61c092c9275d4b6918f3ec87d01fd799d7d4ec25d9d32353734f3
  Timestamp: 2026-02-09T18:06:04.000Z

✅ Batch submitted successfully!

=== Submission Summary ===

  "txHash": "0xf03c311f759b17da07ce321f685e4d1c8618e3db8b62099ceb830dd016823aa9",

=== Submission Summary ===


=== Submission Summary ===


=== Submission Summary ===
{
  "txHash": "0xf03c311f759b17da07ce321f685e4d1c8618e3db8b62099ceb830dd016823aa9",
  "blockNumber": 5393491,
  "newStateRoot": "0x6c1c13f774a61c092c9275d4b6918f3ec87d01fd799d7d4ec25d9d32353734f3",
  "batchNumber": "1"
}

bingi@Shirisha MINGW64 ~/github.com/bingisainath/xrpl-zkrollup-poc/zk-rollup-xrpl (main)
$
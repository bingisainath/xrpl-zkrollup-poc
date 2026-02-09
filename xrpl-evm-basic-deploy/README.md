# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

📘 XRPL EVM Smart Contract Project - README🎯 Project OverviewThis project demonstrates how to deploy and interact with smart contracts on the XRPL EVM Sidechain. It includes a simple storage contract and utility scripts for deployment, balance checking, and contract recovery.

Project Structure

xrpl-evm-project/
├── contracts/
│   └── SimpleStorage.sol      # Smart contract that stores a number
├── scripts/
│   ├── deploy.js              # Deploy contract to XRPL EVM
│   ├── check-balance.js       # Check wallet balance
│   └── recover-contract-addresses.js  # Find deployed contracts
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Project dependencies
├── .env                       # Private keys (DO NOT COMMIT!)
└── README.md                  # This file

└── README.md                  # This file

🔧 Prerequisites
Before you begin, ensure you have:

Node.js (v16 or higher) - Download here
Git - Download here
MetaMask browser extension - Install here
Basic understanding of blockchain and smart contracts


📦 Installation
1. Clone or Navigate to Project Directory

2. Install Dependencies
npm install

This installs:

hardhat - Ethereum development environment
ethers - Library for interacting with blockchain
dotenv - Manage environment variables
@nomicfoundation/hardhat-toolbox - Hardhat plugins

3. Set Up Environment Variables
Create a .env file in the project root:
touch .env

Add your private key:
TEST_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**⚠️ IMPORTANT:**
- Never share your private key
- Never commit `.env` to Git
- Get your private key from MetaMask: `Account Details → Show Private Key`

### 4. Configure XRPL EVM Network in MetaMask

Add XRPL EVM Testnet to MetaMask:
```
Network Name: XRPL EVM Testnet
RPC URL: https://rpc.testnet.xrplevm.org
Chain ID: 1449000
Currency Symbol: XRP
Block Explorer: https://explorer.testnet.xrplevm.org

5. Get Test XRP
Visit the faucet to get test XRP:

Faucet URL: https://faucet.xrplevm.org
Select "Testnet"
Connect MetaMask or paste your address
Request tokens (you'll receive up to 90 XRP)

📄 Files Explanation
1. SimpleStorage.sol - Smart Contract
Location: contracts/SimpleStorage.sol
What it does:

Stores a single number on the blockchain
Allows anyone to read or update the number
Emits an event when the number is updated

Key Concepts:

uint256 - Unsigned integer (0 to 2^256)
public - Function can be called by anyone
view - Function doesn't modify state (free to call)
event - Logs data on blockchain for tracking

2. deploy.js - Deployment Script
Location: scripts/deploy.js
What it does:

Compiles the smart contract
Deploys it to XRPL EVM Testnet
Tests the contract by storing and retrieving a value
Shows the contract address and explorer link

How it works:
// 1. Get the contract code
const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");

// 2. Deploy to blockchain
const simpleStorage = await SimpleStorage.deploy();

// 3. Wait for confirmation
await simpleStorage.waitForDeployment();

// 4. Get the contract's permanent address
const address = await simpleStorage.getAddress();

Execution:
npx hardhat run scripts/deploy.js --network xrplTestnet
```

**Expected Output:**
```
Deploying SimpleStorage contract to XRPL EVM...
SimpleStorage deployed to: 0x1234567890abcdef...
View on explorer: https://explorer.testnet.xrplevm.org/address/0x...

Testing contract...
✓ Set value to 42
✓ Retrieved value: 42

What happens:

Your wallet sends a transaction with the contract bytecode
Miners include it in a block
Contract gets a permanent address (like 0x123...)
You can now interact with it forever at that address


3. check-balance.js - Balance Checker
Location: scripts/check-balance.js
What it does:

Shows your wallet address
Displays your XRP balance
Helps verify you have funds before deploying

Code Overview:
javascript// Get your wallet from private key
const [deployer] = await hre.ethers.getSigners();

// Get wallet address
const address = await deployer.getAddress();

// Check balance on blockchain
const balance = await hre.ethers.provider.getBalance(address);

// Convert from Wei to XRP
console.log("Balance:", hre.ethers.formatEther(balance), "XRP");
Execution:
bashnpx hardhat run scripts/check-balance.js --network xrplTestnet
```

**Expected Output:**
```
Wallet Address: 0xYourWalletAddress123...
Balance: 89.5 XRP
When to use:

Before deploying (to check you have enough gas)
After getting tokens from faucet
To verify correct wallet is being used


4. recover-contract-addresses.js - Contract Recovery
Location: scripts/recover-contract-addresses.js
What it does:

Finds ALL contracts you've ever deployed
Shows their addresses and explorer links
Identifies contract types
Saves results to recovered-contracts.json

How it works:
Contract addresses are deterministic - they're calculated from:

Your wallet address
The nonce (transaction number) when you deployed

The script:

Gets your total transaction count
Calculates what address each nonce would create
Checks if a contract exists at that address
Lists all found contracts

Execution:
bashnpx hardhat run scripts/recover-contract-addresses.js --network xrplTestnet
```

**Expected Output:**
```
=== Recovering Your Contract Addresses ===

Your Wallet: 0xYourAddress...
Network: xrplTestnet
Total transactions sent: 5

🔍 Scanning for deployed contracts...

✅ Contract Found!
────────────────────────────────────────────────────────────
Address: 0x742d35Cc6634C0532925a3b844bc454e4438f44e
Deployed at transaction nonce: 2
Bytecode size: 1234 bytes
Explorer: https://explorer.testnet.xrplevm.org/address/0x742d...
Balance: 0.0 XRP
Contract Type: SimpleStorage
Stored Value: 42

────────────────────────────────────────────────────────────

📊 Summary: Found 1 contract(s)

✓ Addresses saved to: recovered-contracts.json
When to use:

You forgot your contract address
You want to see all contracts you've deployed
You're switching computers and need contract addresses


🚀 Complete Workflow Guide
Step 1: Check Your Balance
bashnpx hardhat run scripts/check-balance.js --network xrplTestnet
If balance is 0:

Visit https://faucet.xrplevm.org
Request test XRP

Step 2: Compile Contracts
bashnpx hardhat compile
```

**Expected output:**
```
Compiled 1 Solidity file successfully
Step 3: Deploy Contract
bashnpx hardhat run scripts/deploy.js --network xrplTestnet
```

**Save the contract address from output!**

Example: `0x742d35Cc6634C0532925a3b844bc454e4438f44e`

### Step 4: View on Explorer

Open the explorer link from the output:
```
https://explorer.testnet.xrplevm.org/address/YOUR_CONTRACT_ADDRESS
You'll see:

Contract transactions
Balance
Bytecode
Interaction options (after verification)

Step 5: Recover Contracts (If Needed)
bashnpx hardhat run scripts/recover-contract-addresses.js --network xrplTestnet
```

This finds all your deployed contracts and saves them to `recovered-contracts.json`

---

## 📊 Understanding Gas Costs

Every transaction on blockchain costs "gas" (paid in XRP):

| Operation | Approximate Cost | XRP (estimated) |
|-----------|------------------|-----------------|
| Deploy Contract | ~200,000 gas | ~0.001 XRP |
| Call `set()` | ~45,000 gas | ~0.0002 XRP |
| Call `get()` | 0 gas | **FREE** (read-only) |

**Note:** Read operations (`view` functions) are free!

---

## 🔍 Troubleshooting

### Problem 1: "Insufficient funds"

**Error:**
```
ProviderError: insufficient funds
Solution:
bash# Check your balance
npx hardhat run scripts/check-balance.js --network xrplTestnet

# Get more test XRP
# Visit: https://faucet.xrplevm.org
```

---

### Problem 2: "Network connection error"

**Error:**
```
Could not fetch chain ID
Solution:

Check internet connection
Verify RPC URL in hardhat.config.js:

javascript   url: "https://rpc.testnet.xrplevm.org"
```
3. Try again in a few minutes

---

### Problem 3: "Cannot find module"

**Error:**
```
Error: Cannot find module 'hardhat'
Solution:
bash# Reinstall dependencies
npm install
```

---

### Problem 4: "Private key not set"

**Error:**
```
Error: private key length is invalid
Solution:

Check .env file exists
Verify format:

env   TEST_PRIVATE_KEY=0xYourPrivateKeyHere
```
3. Make sure it starts with `0x`
4. No spaces or quotes

---

### Problem 5: "Compilation failed"

**Error:**
```
Error HH600: Compilation failed
Solution:

Check SimpleStorage.sol has no ``` marks
Verify Solidity version matches:

solidity   pragma solidity ^0.8.28;

Run: npx hardhat clean
Then: npx hardhat compile


📚 Additional Resources
XRPL EVM Documentation

Main Docs: https://docs.xrplevm.org
Explorer (Testnet): https://explorer.testnet.xrplevm.org
Explorer (Mainnet): https://explorer.xrplevm.org
Faucet: https://faucet.xrplevm.org

Learning Resources

Solidity Docs: https://docs.soliditylang.org
Hardhat Docs: https://hardhat.org/docs
Ethers.js Docs: https://docs.ethers.org

Community

XRPL Discord: https://discord.gg/xrpl
XRPL EVM GitHub: https://github.com/xrplevm


🔐 Security Best Practices
✅ DO:

Keep your private key in .env file
Add .env to .gitignore
Use testnet for learning and testing
Double-check contract addresses before sending funds
Verify contracts on block explorer

❌ DON'T:

Share your private key with anyone
Commit .env to Git/GitHub
Use same private key for mainnet and testnet
Deploy to mainnet without thorough testing
Store large amounts in test wallets


📝 Quick Command Reference
bash# Installation
npm install                                    # Install dependencies

# Compilation
npx hardhat compile                           # Compile contracts
npx hardhat clean                             # Clean compiled files

# Scripts
npx hardhat run scripts/check-balance.js --network xrplTestnet
npx hardhat run scripts/deploy.js --network xrplTestnet
npx hardhat run scripts/recover-contract-addresses.js --network xrplTestnet

# Testing
npx hardhat test                              # Run tests (if any)

# Help
npx hardhat help                              # Show all commands
npx hardhat --version                         # Show version

🎯 Next Steps
Now that you have a working setup, you can:

Modify the contract:

Add more functions
Store different data types
Add access control


Create new contracts:

ERC20 tokens
NFTs
DeFi applications


Learn more:

Study Solidity patterns
Explore ZK-Rollups (your dissertation!)
Build complex dApps


Deploy to mainnet:

After thorough testing
With real XRP
Verify contracts


📄 File Contents Quick Reference
hardhat.config.js
javascriptnetworks: {
  xrplTestnet: {
    url: "https://rpc.testnet.xrplevm.org",
    chainId: 1449000
  }
}
.env
envTEST_PRIVATE_KEY=0xYourPrivateKeyHere
```

### .gitignore
```
node_modules/
.env
cache/
artifacts/

🆘 Getting Help
If you're stuck:

Check this README - Most common issues are covered
Read error messages - They usually tell you what's wrong
Check XRPL EVM Docs - https://docs.xrplevm.org
Ask in Discord - XRPL community is helpful
Google the error - Likely someone had same issue

🎓 About This Project
This is part of a dissertation project exploring Zero-Knowledge Rollups on XRPL EVM Sidechain. The SimpleStorage contract serves as a foundation for understanding:

Smart contract deployment
Gas costs and optimization
State management on blockchain
Transaction batching (future work)
ZK-proof integration (future work)

Dissertation Topic: "Implementing Zero-Knowledge Rollups on XRPL EVM Sidechain: A Performance and Scalability Analysis"


Smart COntract Details

# Address: 0x217ed120C132530fFBD27Cc2b748Bd366F7c935C
Deployed at transaction nonce: 0
Bytecode size: 499 bytes
Explorer: https://explorer.testnet.xrplevm.org/address/0x217ed120C132530fFBD27Cc2b748Bd366F7c935C
Balance: 0.0 XRP
Contract Type: SimpleStorage
Stored Value: 42


Commands to run

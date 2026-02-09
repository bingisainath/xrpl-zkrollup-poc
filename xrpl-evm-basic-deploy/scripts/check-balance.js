// const hre = require("hardhat");

// async function main() {
//   const [deployer] = await hre.ethers.getSigners();
//   const address = await deployer.getAddress();
//   const balance = await hre.ethers.provider.getBalance(address);
  
//   console.log("Wallet Address:", address);
//   console.log("Balance:", hre.ethers.formatEther(balance), "XRP");
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });


const hre = require("hardhat");

async function main() {
  // Get your wallet from the private key in .env
  const [deployer] = await hre.ethers.getSigners();
  
  // Get the wallet's address (0x...)
  const address = await deployer.getAddress();
  
  // Check balance on XRPL EVM blockchain
  const balance = await hre.ethers.provider.getBalance(address);
  
  console.log("Wallet Address:", address);
  // Convert from Wei to XRP (Wei is smallest unit)
  console.log("Balance:", hre.ethers.formatEther(balance), "XRP");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Why you need it:**
- Deployment costs gas (XRP)
- This checks if you have enough XRP before trying to deploy
- Prevents the "insufficient funds" error

---

## 🎓 How This Relates to Your Dissertation: XRPL + ZK-Rollups

You're currently at **Phase 1** (Learning the basics). Here's your complete roadmap:

### **Phase 1: Foundation (Current)** ✅ You are here
**Goal:** Understand how XRPL EVM works

**What you've learned:**
- How to deploy smart contracts to XRPL EVM
- How blockchain transactions work
- Gas fees and wallet management

**Current limitation:**
- Each transaction is processed **individually** on XRPL EVM
- This is slow and expensive at scale
- Example: 1000 transactions = 1000 separate blockchain operations

---

### **Phase 2: Understanding the Problem**
**Goal:** Identify why we need ZK-Rollups

**The Problem with Current Blockchain:**
```
// Traditional blockchain (current XRPL EVM):
// User 1 → Transaction 1 → Blockchain → Gas Fee
// User 2 → Transaction 2 → Blockchain → Gas Fee
// User 3 → Transaction 3 → Blockchain → Gas Fee
// ...
// User 1000 → Transaction 1000 → Blockchain → Gas Fee

// Result: SLOW & EXPENSIVE
```

**ZK-Rollup Solution:**
```
// Users 1-1000 → Transactions batched off-chain → 
// Execute all → Generate ONE proof → 
// Submit proof to blockchain → ONE gas fee

// Result: FAST & CHEAP (100x improvement)
```

**Key Research Questions for Your Dissertation:**
1. How much gas can we save? (Measure this!)
2. How much faster is batching? (Time comparison)
3. What's the tradeoff? (Proof generation time)

---

### **Phase 3: Building a Simple ZK-Rollup (Your Core Work)**

Based on your research document, here's what you need to build:

#### **Architecture Overview:**
// ```
// ┌─────────────────────────────────────────────────────────┐
// │                    XRPL EVM (Layer 1)                   │
// │  - Verifier Contract (verifies ZK proofs)               │
// │  - Rollup Contract (stores state roots)                 │
// └─────────────────────────────────────────────────────────┘
//                             ▲
//                             │ Submit proof + batch
//                             │
// ┌─────────────────────────────────────────────────────────┐
// │                 Your ZK-Rollup (Layer 2)                │
// │  1. Sequencer - collects transactions                   │
// │  2. State DB - maintains Merkle tree                    │
// │  3. Prover - generates ZK proofs                        │
// │  4. Batch Processor - groups transactions               │
// └─────────────────────────────────────────────────────────┘
// const hre = require("hardhat");

// async function main() {
//   console.log("Deploying SimpleStorage contract to XRPL EVM...");
  
//   const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
//   const simpleStorage = await SimpleStorage.deploy();
  
//   // Wait for deployment
//   await simpleStorage.waitForDeployment();
  
//   // Get the contract address (ethers v6 syntax)
//   const address = await simpleStorage.getAddress();
//   console.log("SimpleStorage deployed to:", address);
//   console.log("View on explorer: https://explorer.testnet.xrplevm.org/address/" + address);
  
//   // Test the contract
//   console.log("\nTesting contract...");
//   const setTx = await simpleStorage.set(42);
//   await setTx.wait();
//   console.log("✓ Set value to 42");
  
//   const value = await simpleStorage.get();
//   console.log("✓ Retrieved value:", value.toString());
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });


const hre = require("hardhat");

async function main() {
  // STEP 1: Get the contract code
  console.log("Deploying SimpleStorage contract to XRPL EVM...");
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  
  // STEP 2: Deploy to blockchain (costs gas/XRP)
  const simpleStorage = await SimpleStorage.deploy();
  
  // STEP 3: Wait for deployment confirmation
  await simpleStorage.waitForDeployment();
  
  // STEP 4: Get the contract's permanent address
  const address = await simpleStorage.getAddress();
  console.log("SimpleStorage deployed to:", address);
  // Example output: 0x742d35Cc6634C0532925a3b8...
  
  // STEP 5: Test the contract
  console.log("\nTesting contract...");
  
  // Call set() function - writes to blockchain
  const setTx = await simpleStorage.set(42);
  await setTx.wait();  // Wait for transaction confirmation
  console.log("✓ Set value to 42");
  
  // Call get() function - reads from blockchain (free)
  const value = await simpleStorage.get();
  console.log("✓ Retrieved value:", value.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


// ```

// **What happens when you run it:**
// 1. Your Solidity code is compiled to bytecode
// 2. A transaction is sent to XRPL EVM with the bytecode
// 3. Miners/validators include it in a block
// 4. Contract gets a permanent address (like `0x123...`)
// 5. You can now interact with it forever at that address

// ---

// ### 3. **check-balance.js** (Balance Checker)
// ```
// scripts/check-balance.js
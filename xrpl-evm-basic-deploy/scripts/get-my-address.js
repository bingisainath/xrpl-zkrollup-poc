const hre = require("hardhat");
   
   async function main() {
     const [deployer] = await hre.ethers.getSigners();
     const address = await deployer.getAddress();
     
     console.log("Your Wallet Address:", address);
     
     const network = hre.network.name;
     const explorerBase = network.includes('Testnet')
       ? 'https://explorer.testnet.xrplevm.org'
       : 'https://explorer.xrplevm.org';
     
     console.log("\nView your transactions:");
     console.log(`${explorerBase}/address/${address}`);
   }
   
   main()
     .then(() => process.exit(0))
     .catch(console.error);
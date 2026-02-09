const hre = require("hardhat");

async function main() {
  console.log("=== Recovering Your Contract Addresses ===\n");

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = hre.network.name;

  console.log("Your Wallet:", deployerAddress);
  console.log("Network:", network);

  // Get current nonce (total transactions sent)
  const currentNonce = await hre.ethers.provider.getTransactionCount(deployerAddress);
  console.log("Total transactions sent:", currentNonce);
  console.log("\n🔍 Scanning for deployed contracts...\n");

  const explorerBase = network.includes('Testnet')
    ? 'https://explorer.testnet.xrplevm.org'
    : 'https://explorer.xrplevm.org';

  const foundContracts = [];

  // Check each possible nonce
  for (let nonce = 0; nonce < currentNonce; nonce++) {
    // Calculate what the contract address would be at this nonce
    const predictedAddress = hre.ethers.getCreateAddress({
      from: deployerAddress,
      nonce: nonce
    });

    // Check if there's actually a contract at this address
    const code = await hre.ethers.provider.getCode(predictedAddress);

    if (code !== '0x') {
      // Found a contract!
      console.log(`\n✅ Contract Found!`);
      console.log("─".repeat(60));
      console.log("Address:", predictedAddress);
      console.log("Deployed at transaction nonce:", nonce);
      console.log("Bytecode size:", (code.length / 2 - 1), "bytes");
      console.log("Explorer:", `${explorerBase}/address/${predictedAddress}`);

      // Try to get more info
      const balance = await hre.ethers.provider.getBalance(predictedAddress);
      console.log("Balance:", hre.ethers.formatEther(balance), "XRP");

      // Try to interact if it's SimpleStorage
      try {
        const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
        const contract = SimpleStorage.attach(predictedAddress);
        const value = await contract.get();
        console.log("Contract Type: SimpleStorage");
        console.log("Stored Value:", value.toString());
      } catch (e) {
        console.log("Contract Type: Unknown (not SimpleStorage)");
      }

      foundContracts.push({
        address: predictedAddress,
        nonce: nonce,
        bytecodeSize: code.length / 2 - 1,
        explorerUrl: `${explorerBase}/address/${predictedAddress}`
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Summary: Found ${foundContracts.length} contract(s)`);

  if (foundContracts.length === 0) {
    console.log("\nNo contracts found. Possible reasons:");
    console.log("1. You haven't deployed any contracts yet");
    console.log("2. You're on the wrong network");
    console.log("3. You're using a different wallet");
  } else {
    // Save to file
    const fs = require('fs');
    const recoveredData = {
      wallet: deployerAddress,
      network: network,
      timestamp: new Date().toISOString(),
      contracts: foundContracts
    };

    fs.writeFileSync(
      'recovered-contracts.json',
      JSON.stringify(recoveredData, null, 2)
    );

    console.log("\n✓ Addresses saved to: recovered-contracts.json");
  }

  return foundContracts;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
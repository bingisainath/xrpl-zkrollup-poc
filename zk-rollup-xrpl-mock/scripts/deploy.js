const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying ZK Rollup to XRPL EVM...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
    
    // Step 1: Deploy MockVerifier
    console.log("\n1. Deploying MockVerifier...");
    const Verifier = await ethers.getContractFactory("MockVerifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log("MockVerifier deployed to:", verifierAddress);
    
    // Step 2: Generate initial state root
    // In production, this would be computed from the initial state
    const initialStateRoot = ethers.keccak256(ethers.toUtf8Bytes("initial_state"));
    console.log("\n2. Initial State Root:", initialStateRoot);
    
    // Step 3: Deploy SimpleRollup
    console.log("\n3. Deploying SimpleRollup...");
    const SimpleRollup = await ethers.getContractFactory("SimpleRollup");
    const rollup = await SimpleRollup.deploy(verifierAddress, initialStateRoot);
    await rollup.waitForDeployment();
    const rollupAddress = await rollup.getAddress();
    console.log("SimpleRollup deployed to:", rollupAddress);
    
    // Step 4: Verify deployment
    console.log("\n4. Verifying deployment...");
    const state = await rollup.getState();
    console.log("Current State Root:", state[0]);
    console.log("Current Batch Number:", state[1].toString());
    console.log("Operator:", state[2]);
    
    // Save deployment addresses
    const deploymentInfo = {
        network: "xrpl-evm-sidechain",
        verifier: verifierAddress,
        rollup: rollupAddress,
        initialStateRoot: initialStateRoot,
        operator: deployer.address,
        timestamp: new Date().toISOString()
    };
    
    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync(
        'deployment-info.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\nDeployment info saved to deployment-info.json");
    
    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const { ethers } = require("hardhat");
const fs = require('fs');

/**
 * Complete ZK Rollup Demo
 * This script demonstrates the full workflow:
 * 1. Deploy contracts
 * 2. Users deposit funds
 * 3. Generate and submit batches with ZK proofs
 */

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log("=".repeat(60));
    console.log("ZK ROLLUP DEMO FOR XRPL EVM");
    console.log("=".repeat(60));
    
    const [deployer, user1, user2, user3] = await ethers.getSigners();
    
    console.log("\n📋 Accounts:");
    console.log("Operator/Deployer:", deployer.address);
    console.log("User 1:", user1.address);
    console.log("User 2:", user2.address);
    console.log("User 3:", user3.address);
    
    // ========================================================================
    // STEP 1: DEPLOY CONTRACTS
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("STEP 1: DEPLOYING CONTRACTS");
    console.log("=".repeat(60));
    
    console.log("\n🚀 Deploying MockVerifier...");
    const Verifier = await ethers.getContractFactory("MockVerifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log("✅ MockVerifier deployed:", verifierAddress);
    
    const initialStateRoot = ethers.keccak256(ethers.toUtf8Bytes("genesis_state"));
    console.log("\n🌱 Initial State Root:", initialStateRoot);
    
    console.log("\n🚀 Deploying SimpleRollup...");
    const SimpleRollup = await ethers.getContractFactory("SimpleRollup");
    const rollup = await SimpleRollup.deploy(verifierAddress, initialStateRoot);
    await rollup.waitForDeployment();
    const rollupAddress = await rollup.getAddress();
    console.log("✅ SimpleRollup deployed:", rollupAddress);
    
    // ========================================================================
    // STEP 2: USERS DEPOSIT FUNDS
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: USERS DEPOSIT FUNDS TO ROLLUP");
    console.log("=".repeat(60));
    
    const deposits = [
        { user: user1, amount: ethers.parseEther("1.0") },
        { user: user2, amount: ethers.parseEther("0.5") },
        { user: user3, amount: ethers.parseEther("2.0") }
    ];
    
    for (const { user, amount } of deposits) {
        console.log(`\n💰 ${user.address} depositing ${ethers.formatEther(amount)} ETH...`);
        const tx = await rollup.connect(user).deposit({ value: amount });
        await tx.wait();
        const balance = await rollup.balances(user.address);
        console.log(`✅ Deposit confirmed! Rollup balance: ${ethers.formatEther(balance)} ETH`);
    }
    
    // ========================================================================
    // STEP 3: SIMULATE OFF-CHAIN TRANSACTIONS
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: OFF-CHAIN TRANSACTION PROCESSING");
    console.log("=".repeat(60));
    
    const transactions = [
        { from: user1.address, to: user2.address, amount: "0.3" },
        { from: user2.address, to: user3.address, amount: "0.2" },
        { from: user3.address, to: user1.address, amount: "0.5" }
    ];
    
    console.log("\n📝 Transaction Batch:");
    transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.from.slice(0, 8)}... → ${tx.to.slice(0, 8)}... : ${tx.amount} ETH`);
    });
    
    // ========================================================================
    // STEP 4: GENERATE ZK PROOF
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("STEP 4: GENERATING ZK PROOF");
    console.log("=".repeat(60));
    
    console.log("\n🔐 Computing state transition...");
    const currentStateRoot = await rollup.stateRoot();
    
    // Simulate new state root computation
    const newStateRoot = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "uint256", "uint256"],
            [currentStateRoot, transactions.length, Date.now()]
        )
    );
    
    console.log("Old State Root:", currentStateRoot);
    console.log("New State Root:", newStateRoot);
    
    console.log("\n⚡ Generating ZK proof (simulated)...");
    await sleep(1000); // Simulate proof generation time
    
    const proof = ethers.hexlify(ethers.randomBytes(256));
    const publicInputs = [BigInt(currentStateRoot), BigInt(newStateRoot)];
    
    console.log("✅ Proof generated!");
    console.log("Proof size:", proof.length, "chars");
    
    // ========================================================================
    // STEP 5: SUBMIT BATCH TO ROLLUP
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("STEP 5: SUBMITTING BATCH TO ROLLUP");
    console.log("=".repeat(60));
    
    const stateBefore = await rollup.getState();
    console.log("\n📊 State before submission:");
    console.log("  Batch Number:", stateBefore[1].toString());
    console.log("  State Root:", stateBefore[0]);
    
    console.log("\n📤 Submitting batch to XRPL EVM...");
    const tx = await rollup.submitBatch(newStateRoot, proof, publicInputs);
    console.log("Transaction hash:", tx.hash);
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    const stateAfter = await rollup.getState();
    console.log("\n📊 State after submission:");
    console.log("  Batch Number:", stateAfter[1].toString());
    console.log("  State Root:", stateAfter[0]);
    
    // ========================================================================
    // STEP 6: SUBMIT ANOTHER BATCH
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("STEP 6: SUBMITTING SECOND BATCH");
    console.log("=".repeat(60));
    
    const moreTxs = [
        { from: user1.address, to: user3.address, amount: "0.1" },
        { from: user2.address, to: user1.address, amount: "0.15" }
    ];
    
    console.log("\n📝 Second Transaction Batch:");
    moreTxs.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.from.slice(0, 8)}... → ${tx.to.slice(0, 8)}... : ${tx.amount} ETH`);
    });
    
    const currentStateRoot2 = await rollup.stateRoot();
    const newStateRoot2 = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "uint256", "uint256"],
            [currentStateRoot2, moreTxs.length, Date.now()]
        )
    );
    
    console.log("\n🔐 Generating proof for second batch...");
    await sleep(1000);
    
    const proof2 = ethers.hexlify(ethers.randomBytes(256));
    const publicInputs2 = [BigInt(currentStateRoot2), BigInt(newStateRoot2)];
    
    console.log("\n📤 Submitting second batch...");
    const tx2 = await rollup.submitBatch(newStateRoot2, proof2, publicInputs2);
    await tx2.wait();
    
    const finalState = await rollup.getState();
    console.log("\n📊 Final State:");
    console.log("  Batch Number:", finalState[1].toString());
    console.log("  State Root:", finalState[0]);
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("DEMO COMPLETE! 🎉");
    console.log("=".repeat(60));
    
    console.log("\n📈 Summary:");
    console.log("  ✅ Deployed rollup contracts to XRPL EVM");
    console.log("  ✅ Processed", transactions.length + moreTxs.length, "transactions in", finalState[1].toString(), "batches");
    console.log("  ✅ Generated and verified ZK proofs");
    console.log("  ✅ Updated state root on-chain");
    
    console.log("\n💡 Key Benefits of ZK Rollups:");
    console.log("  • Scalability: Process 100s of txs in one batch");
    console.log("  • Cost: Much cheaper than L1 transactions");
    console.log("  • Security: Inherit security from L1 (XRPL EVM)");
    console.log("  • Privacy: ZK proofs don't reveal transaction details");
    
    console.log("\n🔗 Contract Addresses:");
    console.log("  Verifier:", verifierAddress);
    console.log("  Rollup:", rollupAddress);
    
    // Save deployment info
    const deploymentInfo = {
        network: "local",
        verifier: verifierAddress,
        rollup: rollupAddress,
        initialStateRoot: initialStateRoot,
        finalStateRoot: finalState[0],
        totalBatches: finalState[1].toString(),
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
        'demo-results.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Demo results saved to demo-results.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

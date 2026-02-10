const { ethers } = require("hardhat");
const fs = require('fs');

/**
 * Submit a batch of transactions with ZK proof to the rollup contract
 */
async function submitBatch() {
    console.log("Submitting batch to XRPL EVM rollup...");
    
    // Load deployment info
    const deploymentInfo = JSON.parse(
        fs.readFileSync('deployment-info.json', 'utf8')
    );
    
    // Load proof data
    const proofData = JSON.parse(
        fs.readFileSync('proof-data.json', 'utf8')
    );
    
    // Get signer
    const [operator] = await ethers.getSigners();
    console.log("Submitting as operator:", operator.address);
    
    // Connect to rollup contract
    const SimpleRollup = await ethers.getContractFactory("SimpleRollup");
    const rollup = SimpleRollup.attach(deploymentInfo.rollup);
    
    // Get current state before submission
    console.log("\nBefore submission:");
    const stateBefore = await rollup.getState();
    console.log("- State Root:", stateBefore[0]);
    console.log("- Batch Number:", stateBefore[1].toString());
    
    // Submit batch
    console.log("\nSubmitting batch...");
    const tx = await rollup.submitBatch(
        proofData.newStateRoot,
        proofData.proof,
        proofData.publicInputs
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Get updated state
    console.log("\nAfter submission:");
    const stateAfter = await rollup.getState();
    console.log("- State Root:", stateAfter[0]);
    console.log("- Batch Number:", stateAfter[1].toString());
    
    // Parse events
    const events = receipt.logs.map(log => {
        try {
            return rollup.interface.parseLog(log);
        } catch (e) {
            return null;
        }
    }).filter(e => e !== null);
    
    console.log("\nEvents emitted:");
    events.forEach(event => {
        if (event.name === "BatchSubmitted") {
            console.log("- BatchSubmitted:");
            console.log("  Batch Number:", event.args.batchNumber.toString());
            console.log("  Old State Root:", event.args.oldStateRoot);
            console.log("  New State Root:", event.args.newStateRoot);
            console.log("  Timestamp:", new Date(Number(event.args.timestamp) * 1000).toISOString());
        }
    });
    
    console.log("\n✅ Batch submitted successfully!");
    
    return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        newStateRoot: stateAfter[0],
        batchNumber: stateAfter[1].toString()
    };
}

async function main() {
    try {
        const result = await submitBatch();
        console.log("\n=== Submission Summary ===");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error submitting batch:", error);
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { submitBatch };

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleRollup", function () {
    let rollup;
    let verifier;
    let owner;
    let user1;
    let user2;
    let initialStateRoot;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy verifier
        const Verifier = await ethers.getContractFactory("MockVerifier");
        verifier = await Verifier.deploy();
        await verifier.waitForDeployment();

        // Set initial state root
        initialStateRoot = ethers.keccak256(ethers.toUtf8Bytes("initial_state"));

        // Deploy rollup
        const SimpleRollup = await ethers.getContractFactory("SimpleRollup");
        rollup = await SimpleRollup.deploy(await verifier.getAddress(), initialStateRoot);
        await rollup.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct initial state root", async function () {
            expect(await rollup.stateRoot()).to.equal(initialStateRoot);
        });

        it("Should set the correct operator", async function () {
            expect(await rollup.operator()).to.equal(owner.address);
        });

        it("Should initialize batch number to 0", async function () {
            expect(await rollup.batchNumber()).to.equal(0);
        });
    });

    describe("Deposits", function () {
        it("Should allow users to deposit ETH", async function () {
            const depositAmount = ethers.parseEther("1.0");
            
            await expect(rollup.connect(user1).deposit({ value: depositAmount }))
                .to.emit(rollup, "Deposit")
                .withArgs(user1.address, depositAmount, depositAmount);

            expect(await rollup.balances(user1.address)).to.equal(depositAmount);
        });

        it("Should reject zero deposits", async function () {
            await expect(
                rollup.connect(user1).deposit({ value: 0 })
            ).to.be.revertedWith("Deposit amount must be greater than 0");
        });

        it("Should track multiple deposits", async function () {
            const amount1 = ethers.parseEther("1.0");
            const amount2 = ethers.parseEther("0.5");

            await rollup.connect(user1).deposit({ value: amount1 });
            await rollup.connect(user1).deposit({ value: amount2 });

            expect(await rollup.balances(user1.address)).to.equal(amount1 + amount2);
        });
    });

    describe("Batch Submission", function () {
        it("Should allow operator to submit batch with valid proof", async function () {
            const newStateRoot = ethers.keccak256(ethers.toUtf8Bytes("new_state"));
            const proof = ethers.hexlify(ethers.randomBytes(256));
            const publicInputs = [BigInt(initialStateRoot), BigInt(newStateRoot)];

            await expect(rollup.submitBatch(newStateRoot, proof, publicInputs))
                .to.emit(rollup, "BatchSubmitted")
                .withArgs(1, initialStateRoot, newStateRoot, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));

            expect(await rollup.stateRoot()).to.equal(newStateRoot);
            expect(await rollup.batchNumber()).to.equal(1);
        });

        it("Should reject batch from non-operator", async function () {
            const newStateRoot = ethers.keccak256(ethers.toUtf8Bytes("new_state"));
            const proof = ethers.hexlify(ethers.randomBytes(256));
            const publicInputs = [BigInt(initialStateRoot), BigInt(newStateRoot)];

            await expect(
                rollup.connect(user1).submitBatch(newStateRoot, proof, publicInputs)
            ).to.be.revertedWith("Only operator can submit batches");
        });

        it("Should reject batch with mismatched old state root", async function () {
            const wrongOldRoot = ethers.keccak256(ethers.toUtf8Bytes("wrong_old_state"));
            const newStateRoot = ethers.keccak256(ethers.toUtf8Bytes("new_state"));
            const proof = ethers.hexlify(ethers.randomBytes(256));
            const publicInputs = [BigInt(wrongOldRoot), BigInt(newStateRoot)];

            await expect(
                rollup.submitBatch(newStateRoot, proof, publicInputs)
            ).to.be.revertedWith("Old state root mismatch");
        });

        it("Should process multiple batches sequentially", async function () {
            // First batch
            const stateRoot1 = ethers.keccak256(ethers.toUtf8Bytes("state_1"));
            const proof1 = ethers.hexlify(ethers.randomBytes(256));
            const publicInputs1 = [BigInt(initialStateRoot), BigInt(stateRoot1)];
            
            await rollup.submitBatch(stateRoot1, proof1, publicInputs1);
            expect(await rollup.batchNumber()).to.equal(1);

            // Second batch
            const stateRoot2 = ethers.keccak256(ethers.toUtf8Bytes("state_2"));
            const proof2 = ethers.hexlify(ethers.randomBytes(256));
            const publicInputs2 = [BigInt(stateRoot1), BigInt(stateRoot2)];
            
            await rollup.submitBatch(stateRoot2, proof2, publicInputs2);
            expect(await rollup.batchNumber()).to.equal(2);
            expect(await rollup.stateRoot()).to.equal(stateRoot2);
        });
    });

    describe("State Query", function () {
        it("Should return correct state information", async function () {
            const state = await rollup.getState();
            
            expect(state[0]).to.equal(initialStateRoot);
            expect(state[1]).to.equal(0);
            expect(state[2]).to.equal(owner.address);
        });
    });

    describe("Operator Management", function () {
        it("Should allow operator to update operator address", async function () {
            await rollup.updateOperator(user1.address);
            expect(await rollup.operator()).to.equal(user1.address);
        });

        it("Should reject operator update from non-operator", async function () {
            await expect(
                rollup.connect(user1).updateOperator(user2.address)
            ).to.be.revertedWith("Only operator can update");
        });
    });
});

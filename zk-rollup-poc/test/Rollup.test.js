// /**
//  * ============================================================
//  * Rollup Contract — Unit Tests
//  * ============================================================
//  * Tests the Rollup and Verifier contracts using Hardhat.
//  *
//  * Note: These tests use the PLACEHOLDER verifier which always
//  * returns true. After generating the real verifier from snarkjs,
//  * update the tests to use actual proof data from proof_calldata.json.
//  *
//  * Usage:
//  *   npx hardhat test
//  */

// const { expect } = require("chai");
// const hre = require("hardhat");

// describe("Rollup Contract", function () {
//   let rollup, verifier, owner, addr1;
//   const INITIAL_ROOT = 12345n;

//   beforeEach(async function () {
//     [owner, addr1] = await hre.ethers.getSigners();

//     // Deploy Verifier (placeholder)
//     const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
//     verifier = await Verifier.deploy();
//     await verifier.waitForDeployment();

//     // Deploy Rollup
//     const Rollup = await hre.ethers.getContractFactory("Rollup");
//     rollup = await Rollup.deploy(await verifier.getAddress(), INITIAL_ROOT);
//     await rollup.waitForDeployment();
//   });

//   describe("Deployment", function () {
//     it("should set initial state root", async function () {
//       expect(await rollup.stateRoot()).to.equal(INITIAL_ROOT);
//     });

//     it("should set deployer as operator", async function () {
//       expect(await rollup.operator()).to.equal(owner.address);
//     });

//     it("should start with batch count 0", async function () {
//       expect(await rollup.batchCount()).to.equal(0);
//     });

//     it("should store verifier address", async function () {
//       expect(await rollup.verifier()).to.equal(await verifier.getAddress());
//     });
//   });

//   describe("submitBatch", function () {
//     const OLD_ROOT = INITIAL_ROOT;
//     const NEW_ROOT = 67890n;
//     // Dummy proof values (placeholder verifier accepts anything)
//     const pA = [0n, 0n];
//     const pB = [[0n, 0n], [0n, 0n]];
//     const pC = [0n, 0n];

//     it("should update state root on valid proof", async function () {
//       await rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT);
//       expect(await rollup.stateRoot()).to.equal(NEW_ROOT);
//     });

//     it("should increment batch count", async function () {
//       await rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT);
//       expect(await rollup.batchCount()).to.equal(1);
//     });

//     it("should emit BatchVerified event", async function () {
//       await expect(rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT))
//         .to.emit(rollup, "BatchVerified")
//         .withArgs(1, OLD_ROOT, NEW_ROOT, owner.address, (v) => v > 0);
//     });

//     it("should reject mismatched old state root", async function () {
//       const wrongRoot = 99999n;
//       await expect(
//         rollup.submitBatch(pA, pB, pC, wrongRoot, NEW_ROOT)
//       ).to.be.revertedWithCustomError(rollup, "StateRootMismatch");
//     });

//     it("should reject non-operator submissions", async function () {
//       await expect(
//         rollup.connect(addr1).submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT)
//       ).to.be.revertedWithCustomError(rollup, "OnlyOperator");
//     });

//     it("should allow sequential batches", async function () {
//       const ROOT_2 = 11111n;
//       await rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT);
//       await rollup.submitBatch(pA, pB, pC, NEW_ROOT, ROOT_2);
//       expect(await rollup.stateRoot()).to.equal(ROOT_2);
//       expect(await rollup.batchCount()).to.equal(2);
//     });
//   });

//   describe("Operator management", function () {
//     it("should allow operator to transfer role", async function () {
//       await rollup.setOperator(addr1.address);
//       expect(await rollup.operator()).to.equal(addr1.address);
//     });

//     it("should reject zero address operator", async function () {
//       await expect(
//         rollup.setOperator(hre.ethers.ZeroAddress)
//       ).to.be.revertedWithCustomError(rollup, "ZeroAddress");
//     });

//     it("should emit OperatorChanged event", async function () {
//       await expect(rollup.setOperator(addr1.address))
//         .to.emit(rollup, "OperatorChanged")
//         .withArgs(owner.address, addr1.address);
//     });
//   });

//   describe("getRollupState", function () {
//     it("should return current state", async function () {
//       const [root, batches, op] = await rollup.getRollupState();
//       expect(root).to.equal(INITIAL_ROOT);
//       expect(batches).to.equal(0);
//       expect(op).to.equal(owner.address);
//     });
//   });
// });

/**
 * ============================================================
 * Rollup Contract — Unit Tests
 * ============================================================
 * Tests the Rollup and Verifier contracts using Hardhat.
 *
 * Note: These tests use the PLACEHOLDER verifier which always
 * returns true. After generating the real verifier from snarkjs,
 * update the tests to use actual proof data from proof_calldata.json.
 *
 * Usage:
 *   npx hardhat test
 */

const { expect } = require("chai");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

describe("Rollup Contract", function () {
  let rollup, verifier, owner, addr1;
  const INITIAL_ROOT = 12345n;

  beforeEach(async function () {
    [owner, addr1] = await hre.ethers.getSigners();

    // Deploy MockVerifier (always returns true) for unit testing.
    // The real Groth16Verifier rejects dummy zero-value proofs,
    // so we use a mock to test Rollup contract logic independently.
    const Verifier = await hre.ethers.getContractFactory("MockVerifier");
    verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    // Deploy Rollup
    const Rollup = await hre.ethers.getContractFactory("Rollup");
    rollup = await Rollup.deploy(await verifier.getAddress(), INITIAL_ROOT);
    await rollup.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set initial state root", async function () {
      expect(await rollup.stateRoot()).to.equal(INITIAL_ROOT);
    });

    it("should set deployer as operator", async function () {
      expect(await rollup.operator()).to.equal(owner.address);
    });

    it("should start with batch count 0", async function () {
      expect(await rollup.batchCount()).to.equal(0);
    });

    it("should store verifier address", async function () {
      expect(await rollup.verifier()).to.equal(await verifier.getAddress());
    });
  });

  describe("submitBatch", function () {
    const OLD_ROOT = INITIAL_ROOT;
    const NEW_ROOT = 67890n;
    // Dummy proof values (placeholder verifier accepts anything)
    const pA = [0n, 0n];
    const pB = [[0n, 0n], [0n, 0n]];
    const pC = [0n, 0n];

    it("should update state root on valid proof", async function () {
      await rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT);
      expect(await rollup.stateRoot()).to.equal(NEW_ROOT);
    });

    it("should increment batch count", async function () {
      await rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT);
      expect(await rollup.batchCount()).to.equal(1);
    });

    it("should emit BatchVerified event", async function () {
      await expect(rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT))
        .to.emit(rollup, "BatchVerified")
        .withArgs(1, OLD_ROOT, NEW_ROOT, owner.address, (v) => v > 0);
    });

    it("should reject mismatched old state root", async function () {
      const wrongRoot = 99999n;
      await expect(
        rollup.submitBatch(pA, pB, pC, wrongRoot, NEW_ROOT)
      ).to.be.revertedWithCustomError(rollup, "StateRootMismatch");
    });

    it("should reject non-operator submissions", async function () {
      await expect(
        rollup.connect(addr1).submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT)
      ).to.be.revertedWithCustomError(rollup, "OnlyOperator");
    });

    it("should allow sequential batches", async function () {
      const ROOT_2 = 11111n;
      await rollup.submitBatch(pA, pB, pC, OLD_ROOT, NEW_ROOT);
      await rollup.submitBatch(pA, pB, pC, NEW_ROOT, ROOT_2);
      expect(await rollup.stateRoot()).to.equal(ROOT_2);
      expect(await rollup.batchCount()).to.equal(2);
    });
  });

  describe("Operator management", function () {
    it("should allow operator to transfer role", async function () {
      await rollup.setOperator(addr1.address);
      expect(await rollup.operator()).to.equal(addr1.address);
    });

    it("should reject zero address operator", async function () {
      await expect(
        rollup.setOperator(hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(rollup, "ZeroAddress");
    });

    it("should emit OperatorChanged event", async function () {
      await expect(rollup.setOperator(addr1.address))
        .to.emit(rollup, "OperatorChanged")
        .withArgs(owner.address, addr1.address);
    });
  });

  describe("getRollupState", function () {
    it("should return current state", async function () {
      const [root, batches, op] = await rollup.getRollupState();
      expect(root).to.equal(INITIAL_ROOT);
      expect(batches).to.equal(0);
      expect(op).to.equal(owner.address);
    });
  });
});

/**
 * Integration test: Uses the REAL Groth16Verifier and real proof data.
 * Only runs if proof_calldata.json and state_roots.json exist in build/.
 */
describe("Rollup Integration (Real Proof)", function () {
  const proofPath = path.join(__dirname, "..", "build", "proof_calldata.json");
  const rootsPath = path.join(__dirname, "..", "build", "state_roots.json");

  let hasProofData;

  before(function () {
    hasProofData = fs.existsSync(proofPath) && fs.existsSync(rootsPath);
    if (!hasProofData) {
      console.log("    ⚠️  Skipping integration tests: no proof data in build/");
      console.log("       Run the full pipeline first (compile circuit → setup → generate proof)");
      this.skip();
    }
  });

  it("should verify a real zk-SNARK proof and update state root", async function () {
    if (!hasProofData) this.skip();

    const proofData = JSON.parse(fs.readFileSync(proofPath, "utf8"));
    const stateRoots = JSON.parse(fs.readFileSync(rootsPath, "utf8"));

    const [owner] = await hre.ethers.getSigners();

    // Deploy the REAL Groth16Verifier (generated by snarkjs)
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    // Deploy Rollup with old state root as genesis
    const Rollup = await hre.ethers.getContractFactory("Rollup");
    const rollup = await Rollup.deploy(
      await verifier.getAddress(),
      stateRoots.oldStateRoot
    );
    await rollup.waitForDeployment();

    // Verify initial state
    expect(await rollup.stateRoot()).to.equal(BigInt(stateRoots.oldStateRoot));

    // Submit the real proof
    const tx = await rollup.submitBatch(
      proofData.pA,
      proofData.pB,
      proofData.pC,
      stateRoots.oldStateRoot,
      stateRoots.newStateRoot
    );
    await tx.wait();

    // Verify state was updated
    expect(await rollup.stateRoot()).to.equal(BigInt(stateRoots.newStateRoot));
    expect(await rollup.batchCount()).to.equal(1);

    console.log("    ✅ Real Groth16 proof verified on-chain!");
    console.log(`       Old root: ${stateRoots.oldStateRoot}`);
    console.log(`       New root: ${stateRoots.newStateRoot}`);
  });

  it("should reject a tampered proof (wrong newStateRoot)", async function () {
    if (!hasProofData) this.skip();

    const proofData = JSON.parse(fs.readFileSync(proofPath, "utf8"));
    const stateRoots = JSON.parse(fs.readFileSync(rootsPath, "utf8"));

    const [owner] = await hre.ethers.getSigners();

    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    const Rollup = await hre.ethers.getContractFactory("Rollup");
    const rollup = await Rollup.deploy(
      await verifier.getAddress(),
      stateRoots.oldStateRoot
    );
    await rollup.waitForDeployment();

    // Try submitting the proof with a WRONG newStateRoot
    // The real verifier should reject this
    const fakeNewRoot = BigInt(stateRoots.newStateRoot) + 1n;

    await expect(
      rollup.submitBatch(
        proofData.pA,
        proofData.pB,
        proofData.pC,
        stateRoots.oldStateRoot,
        fakeNewRoot.toString()
      )
    ).to.be.revertedWithCustomError(rollup, "InvalidProof");
  });
});

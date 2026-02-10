# ZK-Rollup Proof of Concept — Execution Guide

## Overview

This guide walks through every step needed to run the ZK-Rollup PoC end-to-end: from compiling the circuit and executing real testnet transactions, to generating a zk-SNARK proof and verifying it on-chain.

---

## Prerequisites

### Software

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| **Rust** | Latest stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **circom** | ≥ 2.0 | See below |
| **MetaMask** | Browser extension | [metamask.io](https://metamask.io) |

### Install circom

```bash
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
circom --version   # should print 2.x.x
```

### MetaMask Setup

1. Install MetaMask in your browser
2. Create or import **two accounts** (Account A and Account B)
3. Add the target network:

**XRPL EVM Sidechain Testnet:**
- Network Name: `XRPL EVM Sidechain`
- RPC URL: `https://rpc-evm-sidechain.xrpl.org`
- Chain ID: `1440002`
- Currency Symbol: `XRP`
- Explorer: `https://explorer.xrpl.org`

**Fallback — Sepolia:**
- Network Name: `Sepolia`
- RPC URL: `https://rpc.sepolia.org`
- Chain ID: `11155111`
- Currency Symbol: `ETH`
- Faucet: `https://sepoliafaucet.com`

4. Fund both accounts with testnet ETH/XRP from the relevant faucet

---

## Step-by-Step Execution

### Step 0: Install Dependencies

```bash
cd zk-rollup-poc
npm install
```

### Step 1: Compile the Circom Circuit

```bash
chmod +x scripts/1_compile_circuit.sh
./scripts/1_compile_circuit.sh
```

**What this does:**
- Compiles `circuits/batch_verify.circom` into R1CS (constraint system), WASM (witness generator), and SYM (debug symbols)
- Output goes to `build/`

**Expected output:**
```
✅ Circuit compiled successfully!
Circuit statistics:
  Constraints: ~300
  Private inputs: 14
  Public inputs: 2
```

### Step 2: Run the Trusted Setup Ceremony

```bash
chmod +x scripts/2_setup_ceremony.sh
./scripts/2_setup_ceremony.sh
```

**What this does:**
- **Phase 1** (Powers of Tau): Generates universal ceremony parameters with entropy contributions and a random beacon
- **Phase 2** (Circuit-specific): Generates the proving key (`circuit_final.zkey`), verification key, and Solidity verifier contract

**Expected output:**
```
✅ Trusted Setup Complete!
Generated files:
  build/circuit_final.zkey       — Proving key
  build/verification_key.json    — Verification key
  contracts/Verifier.sol         — On-chain verifier (REPLACED placeholder)
```

**⚠️ Important:** This replaces the placeholder `Verifier.sol` with the real snarkjs-generated verifier. Recompile contracts after this step.

### Step 3: Execute Testnet Transactions (Frontend)

```bash
cd frontend
npm install
npx vite
```

Open `http://localhost:5173` in your browser, then:

1. **Connect MetaMask** — click "Connect MetaMask" and approve
2. **Verify accounts** — confirm Account A and Account B are shown with balances
3. **Execute TX1** — click "TX1: A → B" to send ETH from A to B via MetaMask
4. **Execute TX2** — switch to Account B in MetaMask, then click "TX2: B → A"
5. **Export batch** — click "Generate Rollup Batch" and download `captured_txs.json`

Save `captured_txs.json` to the project root.

### Step 4: Generate Circuit Input

**Option A — From captured transactions:**
```bash
node scripts/generate_input.js --tx-file captured_txs.json
```

**Option B — Using default example values (for testing):**
```bash
node scripts/generate_input.js
```

**What this does:**
- Reads transaction data
- Computes old and new state roots using the same hash function as the circuit
- Writes `build/input.json` and `build/state_roots.json`

### Step 5: Generate the zk-SNARK Proof

```bash
node scripts/3_generate_proof.js
```

**What this does:**
1. Loads `input.json` and generates the witness
2. Creates a Groth16 proof using `circuit_final.zkey`
3. Verifies the proof locally against the verification key
4. Exports proof in Solidity-compatible format

**Expected output:**
```
✅ Proof is VALID!
Outputs:
  build/proof.json           — Raw proof
  build/public.json          — Public signals
  build/proof_calldata.json  — Formatted for Solidity
```

### Step 6: Compile and Deploy Contracts

```bash
# Recompile (important: Verifier.sol was replaced in Step 2)
npx hardhat compile

# Run tests locally
npx hardhat test

# Deploy to testnet
npx hardhat run scripts/4_deploy.js --network xrplEvmSidechain
# or
npx hardhat run scripts/4_deploy.js --network sepolia
```

**What this does:**
- Deploys `Groth16Verifier` (the on-chain verifier)
- Deploys `Rollup` initialized with the old state root
- Saves deployment addresses to `build/deployment_<network>.json`

### Step 7: Submit the Rollup Proof On-Chain

```bash
npx hardhat run scripts/5_submit_rollup.js --network xrplEvmSidechain
# or
npx hardhat run scripts/5_submit_rollup.js --network sepolia
```

**What this does:**
1. Loads the proof and deployment info
2. Calls `Rollup.submitBatch()` with the Groth16 proof
3. The contract verifies the proof using the on-chain verifier
4. If valid, the state root is updated on-chain

**Expected output:**
```
✅ ROLLUP BATCH SUCCESSFULLY VERIFIED!
The zk-SNARK proof was verified on-chain
and the rollup state root has been updated.
```

---

## Quick Reference — Full Pipeline

```bash
# 1. Install
npm install

# 2. Compile circuit
./scripts/1_compile_circuit.sh

# 3. Trusted setup
./scripts/2_setup_ceremony.sh

# 4. Generate input (default example)
node scripts/generate_input.js

# 5. Generate proof
node scripts/3_generate_proof.js

# 6. Compile & test contracts
npx hardhat compile
npx hardhat test

# 7. Deploy
npx hardhat run scripts/4_deploy.js --network sepolia

# 8. Submit proof on-chain
npx hardhat run scripts/5_submit_rollup.js --network sepolia
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `circom: command not found` | Ensure circom is in PATH: `export PATH="$HOME/.cargo/bin:$PATH"` |
| Powers of Tau takes too long | pot12 is correct for this circuit size; reduce to pot10 if needed |
| `insufficient funds` on deploy | Fund your deployer account from the testnet faucet |
| MetaMask shows wrong network | Switch network in MetaMask to match your target |
| Proof verification fails locally | Ensure input.json was generated AFTER the trusted setup |
| `StateRootMismatch` on submit | The on-chain root must match `oldStateRoot` from your batch |

---

## File Structure

```
zk-rollup-poc/
├── circuits/
│   └── batch_verify.circom      # ZK circuit (Groth16)
├── contracts/
│   ├── Rollup.sol               # Main rollup contract
│   └── Verifier.sol             # Groth16 verifier (generated/placeholder)
├── scripts/
│   ├── 1_compile_circuit.sh     # Compile circom → R1CS + WASM
│   ├── 2_setup_ceremony.sh      # Powers of Tau + Phase 2
│   ├── 3_generate_proof.js      # Witness + Groth16 proof
│   ├── 4_deploy.js              # Deploy to testnet
│   ├── 5_submit_rollup.js       # Submit proof on-chain
│   └── generate_input.js        # Build circuit input from txs
├── frontend/
│   └── src/App.jsx              # MetaMask transaction dashboard
├── test/
│   └── Rollup.test.js           # Contract unit tests
├── build/                       # (generated) circuit artifacts, proofs
├── hardhat.config.js
├── package.json
├── .env.example
├── EXECUTION_GUIDE.md           # This file
└── ACADEMIC_EXPLANATION.md      # Dissertation-ready explanation
```

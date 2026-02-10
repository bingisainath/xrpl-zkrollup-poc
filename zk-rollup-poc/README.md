# ZK-Rollup Proof of Concept

**A fully functional ZK-Rollup PoC using real testnet transactions, Groth16 proofs, and on-chain verification.**

Built for academic research (Master's dissertation) demonstrating the core architecture of zkSync/Scroll-style ZK-Rollups on EVM-compatible chains (XRPL EVM Sidechain or Sepolia).

## What It Does

1. **Real transactions** — Execute ETH transfers between MetaMask wallets on a testnet
2. **Off-chain batching** — Collect and batch transactions with state root computation
3. **zk-SNARK proof** — Generate a Groth16 proof that the batch is valid (circom + snarkjs)
4. **On-chain verification** — Verify the proof on-chain and update the rollup state root

## Quick Start

```bash
npm install
./scripts/1_compile_circuit.sh      # Compile circom circuit
./scripts/2_setup_ceremony.sh       # Trusted setup (Powers of Tau + Phase 2)
node scripts/generate_input.js      # Generate circuit input
node scripts/3_generate_proof.js    # Generate zk-SNARK proof
npx hardhat compile                 # Compile Solidity contracts
npx hardhat test                    # Run tests
npx hardhat run scripts/4_deploy.js --network sepolia        # Deploy
npx hardhat run scripts/5_submit_rollup.js --network sepolia # Submit proof
```

## Documentation

- **[EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md)** — Step-by-step walkthrough
- **[ACADEMIC_EXPLANATION.md](./ACADEMIC_EXPLANATION.md)** — Dissertation-ready technical analysis

## Architecture

```
User (MetaMask) → Testnet Tx → Operator (batch) → circom Circuit → Groth16 Proof
                                                                         ↓
                                            L1: Rollup.sol ← Verifier.sol
                                                    ↓
                                            State Root Updated ✅
```

## Stack

| Component | Technology |
|-----------|------------|
| ZK Circuit | circom 2.0 (Groth16) |
| Proof System | snarkjs |
| Smart Contracts | Solidity 0.8.20 + Hardhat |
| Frontend | React + ethers.js + MetaMask |
| Networks | XRPL EVM Sidechain / Sepolia |

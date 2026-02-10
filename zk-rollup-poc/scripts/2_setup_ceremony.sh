#!/bin/bash
# ============================================================
# Script 2: Powers of Tau Ceremony + Circuit-Specific Setup
# ============================================================
# Performs the Groth16 trusted setup in two phases:
#
# Phase 1 — Powers of Tau (universal, circuit-independent):
#   - Generate initial parameters
#   - Apply random entropy contributions
#   - Apply random beacon for finality
#   - Prepare for Phase 2
#
# Phase 2 — Circuit-Specific Setup:
#   - Generate the proving key (zkey) for our circuit
#   - Apply additional entropy contribution
#   - Export verification key (JSON)
#   - Export Solidity verifier contract
#
# The resulting files are used for proof generation and
# on-chain verification.
# ============================================================

set -e

BUILD_DIR="build"

echo "============================================"
echo "  ZK-Rollup PoC — Trusted Setup Ceremony"
echo "============================================"

# Verify circuit has been compiled
if [ ! -f "$BUILD_DIR/batch_verify.r1cs" ]; then
    echo "ERROR: Circuit not compiled. Run ./scripts/1_compile_circuit.sh first."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  PHASE 1: Powers of Tau (Universal Setup)"
echo "═══════════════════════════════════════════"
echo ""

# pot12 supports circuits up to 2^12 = 4096 constraints
# Our circuit is small, so this is more than sufficient
POT_SIZE=12

echo "[1/4] Starting new Powers of Tau ceremony (2^$POT_SIZE)..."
npx snarkjs powersoftau new bn128 $POT_SIZE \
    "$BUILD_DIR/pot${POT_SIZE}_0000.ptau" -v

echo ""
echo "[2/4] Contributing entropy (simulated participant 1)..."
npx snarkjs powersoftau contribute \
    "$BUILD_DIR/pot${POT_SIZE}_0000.ptau" \
    "$BUILD_DIR/pot${POT_SIZE}_0001.ptau" \
    --name="ZK-Rollup PoC Contribution 1" -v -e="$(head -c 64 /dev/urandom | xxd -p)"

echo ""
echo "[3/4] Applying random beacon for finality..."
npx snarkjs powersoftau beacon \
    "$BUILD_DIR/pot${POT_SIZE}_0001.ptau" \
    "$BUILD_DIR/pot${POT_SIZE}_beacon.ptau" \
    "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20" 10 \
    -n="Final Beacon"

echo ""
echo "[4/4] Preparing Phase 2..."
npx snarkjs powersoftau prepare phase2 \
    "$BUILD_DIR/pot${POT_SIZE}_beacon.ptau" \
    "$BUILD_DIR/pot${POT_SIZE}_final.ptau" -v

echo ""
echo "✅ Phase 1 complete!"
echo ""

echo "═══════════════════════════════════════════"
echo "  PHASE 2: Circuit-Specific Setup (Groth16)"
echo "═══════════════════════════════════════════"
echo ""

echo "[1/4] Generating initial zkey..."
npx snarkjs groth16 setup \
    "$BUILD_DIR/batch_verify.r1cs" \
    "$BUILD_DIR/pot${POT_SIZE}_final.ptau" \
    "$BUILD_DIR/circuit_0000.zkey"

echo ""
echo "[2/4] Contributing to Phase 2 ceremony..."
npx snarkjs zkey contribute \
    "$BUILD_DIR/circuit_0000.zkey" \
    "$BUILD_DIR/circuit_final.zkey" \
    --name="ZK-Rollup PoC Phase 2 Contribution" -v \
    -e="$(head -c 64 /dev/urandom | xxd -p)"

echo ""
echo "[3/4] Exporting verification key (JSON)..."
npx snarkjs zkey export verificationkey \
    "$BUILD_DIR/circuit_final.zkey" \
    "$BUILD_DIR/verification_key.json"

echo ""
echo "[4/4] Exporting Solidity verifier contract..."
npx snarkjs zkey export solidityverifier \
    "$BUILD_DIR/circuit_final.zkey" \
    "contracts/Verifier.sol"

echo ""
echo "============================================"
echo "  ✅ Trusted Setup Complete!"
echo "============================================"
echo ""
echo "Generated files:"
echo "  $BUILD_DIR/circuit_final.zkey       — Proving key"
echo "  $BUILD_DIR/verification_key.json    — Verification key"
echo "  contracts/Verifier.sol              — On-chain verifier"
echo ""
echo "⚠️  IMPORTANT: The placeholder Verifier.sol has been"
echo "    replaced with the real snarkjs-generated verifier."
echo "    Run 'npx hardhat compile' to recompile contracts."
echo ""
echo "Next step: node scripts/generate_input.js"

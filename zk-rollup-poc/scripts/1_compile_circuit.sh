#!/bin/bash
# ============================================================
# Script 1: Compile the circom circuit
# ============================================================
# This compiles the BatchVerify circuit to:
#   - batch_verify.r1cs   (constraint system)
#   - batch_verify.wasm   (witness generator)
#   - batch_verify.sym     (debug symbols)
# ============================================================

set -e

CIRCUIT_DIR="circuits"
BUILD_DIR="build"

echo "============================================"
echo "  ZK-Rollup PoC — Circuit Compilation"
echo "============================================"

# Create build directory
mkdir -p "$BUILD_DIR"

# Check circom is installed
if ! command -v circom &> /dev/null; then
    echo "ERROR: circom is not installed."
    echo ""
    echo "Install circom:"
    echo "  git clone https://github.com/iden3/circom.git"
    echo "  cd circom"
    echo "  cargo build --release"
    echo "  cargo install --path circom"
    echo ""
    echo "Requires Rust: https://rustup.rs"
    exit 1
fi

echo ""
echo "[1/1] Compiling circuit: $CIRCUIT_DIR/batch_verify.circom"
echo ""

circom "$CIRCUIT_DIR/batch_verify.circom" \
    --r1cs \
    --wasm \
    --sym \
    --output "$BUILD_DIR"

echo ""
echo "✅ Circuit compiled successfully!"
echo ""
echo "Outputs in $BUILD_DIR/:"
echo "  - batch_verify.r1cs  (constraint system)"
echo "  - batch_verify_js/   (WASM witness generator)"
echo "  - batch_verify.sym   (debug symbols)"
echo ""

# Print circuit info
echo "Circuit statistics:"
npx snarkjs r1cs info "$BUILD_DIR/batch_verify.r1cs"

echo ""
echo "Next step: Run ./scripts/2_setup_ceremony.sh"

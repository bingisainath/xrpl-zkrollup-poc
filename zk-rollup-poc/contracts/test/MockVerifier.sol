// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockVerifier
 * @notice Test-only verifier that always returns true.
 *         Used for unit testing the Rollup contract logic
 *         independently of the ZK proof system.
 *
 *         DO NOT deploy this to any real network.
 */
contract MockVerifier {
    function verifyProof(
        uint[2] calldata,
        uint[2][2] calldata,
        uint[2] calldata,
        uint[2] calldata
    ) public pure returns (bool) {
        return true;
    }
}

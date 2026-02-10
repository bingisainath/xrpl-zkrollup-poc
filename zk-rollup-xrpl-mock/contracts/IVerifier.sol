// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IVerifier
 * @dev Interface for ZK proof verification
 */
interface IVerifier {
    /**
     * @dev Verify a ZK proof
     * @param proof The ZK proof bytes
     * @param publicInputs Public inputs to the proof
     * @return True if the proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
}

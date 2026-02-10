// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IVerifier.sol";

/**
 * @title SimpleRollup
 * @dev A simplified ZK rollup contract for XRPL EVM
 * This contract manages state roots and verifies ZK proofs for batched transactions
 */
contract SimpleRollup {
    // State root represents the current state of all accounts in the rollup
    bytes32 public stateRoot;
    
    // Verifier contract that checks ZK proofs
    IVerifier public verifier;
    
    // Batch counter
    uint256 public batchNumber;
    
    // Operator address (in production, this would be more sophisticated)
    address public operator;
    
    // Events
    event BatchSubmitted(
        uint256 indexed batchNumber,
        bytes32 oldStateRoot,
        bytes32 newStateRoot,
        uint256 timestamp
    );
    
    event Deposit(
        address indexed user,
        uint256 amount,
        uint256 rollupBalance
    );
    
    // Account balances in the rollup
    mapping(address => uint256) public balances;
    
    constructor(address _verifier, bytes32 _initialStateRoot) {
        verifier = IVerifier(_verifier);
        stateRoot = _initialStateRoot;
        operator = msg.sender;
        batchNumber = 0;
    }
    
    /**
     * @dev Deposit funds into the rollup
     * Users deposit ETH which gets tracked in the rollup state
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        balances[msg.sender] += msg.value;
        
        emit Deposit(msg.sender, msg.value, balances[msg.sender]);
    }
    
    /**
     * @dev Submit a batch of transactions with ZK proof
     * @param _newStateRoot The new state root after applying the batch
     * @param _proof The ZK proof that the state transition is valid
     * @param _publicInputs Public inputs for the proof (old root, new root, etc.)
     */
    function submitBatch(
        bytes32 _newStateRoot,
        bytes calldata _proof,
        uint256[] calldata _publicInputs
    ) external {
        require(msg.sender == operator, "Only operator can submit batches");
        
        // Verify that the proof is valid
        require(
            verifier.verifyProof(_proof, _publicInputs),
            "Invalid proof"
        );
        
        // Verify that the old state root matches
        require(
            bytes32(_publicInputs[0]) == stateRoot,
            "Old state root mismatch"
        );
        
        // Update state root
        bytes32 oldStateRoot = stateRoot;
        stateRoot = _newStateRoot;
        batchNumber++;
        
        emit BatchSubmitted(batchNumber, oldStateRoot, _newStateRoot, block.timestamp);
    }
    
    /**
     * @dev Get current state information
     */
    function getState() external view returns (
        bytes32 currentStateRoot,
        uint256 currentBatchNumber,
        address currentOperator
    ) {
        return (stateRoot, batchNumber, operator);
    }
    
    /**
     * @dev Update operator (in production, use multisig or governance)
     */
    function updateOperator(address _newOperator) external {
        require(msg.sender == operator, "Only operator can update");
        operator = _newOperator;
    }
}

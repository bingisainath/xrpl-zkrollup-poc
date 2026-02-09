pragma solidity ^0.8.28;  // Compiler version

contract SimpleStorage {
    // STATE VARIABLE - stored permanently on blockchain
    uint256 private storedData;
    
    // EVENT - logs when something happens (for tracking)
    event DataStored(uint256 newValue, address setter);
    
    // FUNCTION 1: Write data to blockchain
    function set(uint256 x) public {
        storedData = x;  // Store the number
        emit DataStored(x, msg.sender);  // Log who stored it
    }
    
    // FUNCTION 2: Read data from blockchain
    function get() public view returns (uint256) {
        return storedData;  // Return the stored number
    }
}
// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
// };

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    // XRPL EVM Mainnet
    
    // XRPL EVM Testnet
    xrplTestnet: {
      url: "https://rpc.testnet.xrplevm.org",
      accounts: process.env.TEST_PRIVATE_KEY ? [process.env.TEST_PRIVATE_KEY] : [],
      chainId: 1449000
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
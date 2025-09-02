/** @type {import('hardhat/config').HardhatUserConfig} */
import "@nomicfoundation/hardhat-toolbox"; // <-- this loads hardhat-ethers for you

export default {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  // Exclude all Foundry-related files
  ignore: [
    "**/*.t.sol",           // Test files
    "**/forge-std/**",      // Forge standard library
    "**/lib/**"             // Foundry dependencies
  ]

};
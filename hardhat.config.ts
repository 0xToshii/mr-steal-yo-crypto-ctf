import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { 
        version: "0.8.6"
      }
    ],
  },
  mocha: {
    timeout: 300 * 1e3,
  }
};

export default config;

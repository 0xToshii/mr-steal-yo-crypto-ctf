import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true 
    }
  },
  solidity: {
    compilers: [
      { version: "0.8.6" },
      { version: "0.6.6" },
      { version: "0.5.16" }
    ],
  },
  mocha: {
    timeout: 300 * 1e3,
  }
};

export default config;

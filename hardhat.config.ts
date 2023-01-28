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
      { version: "0.8.7" },
      { version: "0.8.6" },
      { version: "0.6.6" },
      { version: "0.5.17" },
      { version: "0.5.16" },
      { version: "0.4.24" },
      { version: "0.4.11" }
    ],
  },
  mocha: {
    timeout: 300 * 1e3,
  }
};

export default config;

require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      chainId: 296,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      timeout: 180000,
      gasPrice: 480_000_000_000,
      gas: 3_000_000,
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

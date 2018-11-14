module.exports = {
  networks: {
      development: {
          host: "localhost",
          port: 7545, // Using ganache as development network
          network_id: "*",
          gas: 80000000,
          gasPrice: 25000000000
      }
  },
  solc: {
      optimizer: {
          enabled: true,
          runs: 200
      }
  }
};
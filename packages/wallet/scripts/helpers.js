const {
  parseABI,
  parseContractAddress,
} = require('magmo-devtools');
const path = require('path');

module.exports = {
  getNetworkId: function () {
    if (!process.env.TARGET_NETWORK_ID) {
      console.error('TARGET_NETWORK_ID is not defined. Please update your .env file and specify a TARGET_NETWORK_ID');
      process.exit(1);
    } else if (process.env.TARGET_NETWORK_ID.length == 0 || isNaN(process.env.TARGET_NETWORK_ID)) {
      console.error('TARGET_NETWORK_ID is not a number. Please update your .env file and specify a number for TARGET_NETWORK_ID');
      process.exit(1);
    } else {
      return parseInt(process.env.TARGET_NETWORK_ID);
    }
  },

  setContractEnvironmentVariables: function (networkId, artifactDirectory) {
    if (!process.env.CONSENSUS_LIBRARY_ADDRESS) {
      process.env.CONSENSUS_LIBRARY_ADDRESS = parseContractAddress(path.resolve(artifactDirectory, 'ConsensusApp.json'), networkId);
    }
    if (!process.env.ADJUDICATOR_ADDRESS) {
      process.env.ADJUDICATOR_ADDRESS = parseContractAddress(path.resolve(artifactDirectory, 'NitroAdjudicator.json'), networkId);
    }
    if (!process.env.ADJUDICATOR_ABI) {
      process.env.ADJUDICATOR_ABI = parseABI(path.resolve(artifactDirectory, 'NitroAdjudicator.json'), );
    }
  }
}
const {
  deployContracts,
  startGanache,
  runJest,
} = require('magmo-devtools');
const paths = require('../config/paths');
const {
  getNetworkId,
  setContractEnvironmentVariables
} = require('./helpers');


process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';


const networkId = getNetworkId();

let argv = require('yargs').argv;
argv.i = networkId;

startGanache(argv).then(() => {
  deployContracts().then(() => {

    setContractEnvironmentVariables(networkId, paths.buildContracts);

    // TODO: This should passed into runJest once it is updated to accept arguments.
    process.argv.push('-c');
    process.argv.push('./config/jest/jest.contracts.config.js');
    process.argv.push('--runInBand');
    runJest().then((output) => {
      // startGanache does not exit on its own, so we have to exit the process manually
      // once jest has finished running
      if (output.results.numFailedTestSuites > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
  });
});
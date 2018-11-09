var TicTacToehelper = artifacts.require("TicTacToehelpers");

module.exports = function(deployer) {
  deployer.deploy(TicTacToehelper);
};
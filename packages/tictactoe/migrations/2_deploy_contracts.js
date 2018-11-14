var State = artifacts.require("fmg-core/contracts/State.sol");
var TicTacToeState = artifacts.require("TicTacToeState");
var TicTacToeGame = artifacts.require("TicTacToeGame");

module.exports = function(deployer) {
  deployer.deploy(State);

  deployer.link(State, TicTacToeState);
  deployer.deploy(TicTacToeState);

  deployer.link(TicTacToeState, TicTacToeGame);
  deployer.link(State, TicTacToeGame);
  deployer.deploy(TicTacToeGame);
};
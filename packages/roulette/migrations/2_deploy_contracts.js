var RouletteGame = artifacts.require("./RouletteGame.sol");
var RouletteCommitment = artifacts.require("./RouletteCommitment.sol");
var Commitment = artifacts.require("fmg-core/contracts/Commitment.sol");

module.exports = function (deployer) {
  deployer.deploy(Commitment);
  deployer.link(Commitment, RouletteCommitment);
  deployer.deploy(RouletteCommitment);
  deployer.link(RouletteCommitment, RouletteGame);
  deployer.link(Commitment, RouletteGame);
  deployer.deploy(RouletteGame);

};
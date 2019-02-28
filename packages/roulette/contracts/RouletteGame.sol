pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "fmg-core/contracts/Commitment.sol";
import "./RouletteCommitment.sol";

contract RouletteGame {

    function validTransition(Commitment.CommitmentStruct memory _old, Commitment.CommitmentStruct memory _new) public pure returns (bool) {
	// TODO: Validate app transitions
	return true;    
    }
}
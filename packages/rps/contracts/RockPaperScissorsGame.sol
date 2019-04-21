pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "fmg-core/contracts/Commitment.sol";
import "./RockPaperScissorsCommitment.sol";

contract RockPaperScissorsGame {
    // The following transitions are allowed:
    //
    // Start -> RoundProposed
    // RoundProposed -> Start // reject game
    // RoundProposed -> RoundAccepted
    // RoundAccepted -> Reveal
    // Reveal -> Start
    //

    function validTransition(Commitment.CommitmentStruct memory _old, Commitment.CommitmentStruct memory _new) public pure returns (bool) {
        RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment = RockPaperScissorsCommitment.fromFrameworkCommitment(_old);
        RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment = RockPaperScissorsCommitment.fromFrameworkCommitment(_new);

        if (oldCommitment.positionType == RockPaperScissorsCommitment.PositionType.Start) {
            if (newCommitment.positionType == RockPaperScissorsCommitment.PositionType.RoundProposed) {
                validateStartToRoundProposed(oldCommitment, newCommitment);

                return true;
            }
        } else if (oldCommitment.positionType == RockPaperScissorsCommitment.PositionType.RoundProposed) {
            if (newCommitment.positionType == RockPaperScissorsCommitment.PositionType.Start) { // game rejected
                validateRoundProposedToRejected(oldCommitment, newCommitment);

                return true;
            } else if (newCommitment.positionType == RockPaperScissorsCommitment.PositionType.RoundAccepted) {
                validateRoundProposedToRoundAccepted(oldCommitment, newCommitment);

                return true;
            }
        } else if (oldCommitment.positionType == RockPaperScissorsCommitment.PositionType.RoundAccepted) {
            if (newCommitment.positionType == RockPaperScissorsCommitment.PositionType.Reveal) {
                validateRoundAcceptedToReveal(oldCommitment, newCommitment);

                return true;
            }
        } else if (oldCommitment.positionType == RockPaperScissorsCommitment.PositionType.Reveal) {
            if (newCommitment.positionType == RockPaperScissorsCommitment.PositionType.Start) {
                validateRevealToStart(oldCommitment, newCommitment);

                return true;
            }
        }

        revert("No valid transition found for commitments");
    }

    function winnings(RockPaperScissorsCommitment.Weapon firstWeapon, RockPaperScissorsCommitment.Weapon secondWeapon, uint256 stake)
    private pure returns (uint256, uint256) {
        if (firstWeapon == secondWeapon) { // no-one won
            return (stake, stake);
        } else if ((firstWeapon == RockPaperScissorsCommitment.Weapon.Rock && secondWeapon == RockPaperScissorsCommitment.Weapon.Scissors) ||
                  (firstWeapon > secondWeapon)) { // first player won
            return (2 * stake, 0);
        } else { // second player won
            return (0, 2 * stake);
        }
    }

    modifier resolutionsUnchanged(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment) {
        uint aOldBal = oldCommitment.allocation[0];
        uint bOldBal = oldCommitment.allocation[1];
        uint aNewBal = newCommitment.allocation[0];
        uint bNewBal = newCommitment.allocation[1];

        require(aOldBal == aNewBal,"The resolution for player A must be the same between commitments."); // resolution unchanged
        require(bOldBal == bNewBal,"The resolution for player B must be the same between commitments."); // resolution unchanged
        _;
    }

    modifier stakeUnchanged(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment) {
        require(newCommitment.stake == oldCommitment.stake,"The stake should be the same between commitments");
        _;
    }

    modifier integerOverflowPrevented(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment) {
        require(oldCommitment.allocation[0] >= newCommitment.stake, "The allocation for player A must not fall below the stake (Preventing a integer overflow attack).");
        require(oldCommitment.allocation[1] >= newCommitment.stake, "The allocation for player B must not fall below the stake (Preventing a integer overflow attack).");
        _;
    }

    // transition validations
    function validateStartToRoundProposed(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment)
     private
     pure
     resolutionsUnchanged(oldCommitment, newCommitment)
     stakeUnchanged(oldCommitment, newCommitment)
     integerOverflowPrevented(oldCommitment, newCommitment)
     {
        // we should maybe require that aPreCommit isn't empty, but then it will only hurt a later if it is
    }

    function validateStartToConcluded(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment)
    private
    pure
    resolutionsUnchanged(oldCommitment, newCommitment)
    stakeUnchanged(oldCommitment, newCommitment)
    { }

    function validateRoundProposedToRejected(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment)
    private
    pure
    resolutionsUnchanged(oldCommitment, newCommitment)
    stakeUnchanged(oldCommitment, newCommitment)
    { }

    function validateRoundProposedToRoundAccepted(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment)
    private
    pure
    stakeUnchanged(oldCommitment, newCommitment)
    {
        // a will have to reveal, so remove the stake beforehand
        require(newCommitment.allocation[0] == oldCommitment.allocation[0] - oldCommitment.stake,"Resolution for player A should be decremented by 1 stake from the previous commitment.");
        require(newCommitment.allocation[1] == oldCommitment.allocation[1] + oldCommitment.stake,"Resolution for player B should be incremented by 1 stake from the previous commitment.");
        require(newCommitment.preCommit == oldCommitment.preCommit,"Precommit should be the same as the previous commitment.");
    }

    function validateRoundAcceptedToReveal(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment)
    private
    pure
    stakeUnchanged(oldCommitment, newCommitment)
    {
        uint256 aWinnings;
        uint256 bWinnings;
        require(newCommitment.bWeapon == oldCommitment.bWeapon,"Player Bs play should be the same between commitments.");

        // check hash matches
        // need to convert Weapon -> uint256 to get hash to work
        bytes32 hashed = keccak256(abi.encodePacked(uint256(newCommitment.aWeapon), newCommitment.salt));
        require(hashed == oldCommitment.preCommit,"The hash needs to match the precommit");

        // calculate winnings
        (aWinnings, bWinnings) = winnings(newCommitment.aWeapon, newCommitment.bWeapon, newCommitment.stake);

        require(newCommitment.allocation[0] == oldCommitment.allocation[0] + aWinnings,"Player A's resolution should be updated with the winning");
        require(newCommitment.allocation[1] == oldCommitment.allocation[1] - 2 * oldCommitment.stake + bWinnings,"Player B's resolution should be updated with the winning");
    }

    function validateRevealToStart(RockPaperScissorsCommitment.RPSCommitmentStruct memory oldCommitment, RockPaperScissorsCommitment.RPSCommitmentStruct memory newCommitment)
    private
    pure
    resolutionsUnchanged(oldCommitment, newCommitment)
    stakeUnchanged(oldCommitment, newCommitment)
    { }
}

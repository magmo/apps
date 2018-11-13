pragma solidity ^0.4.18;

import "fmg-core/contracts/State.sol";
import "./TicTacToeState.sol";
import "./TTThelpers.sol";

contract TicTacToeGame {
    using TicTacToeState for bytes;

    // The following transitions are allowed:
    //
    // Start   -> Propose
    // Propose -> Start // reject game
    // Propose -> Playing
    // Playing -> Playing
    // Playing -> Victory
    // Playing -> Draw
    // Victory -> Start
    // Draw    -> Start 
    // Start   -> Draw
    // 
    // TODO consider a round having 2 subrounds, where we allow player 2 to propose on the second subround
    // TODO (so player 1 then plays first)
    //
    function validTransition(bytes _old, bytes _new) public pure returns (bool) {
        if (_old.positionType() == TicTacToeState.PositionType.Start) {
            if (_new.positionType() == TicTacToeState.PositionType.Propose) {
                validateStartToPropose(_old, _new);

                return true;
            } else if (_new.positionType() == TicTacToeState.PositionType.Draw) {
                validateStartToDraw(_old, _new);

                return true;
            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Propose) {
            if (_new.positionType() == TicTacToeState.PositionType.Start) { // game rejected
                validateProposeToRejected(_old, _new);

                return true;
            } else if (_new.positionType() == TicTacToeState.PositionType.Playing) {
                validateRoundProposeToPlaying(_old, _new);

                return true;
            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Playing) {
            if (_new.positionType() == TicTacToeState.PositionType.Playing) {
                validatePlayingToPlaying(_old, _new);

                return true;
            }
            if (_new.positionType() == TicTacToeState.PositionType.Draw) {
                validatePlayingToDraw(_old, _new);

                return true;
            }
            if (_new.positionType() == TicTacToeState.PositionType.Victory) {
                validatePlayingToVictory(_old, _new);

                return true;
            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Draw) {
            if (_new.positionType() == TicTacToeState.PositionType.Start) {
                validateDrawToStart(_old, _new);

                return true;
            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Victory) {
            if (_new.positionType() == TicTacToeState.PositionType.Start) {
                validateVictoryToStart(_old, _new);

                return true;
            }
        }

        revert();
    }

    // function winnings(TicTacToeState.Play firstPlay, TicTacToeState.Play secondPlay, uint256 stake)
    // private pure returns (uint256, uint256) {
    //     if (firstPlay == secondPlay) { // no-one won
    //         return (stake, stake);
    //     } else if ((firstPlay == TicTacToeState.Play.Rock && secondPlay == TicTacToeState.Play.Scissors) ||
    //               (firstPlay > secondPlay)) { // first player won
    //         return (2 * stake, 0);
    //     } else { // second player won
    //         return (0, 2 * stake);
    //     }
    // }

    // transition validations
    function validateStartToPropose(bytes _old, bytes _new) private pure {
        // require(_new.stake() == _old.stake());
        // require(_old.aResolution() >= _new.stake()); // avoid integer overflow attacks
        // require(_old.bResolution() >= _new.stake()); // avoid integer overflow attacks
        // require(_new.aResolution() == _old.aResolution()); // resolution unchanged
        // require(_new.bResolution() == _old.bResolution()); // resolution unchanged

        // we should maybe require that aPreCommit isn't empty, but then it will only hurt a later if it is
    }

    function validateStartToDraw(bytes _old, bytes _new) private pure {

    }

    function validatePlayingToPlaying(bytes _old, bytes _new) private pure {

    }
    
    function validatePlayingToVictory(bytes _old, bytes _new) private pure {

    }

    function validateDrawToStart(bytes _old, bytes _new) private pure {

    }

    function validateVictoryToStart(bytes _old, bytes _new) private pure {

    }

    function validatePlayingToDraw(bytes _old, bytes _new) private pure {

    }



    function validateStartToConcluded(bytes _old, bytes _new) private pure {
        // require(_new.stake() == _old.stake());
        // require(_new.aResolution() == _old.aResolution());
        // require(_new.bResolution() == _old.bResolution());
    }

    function validateProposeToRejected(bytes _old, bytes _new) private pure {
        // require(_new.stake() == _old.stake());
        // require(_new.aResolution() == _old.aResolution()); // resolution unchanged
        // require(_new.bResolution() == _old.bResolution()); // resolution unchanged
    }

    function validateRoundProposedToRoundAccepted(bytes _old, bytes _new) private pure {
        // a will have to reveal, so remove the stake beforehand
        // require(_new.aResolution() == _old.aResolution() - _old.stake());
        // require(_new.bResolution() == _old.bResolution() + _old.stake());
        // require(_new.stake() == _old.stake());
        // require(_new.preCommit() == _old.preCommit());
    }
        
    function validateRoundProposeToPlaying(bytes _old, bytes _new) private pure {
        // a will have to reveal, so remove the stake beforehand
        // require(_new.aResolution() == _old.aResolution() - _old.stake());
        // require(_new.bResolution() == _old.bResolution() + _old.stake());
        // require(_new.stake() == _old.stake());
        // require(_new.preCommit() == _old.preCommit());
    }

    function validateRoundAcceptedToReveal(bytes _old, bytes _new) private pure {
        // uint256 aWinnings;
        // uint256 bWinnings;

        // require(_new.stake() == _old.stake());
        // require(_new.bPlay() == _old.bPlay());

        // // check hash matches
        // // need to convert Play -> uint256 to get hash to work
        // bytes32 hashed = keccak256(abi.encodePacked(uint256(_new.aPlay()), _new.salt()));
        // require(hashed == _old.preCommit());

        // // calculate winnings
        // (aWinnings, bWinnings) = winnings(_new.aPlay(), _new.bPlay(), _new.stake());

        // require(_new.aResolution() == _old.aResolution() + aWinnings);
        // require(_new.bResolution() == _old.bResolution() - 2 * _old.stake() + bWinnings);
    }

    function validateRevealToStart(bytes _old, bytes _new) private pure {
        // require(_new.stake() == _old.stake());
        // assert(_new.aResolution() == _old.aResolution());
        // assert(_new.bResolution() == _old.bResolution());
    }
}

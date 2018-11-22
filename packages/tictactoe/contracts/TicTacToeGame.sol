pragma solidity ^0.4.18;

import "fmg-core/contracts/State.sol";
import "./TicTacToeState.sol";

contract TicTacToeGame {
    using TicTacToeState for bytes;

    // The following transitions are allowed:
    //
    // Rest    -> Propose
    // Rest    -> Conclude
    //
    // Propose -> Rest // reject game
    // Propose -> Propose // counter proposal
    // Propose -> Accept
    //
    // Playing -> Playing
    // Playing -> Victory
    // Playing -> Draw
    //
    // Victory -> Rest
    // Victory -> Propose
    //
    // Draw    -> Rest
    // Draw    -> Propose
    //
    //  
    //
    function validTransition(bytes _old, bytes _new) public pure returns (bool) {

        if (_old.positionType() == TicTacToeState.PositionType.Rest) {
            
            if (_new.positionType() == TicTacToeState.PositionType.Propose) {

                validateRestToPropose(_old, _new);

                return true;

            } 
            else if (_new.positionType() == TicTacToeState.PositionType.Concluded) {

                validateRestToConcluded(_old,_new);

                return true;
            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Propose) {

            if (_new.positionType() == TicTacToeState.PositionType.Rest) { // game rejected

                validateProposeToRest(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Accept) {

                validateProposeToAccept(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Propose) {

                validateProposeToPropose(_old, _new);

                return true;

            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Playing) {

            if (_new.positionType() == TicTacToeState.PositionType.Playing) {

                validatePlayingToPlaying(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Draw) {

                validatePlayingToDraw(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Victory) {

                validatePlayingToVictory(_old, _new);

                return true;

            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Draw) {

            if (_new.positionType() == TicTacToeState.PositionType.Rest) {

                validateDrawToRest(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Propose) {

                validateDrawToPropose(_old, _new);

                return true;

            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Victory) {

            if (_new.positionType() == TicTacToeState.PositionType.Rest) {

                validateVictoryToRest(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Propose) {

                validateVictoryToPropose(_old, _new);

                return true;
            }
        }
        revert();
    }

    // transition validations

    function validateRestToPropose(bytes _old, bytes _new) private pure {
        // require(_new.stake() == _old.stake()); // not if we want to let proposer choose the stake
        require(_old.aResolution() >= _new.stake()); // cannot stake more than you have to lose
        require(_old.bResolution() >= _new.stake()); 
        require(_new.aResolution() == _old.aResolution()); // resolution unchanged
        require(_new.bResolution() == _old.bResolution()); // resolution unchanged
    }

    function validateRestToConcluded(bytes _old, bytes _new) private pure {
        require(_new.stake() == _old.stake());
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
    }

    function validateProposeToAccept(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution()); // no incentive yet
        require(_new.bResolution() == _old.bResolution());
        require(_new.stake() == _old.stake());
        require(_new.noughts() == 0);
        require(_new.crosses() == 0);
    }

    function validateProposeToRest(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
        // no requirement on _new.stake()
    }

    function validateProposeToPropose(bytes _old, bytes _new) private pure {
        validateRestToPropose(_old, _new);
    }

    function validateAcceptToPlay(bytes _old, bytes _new) private pure {
        require(_old.noughts() == 0);
        require(_old.crosses() == 0);
        if (State.indexOfMover(_new) == 0) {
            require(_new.aResolution() == _old.aResolution() + 2 *_new.stake()); // mover gets to claim stake, so that other player incentivised
            require(_new.bResolution() == _old.bResolution() - 2 * _new.stake());
        } else if (State.indexOfMover(_new) ==1) {
            require(_new.aResolution() == _old.aResolution() - 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 * _new.stake());
        }
        require(madeStrictlyOneMark(_new.noughts(), _old.noughts())); // noughts always goes first.
        require(_new.crosses() == _old.crosses());
    }


    function validatePlayingToPlaying(bytes _old, bytes _new) private pure {
        if (State.indexOfMover(_new) == 0) {
            require(_new.aResolution() == _old.aResolution() + 2 * 2 *_new.stake()); // note extra factor of 2 to swing fully to other player
            require(_new.bResolution() == _old.bResolution() - 2 * 2 *_new.stake());
        } else if (State.indexOfMover(_new) == 1) {
            require(_new.aResolution() == _old.aResolution() - 2 * 2 *_new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 * 2 *_new.stake());
        } // mover gets to claim stake, so that other player incentivised
        if (popCount(_old.noughts()) == popCount(_old.crosses())) {
            require(madeStrictlyOneMark(_new.noughts(), _old.noughts()));
            require((_new.crosses() == _old.crosses()));
        } else if (popCount(_old.noughts()) == 1 + popCount(_old.crosses())) {
            require(madeStrictlyOneMark(_new.crosses(), _old.crosses()));
            require((_new.noughts() == _old.noughts()));
        } // infer if noughts or crosses had the right to move.    
    }
    
    function validatePlayingToVictory(bytes _old, bytes _new) private pure {
        if (State.indexOfMover(_new) == 0) {
            require(_new.aResolution() == _old.aResolution() + 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() - 2 * _new.stake());
        } else if (State.indexOfMover(_new) ==1) {
            require(_new.aResolution() == _old.aResolution() - 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 * _new.stake());
        } // mover gets to claim stake, so that other player incentivised
        if (popCount(_old.noughts()) == popCount(_old.crosses())) {
            require(madeStrictlyOneMark(_new.noughts(), _old.noughts()));
            require((_new.crosses() == _old.crosses()));
            require(hasWon(_new.noughts()));
        } else if (popCount(_old.noughts()) == 1 + popCount(_old.crosses())) {
            require(madeStrictlyOneMark(_new.crosses(), _old.crosses()));
            require((_new.noughts() == _old.noughts()));
            require(hasWon(_new.crosses()));
        } // infer if the mover has a winning position   
    }

    function validatePlayingToDraw(bytes _old, bytes _new) private pure {
        require(isDraw(_new.noughts(), _new.crosses())); // check if board full
        if (State.indexOfMover(_new) == 0) {
            require(_new.aResolution() == _old.aResolution() + 2 * _new.stake()); // no extra factor of 2, restoring to parity
            require(_new.bResolution() == _old.bResolution() - 2 * _new.stake());
        } else if (State.indexOfMover(_new) ==1) {
            require(_new.aResolution() == _old.aResolution() - 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 * _new.stake());
        } // mover gets to restore parity to the winnings
        require(madeStrictlyOneMark(_new.noughts(), _old.noughts()));
        require((_new.crosses() == _old.crosses()));
        // noughts always plays first move and always plays a move that completes the board
    }

    function validateVictoryToRest(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
    }

    function validateDrawToRest(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
    }

    function validateVictoryToPropose(bytes _old, bytes _new) private pure {
        validateRestToPropose(_old, _new);
    }

    function validateDrawToPropose(bytes _old, bytes _new) private pure {
        validateRestToPropose(_old, _new);
    }

    // helper functions 
    
    // Unravelling of grid is as follows:
    // 
    //      0  |  1  |  2  
    //   +-----------------+
    //      3  |  4  |  5  
    //   +-----------------+
    //      6  |  7  |  8  
    // 
    // The binary representation for a single mark is 2**(8-index).
    //
    // e.g. noughts = 000000001
    //      crosses = 010000000
    // 
    // corresponds to 
    //
    //         |  X  |     
    //   +-----------------+
    //         |     |     
    //   +-----------------+
    //         |      |  0  
    // 
    //
    uint16 constant topRow = 448; /*  0b111000000 = 448 mask for win @ row 1 */
    uint16 constant midRow =  56; /*  0b000111000 =  56 mask for win @ row 2 */
    uint16 constant botRow =   7; /*  0b000000111 =   7 mask for win @ row 3 */
    uint16 constant lefCol = 292; /*  0b100100100 = 292 mask for win @ col 1 */
    uint16 constant midCol = 146; /*  0b010010010 = 146 mask for win @ col 2 */
    uint16 constant rigCol =  73; /*  0b001001001 =  73 mask for win @ col 3 */
    uint16 constant dhDiag = 273; /*  0b100010001 = 273 mask for win @ downhill diag */
    uint16 constant uhDiag =  84; /*  0b001010100 =  84 mask for win @ uphill diag */
    //
    uint16 constant fullBd = 511; /* 0b111111111 = 511 full board */

    function hasWon(uint16 _marks) public pure returns (bool) {
        return (
            ((_marks & topRow) == topRow) ||
            ((_marks & midRow) == midRow) ||
            ((_marks & botRow) == botRow) ||
            ((_marks & lefCol) == lefCol) ||
            ((_marks & midCol) == midCol) ||
            ((_marks & rigCol) == rigCol) ||
            ((_marks & dhDiag) == dhDiag) ||
            ((_marks & uhDiag) == uhDiag) 
            );
    }

    function isDraw(uint16 _noughts, uint16 _crosses) public pure returns (bool) {
        if((_noughts ^ _crosses) == fullBd) { 
            return true; // using XOR. Note that a draw could include a winning position that is unnoticed / unclaimed
        }
    }

    function madeStrictlyOneMark(uint16 _new_marks, uint16 _old_marks) public pure returns (bool){
        uint16 i;
        bool already_marked = false;
        for (i = 0; i < 9; i++){
            if ((_new_marks >> i)%2 == 0 && (_old_marks >> i)%2 == 1){
                return false; // erased a mark
            } 
            else if ((_new_marks >> i)%2 == 1 && (_old_marks >> i)%2 == 0){
                if (already_marked == true){
                    return false; // made two or more marks
                }
                already_marked = true; // made at least one mark
            }
        }
        if (_new_marks == _old_marks) {return false;} // do not allow a non-move
        return true;
    }

    function areDisjoint(uint16 _noughts, uint16 _crosses) public pure returns (bool) {
        if((_noughts & _crosses) == 0){
            return true;
        }
    }

    function popCount(uint16 _marks) public pure returns (uint8) {
        uint16 i;
        uint8  count;
        for (i = 0; i < 9; i++){
            if ((_marks >> i)%2 == 1 ){
                count++; // erased a mark
            } 
        }
        return count;
    }
}

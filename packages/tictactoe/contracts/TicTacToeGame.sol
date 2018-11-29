pragma solidity ^0.4.18;

import "fmg-core/contracts/State.sol";
import "./TicTacToeState.sol";

contract TicTacToeGame {
    using TicTacToeState for bytes;

    // The following transitions are allowed:
    //
    // Rest    -> Xplaying
    // Rest    -> Conclude but Conclude is an FMG position -- does it belong here?
    //
    // Xplaying -> Oplaying
    // Xplaying -> Victory
    // cannot get to draw (X is always completing the board because X goes first) remember we are transitioning *from& Xplay, so noughts are making the new marks
    // Xplaying -> Resting ("noughts" player rejects game)
    //
    // Oplaying -> Xplaying
    // Oplaying -> Victory
    // Oplaying -> Draw

    //
    // Victory -> Rest
    // Victory -> Xplaying
    //
    // Draw    -> Rest
    // Draw    -> Xplaying
    //

    function validTransition(bytes _old, bytes _new) public pure returns (bool) {

        if (_old.positionType() == TicTacToeState.PositionType.Rest) {
            if (_new.positionType() == TicTacToeState.PositionType.Xplaying) {

                validateRestToXplaying(_old, _new);

                return true;

            } 
        } else if (_old.positionType() == TicTacToeState.PositionType.Xplaying) {

            if (_new.positionType() == TicTacToeState.PositionType.Oplaying) {

                validateXplayingToOplaying(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Victory) {

                validateXplayingToVictory(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Rest) {

                validateXplayingToRest(_old, _new);

                return true;
              }
        } else if (_old.positionType() == TicTacToeState.PositionType.Oplaying) {

            if (_new.positionType() == TicTacToeState.PositionType.Xplaying) {

                validateOplayingToXplaying(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Victory) {

                validateOplayingToVictory(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Draw) {

                validateOplayingToDraw(_old, _new);

                return true;
            
            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Victory) {

            if (_new.positionType() == TicTacToeState.PositionType.Rest) {

                validateVictoryToRest(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Xplaying) {

                validateVictoryToXplaying(_old, _new);

                return true;

            }
        } else if (_old.positionType() == TicTacToeState.PositionType.Draw) {

            if (_new.positionType() == TicTacToeState.PositionType.Rest) {

                validateDrawToRest(_old, _new);

                return true;

            } else if (_new.positionType() == TicTacToeState.PositionType.Xplaying) {

                validateDrawToXplaying(_old, _new);

                return true;

            }
        } 
        revert();
        // return false;
    }

    // transition validations

    function validateRestToXplaying(bytes _old, bytes _new) private pure {
        // require(_new.noughts() == 0, " Noughts is not empty "); // error messages are not yet fully supported
        require(_new.noughts() == 0);
        // require(madeStrictlyOneMark(_new.crosses(),0), "Invalid starting position"); // Xs moves first
        require(madeStrictlyOneMark(_new.crosses(),0)); // Xs moves first
        // require(_new.stake() == _old.stake(), " Stake was changed ");
        require(_new.stake() == _old.stake());
        // if (State.indexOfMover(_new) == 0) { // mover is A
        //     require(_new.aResolution() == _old.aResolution() + _new.stake(), " Incorrect resolution ");
        //     require(_new.bResolution() == _old.bResolution() - _new.stake(), " Incorrect resolution ");
        // } else if (State.indexOfMover(_new) == 1) { // mover is B
        //     require(_new.aResolution() == _old.aResolution() - _new.stake(), " Incorrect resolution ");
        //     require(_new.bResolution() == _old.bResolution() + _new.stake(), " Incorrect resolution ");
        // }
        if (State.indexOfMover(_new) == 0) { // mover is A
            require(_new.aResolution() == _old.aResolution() + _new.stake());
            require(_new.bResolution() == _old.bResolution() - _new.stake());
        } else if (State.indexOfMover(_new) == 1) { // mover is B
            require(_new.aResolution() == _old.aResolution() - _new.stake());
            require(_new.bResolution() == _old.bResolution() + _new.stake());
        }
    }

    function validateRestToConcluded(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
    }

    function validateXplayingToOplaying(bytes _old, bytes _new) private pure {
        require(_new.stake() == _old.stake());
        require(madeStrictlyOneMark(_new.noughts(), _old.noughts()));
        require((_new.crosses() == _old.crosses()));   
        if (State.indexOfMover(_new) == 0) { // mover is A
            require(_new.aResolution() == _old.aResolution() + 2 *_new.stake()); 
            require(_new.bResolution() == _old.bResolution() - 2 *_new.stake());
        } else if (State.indexOfMover(_new) == 1) { // mover is B
            require(_new.aResolution() == _old.aResolution() - 2 *_new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 *_new.stake());
            // note factor of 2 to swing fully to other player
        } 

    }
    
    function validateXplayingToVictory(bytes _old, bytes _new) private pure {
        require(hasWon(_new.noughts));
        require(madeStrictlyOneMark(_new.noughts(), _old.noughts()));
        require((_new.crosses() == _old.crosses()));   
        if (State.indexOfMover(_new) == 0) { // mover is A
            require(_new.aResolution() == _old.aResolution() + 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() - 2 * _new.stake());
        } else if (State.indexOfMover(_new) ==1) { // mover is B
            require(_new.aResolution() == _old.aResolution() - 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 * _new.stake());
        } // mover gets to claim stakes
    }

    function validateXplayingToRest(bytes _old, bytes _new) private pure {
        require(_old.noughts() == 0); // don't allow this transition unless noughts has yet to make any marks
        if (State.indexOfMover(_new) == 0) { // Mover is A
            // revert balances
            require(_new.aResolution() == _old.aResolution() + _old.stake());
            require(_new.bResolution() == _old.bResolution() - _old.stake());
        } else if (State.indexOfMover(_new) == 1) { // Mover is B
            // revert balances
            require(_new.aResolution() == _old.aResolution() - _old.stake());
            require(_new.bResolution() == _old.bResolution() + _old.stake());
        } 
    }

    function validateOplayingToXplaying(bytes _old, bytes _new) private pure {
        require(madeStrictlyOneMark(_new.crosses(), _old.crosses()));
        require((_new.noughts() == _old.noughts()));
        if (State.indexOfMover(_new) == 0) { // mover is A
            require(_new.aResolution() == _old.aResolution() + 2 *_new.stake()); // note extra factor of 2 to swing fully to other player
            require(_new.bResolution() == _old.bResolution() - 2 *_new.stake());
        } else if (State.indexOfMover(_new) == 1) { // mover is B
            require(_new.aResolution() == _old.aResolution() - 2 *_new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 *_new.stake());
        } // mover gets to claim stakes: note factor of 2 to swing fully to other player

    }

    function validateOplayingToVictory(bytes _old, bytes _new) private pure {
        require(hasWon(_new.crosses));
        require(madeStrictlyOneMark(_new.crosses(), _old.crosses()));
        require((_new.noughts() == _old.noughts()));   
        if (State.indexOfMover(_new) == 0) { // mover is A
            require(_new.aResolution() == _old.aResolution() + 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() - 2 * _new.stake());
        } else if (State.indexOfMover(_new) ==1) { // mover is B
            require(_new.aResolution() == _old.aResolution() - 2 *  _new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 *  _new.stake());
        } // mover gets to claim stakes: note factor of 2 to swing fully to other player
    }

    function validateOplayingToDraw(bytes _old, bytes _new) private pure {
        require(isDraw(_new.noughts(), _new.crosses())); // check if board full. 
        // crosses always plays first move and always plays the move that completes the board
        if (State.indexOfMover(_new) == 0) {
            require(_new.aResolution() == _old.aResolution() + 2 * _new.stake()); // no extra factor of 2, restoring to parity
            require(_new.bResolution() == _old.bResolution() - 2 * _new.stake());
        } else if (State.indexOfMover(_new) ==1) {
            require(_new.aResolution() == _old.aResolution() - 2 * _new.stake());
            require(_new.bResolution() == _old.bResolution() + 2 * _new.stake());
        } // mover gets to restore parity to the winnings
        require(madeStrictlyOneMark(_new.crosses(), _old.crosses()));
        require((_new.noughts() == _old.noughts()));
    }

    function validateVictoryToRest(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
    }

    function validateDrawToRest(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
    }

    function validateVictoryToXplaying(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
        require(_new.noughts() == 0);
        require(madeStrictlyOneMark(_new.crosses(),0)); // crosses always goes first. there is no _old.crosses, so set to zero here
    }

    function validateDrawToXplaying(bytes _old, bytes _new) private pure {
        require(_new.aResolution() == _old.aResolution());
        require(_new.bResolution() == _old.bResolution());
        require(_new.noughts() == 0);
        require(madeStrictlyOneMark(_new.crosses(),0)); // crosses always goes first. there is no _old.crosses, so set to zero here
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
        else return false;
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
        else return false;
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

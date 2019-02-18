pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
import "fmg-core/contracts/State.sol";


contract TestGame {
    function validTransition(State.StateStruct memory _old, State.StateStruct memory _new) public pure returns (bool) {
       return true;
    }
}
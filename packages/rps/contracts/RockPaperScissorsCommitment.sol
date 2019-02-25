pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "fmg-core/contracts/Commitment.sol";

library RockPaperScissorsCommitment {
    using Commitment for Commitment.CommitmentStruct;
    enum PositionType { Start, RoundProposed, RoundAccepted, Reveal, Concluded }
    enum Play { Rock, Paper, Scissors }

    struct AppAttributes {
        PositionType positionType;
        uint256 stake;
        bytes32 preCommit;
        Play bPlay;
        Play aPlay;
        bytes32 salt;
        uint32 roundNum;
    }

    struct RPSCommitmentStruct {
        PositionType positionType;
        uint256 stake;
        bytes32 preCommit;
        Play bPlay;
        Play aPlay;
        bytes32 salt;
        uint32 roundNum;
        uint256[] allocation;
    }

    function fromFrameworkCommitment(Commitment.CommitmentStruct memory frameworkCommitment) public pure returns (RPSCommitmentStruct memory) {
        AppAttributes memory appAttributes = abi.decode(frameworkCommitment.appAttributes, (AppAttributes));

        return RPSCommitmentStruct(
            appAttributes.positionType,
            appAttributes.stake,
            appAttributes.preCommit,
            appAttributes.bPlay,
            appAttributes.aPlay,
            appAttributes.salt,
            appAttributes.roundNum,
            frameworkCommitment.allocation
        );
    }
}

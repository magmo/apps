pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;
import "fmg-core/contracts/Commitment.sol";
import "fmg-core/contracts/Rules.sol";

contract NitroAdjudicator {
    using Commitment for Commitment.CommitmentStruct;

    struct Authorization {
        // Prevents replay attacks:
        // It's required that the participant signs the message, meaning only
        // the participant can authorize a withdrawal.
        // Moreover, the participant should sign the address that they wish
        // to send the transaction from, preventing any replay attack.
        address participant; // the account used to sign commitment transitions
        address destination; // either an account or a channel
        uint amount;
        address sender; // the account used to sign transactions
    }

    struct Outcome {
        address[] destination;
        uint256 finalizedAt;
        Commitment.CommitmentStruct challengeCommitment;

        // exactly one of the following two should be non-null
        // guarantee channels
        address guaranteedChannel; // should be zero address in allocation channels
        uint[] allocation;         // should be zero length in guarantee channels
    }

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    struct ConclusionProof {
        Commitment.CommitmentStruct penultimateCommitment;
        Signature penultimateSignature;
        Commitment.CommitmentStruct ultimateCommitment;
        Signature ultimateSignature;
    }

    mapping(address => uint) public holdings;
    mapping(address => Outcome) public outcomes;
    address private constant zeroAddress = address(0);

    // TODO: Challenge duration should depend on the channel
    uint constant CHALLENGE_DURATION = 5 minutes;

    // **************
    // Eth Management
    // **************

    function deposit(address destination) public payable {
        holdings[destination] = holdings[destination] + msg.value;
    }

    function withdraw(address participant, address payable destination, uint amount, uint8 _v, bytes32 _r, bytes32 _s) public payable {
        require(
            holdings[participant] >= amount,
            "Withdraw: overdrawn"
        );
        Authorization memory authorization = Authorization(
            participant,
            destination,
            amount,
            msg.sender
        );

        require(
            recoverSigner(abi.encode(authorization), _v, _r, _s) == participant,
            "Withdraw: not authorized by participant"
        );

        holdings[participant] = holdings[participant] - amount;
        destination.transfer(amount);
    }

    function transfer(address channel, address destination, uint amount) public {
        require(
            outcomes[channel].finalizedAt < now,
            "Transfer: outcome must be final"
        );
        require(
            outcomes[channel].finalizedAt > 0,
            "Transfer: outcome must be present"
        );

        uint owedToDestination = overlap(destination, outcomes[channel], amount);

        require(
            owedToDestination <= holdings[channel],
            "Transfer: holdings[channel] must cover transfer"
        );
        require(
            owedToDestination >= amount,
            "Transfer: transfer too large"
        );

        holdings[destination] = holdings[destination] + owedToDestination;
        holdings[channel] = holdings[channel] - owedToDestination;

        outcomes[channel] = remove(outcomes[channel], destination, amount);
    }

    function claim(address guarantor, address recipient, uint amount) public {
        Outcome memory guarantee = outcomes[guarantor];
        require(
            guarantee.guaranteedChannel != zeroAddress,
            "Claim: a guarantee channel is required"
        );
        require(
            isChannelClosed(guarantor),
            "Claim: channel must be closed"
        );

        uint funding = holdings[guarantor];
        Outcome memory reprioritizedOutcome = reprioritize(outcomes[guarantee.guaranteedChannel], guarantee);
        if (overlap(recipient, reprioritizedOutcome, funding) >= amount) {
            outcomes[guarantee.guaranteedChannel] = remove(outcomes[guarantee.guaranteedChannel], recipient, amount);
            holdings[guarantor] -= amount;
            holdings[recipient] += amount;
        } else {
            revert('Claim: guarantor must be sufficiently funded');
        }
    }

    // ********************
    // Eth Management Logic
    // ********************

    function reprioritize(Outcome memory allocation, Outcome memory guarantee) internal pure returns (Outcome memory) {
        require(
            guarantee.guaranteedChannel != address(0),
            "Claim: a guarantee channel is required"
        );
        address[] memory newDestination = new address[](guarantee.destination.length);
        uint[] memory newAllocation = new uint[](guarantee.destination.length);
        for (uint aIdx = 0; aIdx < allocation.destination.length; aIdx++) {
            for (uint gIdx = 0; gIdx < guarantee.destination.length; gIdx++) {
                if (guarantee.destination[gIdx] == allocation.destination[aIdx]) {
                    newDestination[gIdx] = allocation.destination[aIdx];
                    newAllocation[gIdx] = allocation.allocation[aIdx];
                    break;
                }
            }
        }

        return Outcome(
            newDestination,
            allocation.finalizedAt,
            allocation.challengeCommitment,
            zeroAddress,
            newAllocation
        );
    }

    function overlap(address recipient, Outcome memory outcome, uint funding) internal pure returns (uint256) {
        uint result = 0;

        for (uint i = 0; i < outcome.destination.length; i++) {
            if (funding <= 0) {
                break;
            }

            if (outcome.destination[i] == recipient) {
                // It is technically allowed for a recipient to be listed in the
                // outcome multiple times, so we must iterate through the entire
                // array.
                result += min(outcome.allocation[i], funding);
            }

            funding -= outcome.allocation[i];
        }

        return result;
    }

    function remove(Outcome memory outcome, address recipient, uint amount) internal pure returns (Outcome memory) { 
        uint256[] memory updatedAllocation = outcome.allocation;
        uint256 reduction = 0;
        for (uint i = 0; i < outcome.destination.length; i++) {
            if (outcome.destination[i] == recipient) {
                // It is technically allowed for a recipient to be listed in the
                // outcome multiple times, so we must iterate through the entire
                // array.
                reduction += min(outcome.allocation[i], amount);
                amount = amount - reduction;
                updatedAllocation[i] = updatedAllocation[i] - reduction;
            }
        }

        return Outcome(
            outcome.destination,
            outcome.finalizedAt,
            outcome.challengeCommitment, // Once the outcome is finalized, 
            zeroAddress,
            updatedAllocation
        );
    }

    // ****************
    // ForceMove Events
    // ****************

    event ChallengeCreated(
        address channelId,
        Commitment.CommitmentStruct commitment,
        uint256 finalizedAt
    );
    event Concluded(address channelId);
    event Refuted(address channelId, Commitment.CommitmentStruct refutation);
    event RespondedWithMove(address channelId, Commitment.CommitmentStruct response);
    event RespondedWithAlternativeMove(Commitment.CommitmentStruct alternativeResponse);

    // **********************
    // ForceMove Protocol API
    // **********************

    function conclude(ConclusionProof memory proof) public {
        _conclude(proof);
    }

    function forceMove(
        Commitment.CommitmentStruct memory agreedCommitment,
        Commitment.CommitmentStruct memory challengeCommitment,
        address guaranteedChannel,
        Signature[] memory signatures
    ) public {
        require(
            !isChannelClosed(agreedCommitment.channelId()),
            "ForceMove: channel must be open"
        );
        require(
            moveAuthorized(agreedCommitment, signatures[0]),
            "ForceMove: agreedCommitment not authorized"
        );
        require(
            moveAuthorized(challengeCommitment, signatures[1]),
            "ForceMove: challengeCommitment not authorized"
        );
        require(
            Rules.validTransition(agreedCommitment, challengeCommitment)
        );
        if (guaranteedChannel == zeroAddress) {
            // If the guaranteeChannel is the zeroAddress, this outcome
            // is an allocation
            require(
                agreedCommitment.allocation.length > 0,
                "ForceMove: allocation outcome must have resolution"
            );
        } else {
            // The non-zeroness of guaranteeChannel indicates that this outcome
            // is a guarantee
            require(
                challengeCommitment.allocation.length == 0,
                "ForceMove: guarantee outcome cannot have allocation"
            );
        }

        address channelId = agreedCommitment.channelId();

        outcomes[channelId] = Outcome(
            challengeCommitment.participants,
            now + CHALLENGE_DURATION,
            challengeCommitment,
            guaranteedChannel,
            challengeCommitment.allocation
        );

        emit ChallengeCreated(
            channelId,
            challengeCommitment,
            now
        );
    }

    uint t = block.timestamp;

    function refute(Commitment.CommitmentStruct memory refutationCommitment, Signature memory signature) public {
        address channel = refutationCommitment.channelId();
        require(
            !isChannelClosed(channel),
            "Refute: channel must be open"
        );

        require(
            moveAuthorized(refutationCommitment, signature),
            "Refute: move must be authorized"
        );

        require(
            Rules.validRefute(outcomes[channel].challengeCommitment, refutationCommitment, signature.v, signature.r, signature.s),
            "Refute: must be a valid refute"
        );

        emit Refuted(channel, refutationCommitment);
        Outcome memory updatedOutcome = Outcome(
            outcomes[channel].destination,
            0,
            refutationCommitment,
            outcomes[channel].guaranteedChannel,
            refutationCommitment.allocation
        );
        outcomes[channel] = updatedOutcome;
    }

    function respondWithMove(Commitment.CommitmentStruct memory responseCommitment, Signature memory signature) public {
        address channel = responseCommitment.channelId();
        require(
            !isChannelClosed(channel),
            "RespondWithMove: channel must be open"
        );

        require(
            moveAuthorized(responseCommitment, signature),
            "RespondWithMove: move must be authorized"
        );

        require(
            Rules.validRespondWithMove(outcomes[channel].challengeCommitment, responseCommitment, signature.v, signature.r, signature.s),
            "RespondWithMove: must be a valid response"
        );

        emit RespondedWithMove(channel, responseCommitment);

        Outcome memory updatedOutcome = Outcome(
            outcomes[channel].destination,
            0,
            responseCommitment,
            outcomes[channel].guaranteedChannel,
            responseCommitment.allocation
        );
        outcomes[channel] = updatedOutcome;
    }

    function alternativeRespondWithMove(
        Commitment.CommitmentStruct memory _alternativeCommitment,
        Commitment.CommitmentStruct memory _responseCommitment,
        Signature memory _alternativeSignature,
        Signature memory _responseSignature
    )
      public
    {
        address channel = _responseCommitment.channelId();
        require(
            !isChannelClosed(channel),
            "AlternativeRespondWithMove: channel must be open"
        );

        require(
            moveAuthorized(_responseCommitment, _responseSignature),
            "AlternativeRespondWithMove: move must be authorized"
        );

        uint8[] memory v = new uint8[](2);
        v[0] = _alternativeSignature.v;
        v[1] = _responseSignature.v;

        bytes32[] memory r = new bytes32[](2);
        r[0] = _alternativeSignature.r;
        r[1] = _responseSignature.r;

        bytes32[] memory s = new bytes32[](2);
        s[0] = _alternativeSignature.s;
        s[1] = _responseSignature.s;


        require(
            Rules.validAlternativeRespondWithMove(
                outcomes[channel].challengeCommitment,
                _alternativeCommitment,
                _responseCommitment,
                v,
                r,
                s
            ),
            "RespondWithMove: must be a valid response"
        );

        emit RespondedWithAlternativeMove(_responseCommitment);

        Outcome memory updatedOutcome = Outcome(
            outcomes[channel].destination,
            0,
            _responseCommitment,
            outcomes[channel].guaranteedChannel,
            _responseCommitment.allocation
        );
        outcomes[channel] = updatedOutcome;
    }

    // ************************
    // ForceMove Protocol Logic
    // ************************

    function _conclude(ConclusionProof memory proof) internal {
        address channelId = proof.penultimateCommitment.channelId();
        require(
            (outcomes[channelId].finalizedAt > now || outcomes[channelId].finalizedAt == 0),
            "Conclude: channel must not be finalized"
        );

        outcomes[channelId] = Outcome(
            proof.penultimateCommitment.participants,
            now,
            proof.penultimateCommitment,
            outcomes[channelId].guaranteedChannel,
            proof.penultimateCommitment.allocation
        );
        emit Concluded(channelId);
    }

    // ****************
    // Helper functions
    // ****************

    function isChannelClosed(address channel) internal view returns (bool) {
        return outcomes[channel].finalizedAt < now && outcomes[channel].finalizedAt > 0;
    }

    function moveAuthorized(Commitment.CommitmentStruct memory _commitment, Signature memory signature) internal pure returns (bool){
        return _commitment.mover() == recoverSigner(
            abi.encode(_commitment),
            signature.v,
            signature.r,
            signature.s
        );
    }

    function recoverSigner(bytes memory _d, uint8 _v, bytes32 _r, bytes32 _s) internal pure returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 h = keccak256(_d);

        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, h));

        address a = ecrecover(prefixedHash, _v, _r, _s);

        return(a);
    }

    function min(uint a, uint b) internal pure returns (uint) {
        if (a <= b) {
            return a;
        }

        return b;
    }
}
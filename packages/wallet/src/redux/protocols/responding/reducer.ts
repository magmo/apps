import { Commitment } from 'fmg-core/lib/commitment';
import { SharedData, ProtocolStateWithSharedData } from '..';
import * as states from './state';
import * as actions from './actions';
import { unreachable } from '../../../utils/reducer-utils';

export const initialize = (
  processId: string,
  sharedData: SharedData,
  challengeCommitment: Commitment,
): ProtocolStateWithSharedData<states.RespondingState> => {
  return {
    protocolState: states.waitForApproval({ processId, challengeCommitment }),
    sharedData,
  };
};

export const respondingReducer = (
  protocolState: states.RespondingState,
  sharedData: SharedData,
  action: actions.RespondingAction,
): ProtocolStateWithSharedData<states.RespondingState> => {
  switch (protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
    case states.WAIT_FOR_ACKNOWLEDGEMENT:
    case states.WAIT_FOR_RESPONSE:
    case states.WAIT_FOR_TRANSACTION:
    case states.SUCCESS:
    case states.FAILURE:
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

// const waitForApprovalReducer = (
//   protocolState: states.WaitForApproval,
//   sharedData: SharedData,
//   action: actions.RespondingAction,
// ): ProtocolStateWithSharedData<states.RespondingState> => {
//   switch (action.type) {
//     case actions.RESPOND_APPROVED:
//     if (canRespondWithExistingMove(challenge))
//     case actions.RESPOND_REJECTED:
//       return {
//         protocolState: states.failure(states.FailureReason.UserRejected),
//         sharedData,
//       };
//     default:
//       return { protocolState, sharedData };
//   }
// };

// const canRespondWithExistingMove = (
//   challengeCommitment: Commitment,
//   sharedData: SharedData,
// ): boolean => {
//   const channelId = channelID(challengeCommitment.channel);
//   const channelState = selectors.getOpenedChannelState(sharedData, channelId);
//   const lastCommitment = channelState.lastCommitment.commitment;
//   const penultimateCommitment = channelState.penultimateCommitment.commitment;
//   return (
//     penultimateCommitment === challengeCommitment &&
//     ourCommitment(lastCommitment, channelState.ourIndex)
//   );
// };

// const canRefute = (challengeCommitment: Commitment, sharedData: SharedData) => {
//   const channelId = channelID(challengeCommitment.channel);
//   const channelState = selectors.getOpenedChannelState(sharedData, channelId);
//   const lastCommitment = channelState.lastCommitment.commitment;
//   return (
//     lastCommitment.turnNum > challengeCommitment.turnNum &&
//     !ourCommitment(lastCommitment, channelState.ourIndex)
//   );
// };
// const ourCommitment = (commitment: Commitment, ourIndex: PlayerIndex) => {
//   return commitment.turnNum % 2 !== ourIndex;
// };

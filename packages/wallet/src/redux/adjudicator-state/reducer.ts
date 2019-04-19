import {
  AdjudicatorState,
  clearChallenge,
  markAsFinalized,
  addToBalance,
  getAdjudicatorChannelState,
  setChallenge,
} from './state';
import * as actions from '../actions';
import { unreachable } from '../../utils/reducer-utils';

export const adjudicatorStateReducer = (
  state: AdjudicatorState,
  action: actions.BlockMined | actions.AdjudicatorEventAction,
) => {
  switch (action.type) {
    case actions.BLOCK_MINED:
      return blockMinedReducer(state, action);
    case actions.FUNDING_RECEIVED_EVENT:
      return fundingReceivedEventReducer(state, action);
    case actions.CONCLUDED_EVENT:
      return concludedEventReducer(state, action);
    case actions.REFUTED_EVENT:
    case actions.RESPOND_WITH_MOVE_EVENT:
      return challengeRespondedReducer(state, action);
    case actions.CHALLENGE_CREATED_EVENT:
      return challengeCreatedEventReducer(state, action);
    default:
      return unreachable(action);
  }
};

const challengeCreatedEventReducer = (
  state: AdjudicatorState,
  action: actions.ChallengeCreatedEvent,
) => {
  const challenge = { expiresAt: action.finalizedAt, challengeCommitment: action.commitment };
  return setChallenge(state, action.channelId, challenge);
};

const challengeRespondedReducer = (
  state: AdjudicatorState,
  action: actions.RefutedEvent | actions.RespondWithMoveEvent,
) => {
  const { channelId } = action;
  return clearChallenge(state, channelId);
};

const concludedEventReducer = (state: AdjudicatorState, action: actions.ConcludedEvent) => {
  const { channelId } = action;
  return markAsFinalized(state, channelId);
};
const fundingReceivedEventReducer = (
  state: AdjudicatorState,
  action: actions.FundingReceivedEvent,
) => {
  const { channelId } = action;
  addToBalance(state, channelId, action.amount);
};

const blockMinedReducer = (state: AdjudicatorState, action: actions.BlockMined) => {
  let newState = { ...state };
  // Update all challenges that are expired
  for (const channelId of Object.keys(state)) {
    if (challengeIsExpired(state, channelId, action.block.timestamp)) {
      newState = clearChallenge(newState, channelId);
    }
  }
  return newState;
};

const challengeIsExpired = (state: AdjudicatorState, channelId: string, blockTimestamp: number) => {
  const channelState = getAdjudicatorChannelState(state, channelId);
  if (!channelState) {
    return false;
  }
  return channelState.challenge && channelState.challenge.expiresAt < blockTimestamp;
};

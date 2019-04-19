import { AdjudicatorState, AdjudicatorChannelState } from './state';
import * as actions from '../actions';
import { unreachable } from '../../utils/reducer-utils';
import { bigNumberify } from 'ethers/utils';

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
  const { channelId } = action;
  const channelAdjudicatorState = state[channelId];
  const challenge = { challengeCommitment: action.commitment, expiresAt: action.finalizedAt };
  return { ...state, [channelId]: { ...channelAdjudicatorState, challenge } };
};

const challengeRespondedReducer = (
  state: AdjudicatorState,
  action: actions.RefutedEvent | actions.RespondWithMoveEvent,
) => {
  const { channelId } = action;
  const channelAdjudicatorState = state[channelId];
  return { ...state, [channelId]: { ...channelAdjudicatorState, challenge: undefined } };
};

const concludedEventReducer = (state: AdjudicatorState, action: actions.ConcludedEvent) => {
  const { channelId } = action;
  const channelAdjudicatorState = state[channelId];
  return { ...state, [channelId]: { ...channelAdjudicatorState, concluded: true } };
};
const fundingReceivedEventReducer = (
  state: AdjudicatorState,
  action: actions.FundingReceivedEvent,
) => {
  const { channelId } = action;
  const channelAdjudicatorState = state[channelId];
  const newBalance = bigNumberify(channelAdjudicatorState.balance).add(action.amount);
  const newChannelAdjudicatorState = { ...channelAdjudicatorState, balance: newBalance };
  return { ...state, [channelId]: newChannelAdjudicatorState };
};

const blockMinedReducer = (state: AdjudicatorState, action: actions.BlockMined) => {
  let newState = { ...state };
  // Update all challenges that are expired
  for (const channelId of Object.keys(state)) {
    const channelAdjudicatorState = newState[channelId];
    if (challengeIsExpired(channelAdjudicatorState, action.block.timestamp)) {
      newState = { ...newState, [channelId]: { ...channelAdjudicatorState, challenge: undefined } };
    }
  }
  return newState;
};

const challengeIsExpired = (
  adjudicatorChannelState: AdjudicatorChannelState,
  blockTimestamp: number,
) => {
  return (
    adjudicatorChannelState.challenge &&
    adjudicatorChannelState.challenge.expiresAt < blockTimestamp
  );
};

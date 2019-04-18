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
      return fundingReceivedEvent(state, action);
    case actions.REFUTED_EVENT:
    case actions.RESPOND_WITH_MOVE_EVENT:
    case actions.CHALLENGE_CREATED_EVENT:

    case actions.CONCLUDED_EVENT:
      return state;
    default:
      return unreachable(action);
  }
};

const fundingReceivedEvent = (state: AdjudicatorState, action: actions.FundingReceivedEvent) => {
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
      newState = { ...newState, [channelId]: moveChallengeToOutcome(channelAdjudicatorState) };
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

const moveChallengeToOutcome = (
  adjudicatorChannelState: AdjudicatorChannelState,
): AdjudicatorChannelState => {
  if (!adjudicatorChannelState.challenge) {
    return adjudicatorChannelState;
  }
  const newOutcome = { ...adjudicatorChannelState.challenge };

  const newChannelAdjudicatorChannelState = {
    ...adjudicatorChannelState,
    outcome: newOutcome,
    challenge: undefined,
  };
  return newChannelAdjudicatorChannelState;
};

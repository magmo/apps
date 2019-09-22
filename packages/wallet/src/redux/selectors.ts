import { ChannelState } from './channel-store';
import * as walletStates from './state';
import { SharedData, FundingState } from './state';
import { ProcessProtocol } from '../communication';
import { CONSENSUS_LIBRARY_ADDRESS } from '../constants';
import { SignedState } from 'nitro-protocol';
import { getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { bigNumberify } from 'ethers/utils';

export const getOpenedChannelState = (state: SharedData, channelId: string): ChannelState => {
  const channelStatus = getChannelState(state, channelId);
  if (!isFullyOpen(channelStatus)) {
    throw new Error(`Channel ${channelId} is still in the process of being opened.`);
  }
  return channelStatus;
};
function isFullyOpen(channelState: ChannelState): boolean {
  return channelState.turnNumRecord >= channelState.channel.participants.length;
}

export const doesAStateExistForChannel = (state: SharedData, channelId: string): boolean => {
  return (
    state.channelStore[channelId] !== undefined &&
    state.channelStore[channelId].signedStates.length > 0
  );
};

export const getChannelState = (state: SharedData, channelId: string): ChannelState => {
  const channelStatus = state.channelStore[channelId];
  if (!channelStatus) {
    throw new Error(`Could not find any initialized channel state for channel ${channelId}.`);
  }
  return channelStatus;
};

export const getLastState = (state: ChannelState) => {
  return state.signedStates[state.signedStates.length - 1];
};
export const getLastStateForChannel = (state: SharedData, channelId: string): SignedState => {
  const channelState = getChannelState(state, channelId);
  return getLastState(channelState);
};

export const getFundedLedgerChannelForParticipants = (
  state: SharedData,
  playerA: string,
  playerB: string,
): ChannelState | undefined => {
  // Finds a directly funded, two-party channel between players A and B
  return Object.values(state.channelStore).find(channelState => {
    const channelId = getChannelId(channelState.channel);
    const fundingState = getChannelFundingState(state, channelId);
    const directlyFunded: boolean = fundingState ? fundingState.directlyFunded : false;

    const { appDefinition } = getLastState(channelState).state;
    return (
      appDefinition === CONSENSUS_LIBRARY_ADDRESS &&
      // We call concat() on participants in order to not sort it in place
      JSON.stringify(channelState.channel.participants.concat().sort()) ===
        JSON.stringify([playerA, playerB].sort()) &&
      directlyFunded
    );
  });
};
export const getAdjudicatorWatcherSubscribersForChannel = (
  state: walletStates.Initialized,
  channelId: string,
): walletStates.ChannelSubscriber[] => {
  if (state.channelSubscriptions[channelId]) {
    return state.channelSubscriptions[channelId];
  } else {
    return [];
  }
};

export const getAdjudicatorState = (state: SharedData) => {
  return state.adjudicatorState;
};

export const getAdjudicatorChannelState = (state: SharedData, channelId: string) => {
  return getAdjudicatorState(state)[channelId];
};

export const getAdjudicatorChannelBalance = (state: SharedData, channelId: string): string => {
  const adjudicatorChannelState = getAdjudicatorChannelState(state, channelId);
  if (!adjudicatorChannelState) {
    return '0x0';
  } else {
    return adjudicatorChannelState.balance;
  }
};

export const getFundingState = (state: SharedData): FundingState => {
  return state.fundingState;
};

export const getChannelFundingState = (
  state: SharedData,
  channelId: string,
): walletStates.ChannelFundingState | undefined => {
  return getFundingState(state)[channelId];
};

export const getProtocolForProcessId = (
  state: walletStates.Initialized,
  processId: string,
): ProcessProtocol => {
  if (state.processStore[processId]) {
    throw new Error(`No process state for process Id`);
  } else {
    return state.processStore[processId].protocol;
  }
};

export const getProtocolState = (state: walletStates.Initialized, processId: string) => {
  return state.processStore[processId].protocolState;
};

export const getNextNonce = (state: SharedData, libraryAddress: string): string => {
  let highestNonce = '0x0';
  for (const channelId of Object.keys(state.channelStore)) {
    const channelState = state.channelStore[channelId];
    const { channel } = channelState;
    const { appDefinition } = getLastState(channelState).state;
    if (appDefinition === libraryAddress && bigNumberify(channel.channelNonce).gt(highestNonce)) {
      highestNonce = channel.channelNonce;
    }
  }
  return bigNumberify(highestNonce)
    .add(1)
    .toHexString();
};

export const getChannelIds = (state: SharedData): string[] => {
  return Object.keys(state.channelStore);
};

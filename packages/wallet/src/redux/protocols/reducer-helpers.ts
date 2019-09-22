import { fundingSuccess } from 'magmo-wallet-client';
import { accumulateSideEffects } from '../outbox';
import { SharedData, queueMessage } from '../state';
import * as selectors from '../selectors';
import { TwoPartyPlayerIndex } from '../types';
import * as magmoWalletClient from 'magmo-wallet-client';

import { ProtocolLocator } from '../../communication';
import * as comms from '../../communication';

import _ from 'lodash';
import { bigNumberify } from 'ethers/utils';
import { SignedState } from 'nitro-protocol';
import { State } from 'nitro-protocol/lib/src/contract/state';
import {
  isAllocationOutcome,
  Outcome,
  Allocation,
  AllocationItem,
} from 'nitro-protocol/lib/src/contract/outcome';
import { ETH_ASSET_HOLDER } from '../../constants';

export function sendFundingComplete(sharedData: SharedData, appChannelId: string) {
  const channelState = selectors.getOpenedChannelState(sharedData, appChannelId);
  const s = selectors.getLastState(channelState);
  if (s.state.turnNum !== 3) {
    throw new Error(
      `Expected a post fund setup B commitment. Instead received ${JSON.stringify(s)}.`,
    );
  }
  return queueMessage(sharedData, fundingSuccess(appChannelId, s));
}

export function showWallet(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    displayOutbox: magmoWalletClient.showWallet(),
  });
  return newSharedData;
}

export function hideWallet(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    displayOutbox: magmoWalletClient.hideWallet(),
  });
  return newSharedData;
}

export function sendConcludeSuccess(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.concludeSuccess(),
    // TODO could rename this helper function, as it covers both ways of finalizing a channel
  });
  return newSharedData;
}

export function sendConcludeInstigated(sharedData: SharedData, channelId: string): SharedData {
  const lastState = selectors.getLastStateForChannel(sharedData, channelId);
  const messageRelay = comms.sendConcludeInstigated(nextParticipant(lastState.state), channelId);
  return queueMessage(sharedData, messageRelay);
}

export function sendOpponentConcluded(sharedData: SharedData): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.opponentConcluded(),
    // TODO could rename this helper function, as it covers both ways of finalizing a channel
  });
  return newSharedData;
}

export function sendStates(
  sharedData: SharedData,
  processId: string,
  channelId: string,
  protocolLocator: ProtocolLocator,
): SharedData {
  const lastState = selectors.getLastStateForChannel(sharedData, channelId);
  const messageRelay = comms.sendStatesReceived(
    nextParticipant(lastState.state),
    processId,
    getLatestRoundOfStates(channelId, sharedData),
    protocolLocator,
  );
  return queueMessage(sharedData, messageRelay);
}

export function sendChallengeResponseRequested(
  sharedData: SharedData,
  channelId: string,
): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.challengeResponseRequested(channelId),
  });
  return newSharedData;
}

export function sendChallengeStateReceived(sharedData: SharedData, signedState: SignedState) {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.challengeStateReceived(signedState),
  });
  return newSharedData;
}

// TODO 'Complete' here means the challenge was successfully responded to
export function sendChallengeComplete(sharedData: SharedData) {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.challengeComplete(),
  });
  return newSharedData;
}

export function sendConcludeFailure(
  sharedData: SharedData,
  reason: 'Other' | 'UserDeclined',
): SharedData {
  const newSharedData = { ...sharedData };
  newSharedData.outboxState = accumulateSideEffects(newSharedData.outboxState, {
    messageOutbox: magmoWalletClient.concludeFailure(reason),
  });
  return newSharedData;
}

export const channelIsClosed = (channelId: string, sharedData: SharedData): boolean => {
  return (
    channelHasConclusionProof(channelId, sharedData) ||
    channelFinalizedOnChain(channelId, sharedData)
  );
};

export const channelFundsAnotherChannel = (channelId: string, sharedData: SharedData): boolean => {
  const latestState = selectors.getLastStateForChannel(sharedData, channelId).state;
  const channelIds = selectors.getChannelIds(sharedData);

  const allocationDestinations = latestState.outcome
    .map(o => {
      if (isAllocationOutcome(o)) {
        return o.allocation.map(a => a.destination);
      } else {
        return [];
      }
    })
    .reduce((d1, d2) => d1.concat(d2), []);

  return _.intersection(allocationDestinations, channelIds).length > 0;
};
export const getLatestRoundOfStates = (
  channelId: string,
  sharedData: SharedData,
): SignedState[] => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);
  if (channelState.signedStates.length === 0) {
    return [];
  }

  const { signedStates } = channelState;
  const { participants } = signedStates[0].state.channel;

  const roundIndex =
    signedStates.length < participants.length ? 0 : signedStates.length - participants.length;
  return channelState.signedStates.slice(roundIndex);
};

export const channelHasConclusionProof = (channelId: string, sharedData: SharedData): boolean => {
  const latestStateRound = getLatestRoundOfStates(channelId, sharedData);
  return latestStateRound.every(s => s.state.isFinal);
};

export const channelFinalizedOnChain = (channelId: string, sharedData: SharedData): boolean => {
  const channelState = selectors.getAdjudicatorChannelState(sharedData, channelId);
  return channelState && channelState.finalized;
};

export enum FundingType {
  Virtual,
  Ledger,
  Direct,
}
export const getChannelFundingType = (channelId: string, sharedData: SharedData): FundingType => {
  const channelFundingState = selectors.getChannelFundingState(sharedData, channelId);
  if (!channelFundingState) {
    throw new Error(`No funding state for ${channelId}. Cannot determine funding type.`);
  }
  if (channelFundingState.directlyFunded) {
    return FundingType.Direct;
  }
  if (!channelFundingState.fundingChannel) {
    throw new Error(`Channel ${channelId} is not directly funded but has not fundingChannelId`);
  }
  const channelState = selectors.getChannelState(sharedData, channelFundingState.fundingChannel);
  return channelState.channel.participants.length === 3 ? FundingType.Virtual : FundingType.Ledger;
};

export const getTwoPlayerIndex = (
  channelId: string,
  sharedData: SharedData,
): TwoPartyPlayerIndex => {
  const { address } = sharedData;
  const channelState = selectors.getChannelState(sharedData, channelId);
  return channelState.channel.participants.indexOf(address);
};
export const isFirstPlayer = (channelId: string, sharedData: SharedData) => {
  const { address } = sharedData;
  const channelState = selectors.getChannelState(sharedData, channelId);
  return channelState.channel.participants.indexOf(address) === 0;
};

export const isLastPlayer = (channelId: string, sharedData: SharedData) => {
  const { address } = sharedData;
  const channelState = selectors.getChannelState(sharedData, channelId);
  const { participants } = channelState.channel;
  return participants.indexOf(address) === participants.length;
};

export const nextParticipant = (state: State): string => {
  const { participants } = state.channel;
  const nextIndex = (state.turnNum + 1) % participants.length;
  return participants[nextIndex];
};
export function isSafeToSend({
  sharedData,
  channelId,
  clearedToSend,
  participants,
}: {
  sharedData: SharedData;
  channelId?: string;
  clearedToSend: boolean;
  participants: string[];
}): boolean {
  if (!clearedToSend) {
    return false;
  }

  // The possibilities are:
  // A. The channel is not in storage and our index is 0.
  // B. The channel is not in storage and our index is not 0.
  // C. The channel is in storage and it's our turn
  // D. The channel is in storage and it's not our turn
  const { address: ourAddress } = sharedData;
  const ourIndex = participants.indexOf(ourAddress);
  if (!channelId) {
    return ourIndex === 0;
  }

  const channelState = selectors.getChannelState(sharedData, channelId);
  const { turnNumRecord } = channelState;
  const numParticipants = participants.length;
  return (turnNumRecord + 1) % numParticipants === ourIndex;
}

export function getOpponentAddress(channelId: string, sharedData: SharedData) {
  const channelState = selectors.getChannelState(sharedData, channelId);

  const { participants } = channelState.channel;
  const ourIndex = participants.indexOf(sharedData.address);
  const opponentAddress = participants[1 - ourIndex];
  return opponentAddress;
}

export function getNumberOfParticipants(signedState: SignedState): number {
  return signedState.state.channel.participants.length;
}
export function addToEthAllocation(allocationItem: AllocationItem, outcome: Outcome): Outcome {
  const newOutcome = _.cloneDeep(outcome);
  newOutcome.forEach(o => {
    if (isAllocationOutcome(o) && o.assetHolderAddress === ETH_ASSET_HOLDER) {
      o.allocation.push(allocationItem);
    }
  });
  return newOutcome;
}
export function getEthAllocation(outcome: Outcome): Allocation | undefined {
  let outcomeToReturn: Allocation | undefined;
  outcome.forEach(o => {
    if (isAllocationOutcome(o) && o.assetHolderAddress === ETH_ASSET_HOLDER) {
      outcomeToReturn = o.allocation;
    }
  });
  return outcomeToReturn;
}
export function isFullyOpen() {
  return true;
}
export function ourTurn(sharedData: SharedData, channelId: string) {
  const channelState = selectors.getChannelState(sharedData, channelId);
  const { participants } = channelState.channel;
  const turnIndex = (channelState.turnNumRecord + 1) % participants.length;
  return participants[turnIndex] === sharedData.address;
}

export function getFundingChannelId(channelId: string, sharedData: SharedData): string {
  const fundingState = selectors.getChannelFundingState(sharedData, channelId);
  if (!fundingState) {
    throw new Error(`No funding state found for ${channelId}`);
  }
  if (fundingState.directlyFunded) {
    return channelId;
  } else {
    const channelIdToCheck = !!fundingState.fundingChannel
      ? fundingState.fundingChannel
      : fundingState.guarantorChannel;
    if (!channelIdToCheck) {
      throw new Error(
        `Funding state for ${channelId} is not directly funded so it must have aq funding or guarantor channel`,
      );
    }

    return getFundingChannelId(channelIdToCheck, sharedData);
  }
}

export function removeZeroFundsFromBalance(
  incomingAllocation: string[],
  incomingDestination: string[],
): { allocation: string[]; destination: string[] } {
  const allocation: string[] = [];
  const destination: string[] = [];
  incomingAllocation.map((a, i) => {
    if (bigNumberify(a).gt(0)) {
      allocation.push(incomingAllocation[i]);
      destination.push(incomingDestination[i]);
    }
  });
  return { allocation, destination };
}

export const convertAddressToBytes32 = (address: string) => {
  const hexValue = bigNumberify(address).toHexString();
  return hexValue.padEnd(66, '0');
};

export const convertBytes32ToAddress = (bytes: string) => {
  const hexValue = bigNumberify(bytes).toHexString();
  return hexValue.slice(0, 42);
};

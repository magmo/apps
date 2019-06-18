import { SharedData, signAndStore, queueMessage, checkAndStore, getChannel } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData } from '..';
import { ExistingChannelFundingAction } from './actions';
import * as helpers from '../reducer-helpers';
import * as selectors from '../../selectors';
import { proposeNewConsensus, acceptConsensus } from '../../../domain/two-player-consensus-game';
import { theirAddress } from '../../channel-store';
import { Commitment, nextSetupCommitment } from '../../../domain';
import { bigNumberify } from 'ethers/utils';
import { sendCommitmentReceived } from '../../../communication';
import { CommitmentType } from 'fmg-core';
import { initialize as initializeLedgerTopUp, ledgerTopUpReducer } from '../ledger-top-up/reducer';
import { isLedgerTopUpAction } from '../ledger-top-up/actions';

export const initialize = (
  processId: string,
  channelId: string,
  ledgerId: string,
  proposedAmount: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.ExistingChannelFundingState> => {
  const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);
  const theirCommitment = ledgerChannel.lastCommitment.commitment;
  if (ledgerChannelNeedsTopUp(theirCommitment, proposedAmount)) {
    const { protocolState: ledgerTopUpState, sharedData: newSharedData } = initializeLedgerTopUp(
      processId,
      channelId,
      ledgerId,
      [proposedAmount, proposedAmount],
      theirCommitment.destination,
      sharedData,
    );
    return {
      protocolState: states.waitForLedgerTopUp({
        ledgerTopUpState,
        processId,
        channelId,
        ledgerId,
        proposedAmount,
      }),
      sharedData: newSharedData,
    };
  }

  if (helpers.isFirstPlayer(ledgerId, sharedData)) {
    const { proposedAllocation, proposedDestination } = craftNewAllocationAndDestination(
      theirCommitment,
      proposedAmount,
      channelId,
    );
    const ourCommitment = proposeNewConsensus(
      theirCommitment,
      proposedAllocation,
      proposedDestination,
    );
    const signResult = signAndStore(sharedData, ourCommitment);
    if (!signResult.isSuccess) {
      return {
        protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
        sharedData,
      };
    }
    sharedData = signResult.store;

    const messageRelay = sendCommitmentReceived(
      theirAddress(ledgerChannel),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
    );
    sharedData = queueMessage(sharedData, messageRelay);
  }

  const protocolState = states.waitForLedgerUpdate({
    processId,
    ledgerId,
    channelId,
    proposedAmount,
  });

  return { protocolState, sharedData };
};

export const existingChannelFundingReducer = (
  protocolState: states.ExistingChannelFundingState,
  sharedData: SharedData,
  action: ExistingChannelFundingAction,
): ProtocolStateWithSharedData<states.ExistingChannelFundingState> => {
  switch (protocolState.type) {
    case 'ExistingChannelFunding.WaitForLedgerUpdate':
      return waitForLedgerUpdateReducer(protocolState, sharedData, action);
    case 'ExistingChannelFunding.WaitForPostFundSetup':
      return waitForPostFundSetupReducer(protocolState, sharedData, action);
    case 'ExistingChannelFunding.WaitForLedgerTopUp':
      return waitForLedgerTopUpReducer(protocolState, sharedData, action);
  }
  return { protocolState, sharedData };
};

const waitForLedgerTopUpReducer = (
  protocolState: states.WaitForLedgerTopUp,
  sharedData: SharedData,
  action: ExistingChannelFundingAction,
): ProtocolStateWithSharedData<states.ExistingChannelFundingState> => {
  if (!isLedgerTopUpAction(action)) {
    console.warn(`Expected a ledger top up action.`);
  }
  const { protocolState: ledgerTopUpState, sharedData: newSharedData } = ledgerTopUpReducer(
    protocolState.ledgerTopUpState,
    sharedData,
    action,
  );

  if (ledgerTopUpState.type === 'LedgerTopUp.Failure') {
    return {
      protocolState: states.failure({ reason: 'LedgerTopUp Failure' }),
      sharedData: newSharedData,
    };
  } else if (ledgerTopUpState.type === 'LedgerTopUp.Success') {
    const { ledgerId, proposedAmount, channelId, processId } = protocolState;
    const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);
    const theirCommitment = ledgerChannel.lastCommitment.commitment;
    if (helpers.isFirstPlayer(ledgerId, sharedData)) {
      const { proposedAllocation, proposedDestination } = craftNewAllocationAndDestination(
        theirCommitment,
        proposedAmount,
        channelId,
      );
      const ourCommitment = proposeNewConsensus(
        theirCommitment,
        proposedAllocation,
        proposedDestination,
      );
      const signResult = signAndStore(sharedData, ourCommitment);
      if (!signResult.isSuccess) {
        return {
          protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
          sharedData,
        };
      }
      sharedData = signResult.store;

      const messageRelay = sendCommitmentReceived(
        theirAddress(ledgerChannel),
        processId,
        signResult.signedCommitment.commitment,
        signResult.signedCommitment.signature,
      );
      sharedData = queueMessage(newSharedData, messageRelay);
    }
  }
  return {
    protocolState: states.waitForLedgerUpdate(protocolState),
    sharedData: newSharedData,
  };
};

const waitForPostFundSetupReducer = (
  protocolState: states.WaitForPostFundSetup,
  sharedData: SharedData,
  action: ExistingChannelFundingAction,
) => {
  if (action.type !== 'WALLET.COMMON.COMMITMENT_RECEIVED') {
    throw new Error(`Invalid action ${action.type}`);
  }

  let newSharedData = { ...sharedData };

  const checkResult = checkAndStore(newSharedData, action.signedCommitment);
  if (!checkResult.isSuccess) {
    return {
      protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
      sharedData,
    };
  }
  newSharedData = checkResult.store;

  if (!helpers.isFirstPlayer(protocolState.channelId, newSharedData)) {
    const appPostFundSetupSharedData = craftAndSendAppPostFundCommitment(
      newSharedData,
      protocolState.channelId,
      protocolState.processId,
    );
    if (
      appPostFundSetupSharedData === 'CouldNotSign' ||
      appPostFundSetupSharedData === 'NotASetupCommitment'
    ) {
      return {
        protocolState: states.failure({ reason: appPostFundSetupSharedData }),
        sharedData,
      };
    } else {
      newSharedData = appPostFundSetupSharedData;
    }
  }

  return { protocolState: states.success({}), sharedData: newSharedData };
};

const waitForLedgerUpdateReducer = (
  protocolState: states.WaitForLedgerUpdate,
  sharedData: SharedData,
  action: ExistingChannelFundingAction,
) => {
  if (action.type !== 'WALLET.COMMON.COMMITMENT_RECEIVED') {
    throw new Error(`Invalid action ${action.type}`);
  }
  const { ledgerId, processId } = protocolState;
  let newSharedData = { ...sharedData };
  const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);
  const theirCommitment = action.signedCommitment.commitment;

  const checkResult = checkAndStore(newSharedData, action.signedCommitment);
  if (!checkResult.isSuccess) {
    return {
      protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
      sharedData,
    };
  }
  newSharedData = checkResult.store;
  if (helpers.isFirstPlayer(protocolState.ledgerId, newSharedData)) {
    const appPostFundSetupSharedData = craftAndSendAppPostFundCommitment(
      newSharedData,
      protocolState.channelId,
      protocolState.processId,
    );
    if (
      appPostFundSetupSharedData === 'CouldNotSign' ||
      appPostFundSetupSharedData === 'NotASetupCommitment'
    ) {
      return {
        protocolState: states.failure({ reason: appPostFundSetupSharedData }),
        sharedData,
      };
    } else {
      newSharedData = appPostFundSetupSharedData;
    }
  } else {
    const ourCommitment = acceptConsensus(theirCommitment);
    const signResult = signAndStore(newSharedData, ourCommitment);
    if (!signResult.isSuccess) {
      return {
        protocolState: states.failure({ reason: 'Received Invalid Commitment' }),
        sharedData,
      };
    }
    newSharedData = signResult.store;

    const messageRelay = sendCommitmentReceived(
      theirAddress(ledgerChannel),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
    );
    newSharedData = queueMessage(newSharedData, messageRelay);
  }

  return { protocolState: states.waitForPostFundSetup(protocolState), sharedData: newSharedData };
};

function craftNewAllocationAndDestination(
  latestCommitment: Commitment,
  proposedAmount: string,
  channelId: string,
): { proposedAllocation: string[]; proposedDestination: string[] } {
  const numParticipants = latestCommitment.channel.participants.length;
  const amountRequiredFromEachParticipant = bigNumberify(proposedAmount).div(numParticipants);

  const proposedAllocation: string[] = [];
  const proposedDestination: string[] = [];

  for (let i = 0; i < latestCommitment.allocation.length; i++) {
    const allocation = latestCommitment.allocation[i];

    const newAmount = bigNumberify(allocation).sub(amountRequiredFromEachParticipant);

    if (newAmount.gt('0x0')) {
      proposedAllocation.push(newAmount.toHexString());
      proposedDestination.push(latestCommitment.destination[i]);
    }
  }

  proposedAllocation.push(proposedAmount);
  proposedDestination.push(channelId);

  return { proposedAllocation, proposedDestination };
}

function ledgerChannelNeedsTopUp(latestCommitment: Commitment, proposedAmount: string) {
  if (latestCommitment.commitmentType !== CommitmentType.App) {
    throw new Error('Ledger channel is already closed.');
  }
  const numParticipants = latestCommitment.channel.participants.length;
  const amountRequiredFromEachParticipant = bigNumberify(proposedAmount).div(numParticipants);

  return !latestCommitment.allocation.every(a =>
    bigNumberify(a).gte(amountRequiredFromEachParticipant),
  );
}

function craftAndSendAppPostFundCommitment(
  sharedData: SharedData,
  appChannelId: string,
  processId: string,
): SharedData | 'CouldNotSign' | 'NotASetupCommitment' {
  let newSharedData = { ...sharedData };
  const appChannel = getChannel(sharedData, appChannelId);
  if (!appChannel) {
    throw new Error(`Could not find application channel ${appChannelId}`);
  }

  const theirAppCommitment = appChannel.lastCommitment.commitment;

  const ourAppCommitment = nextSetupCommitment(theirAppCommitment);
  if (ourAppCommitment === 'NotASetupCommitment') {
    return 'NotASetupCommitment';
  }
  const signResult = signAndStore(newSharedData, ourAppCommitment);
  if (!signResult.isSuccess) {
    return 'CouldNotSign';
  }
  newSharedData = signResult.store;

  // just need to put our message in the outbox
  const messageRelay = sendCommitmentReceived(
    theirAddress(appChannel),
    processId,
    signResult.signedCommitment.commitment,
    signResult.signedCommitment.signature,
  );
  newSharedData = queueMessage(newSharedData, messageRelay);
  return newSharedData;
}

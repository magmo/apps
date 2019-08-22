import { SharedData, ChannelFundingState, setFundingState } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData, makeLocator } from '..';
import { ExistingLedgerFundingAction } from './actions';
import * as selectors from '../../selectors';
import { getLastCommitment } from '../../channel-store';
import { Commitment } from '../../../domain';
import { bigNumberify } from 'ethers/utils';
import { ProtocolLocator } from '../../../communication';
import { CommitmentType } from 'fmg-core';
import {
  initialize as initializeLedgerTopUp,
  ledgerTopUpReducer,
  LEDGER_TOP_UP_PROTOCOL_LOCATOR,
} from '../ledger-top-up/reducer';
import { routesToLedgerTopUp } from '../ledger-top-up/actions';
import { addHex } from '../../../utils/hex-utils';
import { initializeConsensusUpdate } from '../consensus-update';
import {
  CONSENSUS_UPDATE_PROTOCOL_LOCATOR,
  consensusUpdateReducer,
} from '../consensus-update/reducer';
import {
  clearedToSend,
  routesToConsensusUpdate,
  isConsensusUpdateAction,
} from '../consensus-update/actions';
import {
  TerminalConsensusUpdateState,
  isTerminal,
  ConsensusUpdateState,
} from '../consensus-update/states';
import { LedgerTopUpState } from '../ledger-top-up/states';
import { getLatestCommitment, removeZeroFundsFromBalance } from '../reducer-helpers';
export { EXISTING_LEDGER_FUNDING_PROTOCOL_LOCATOR } from '../../../communication/protocol-locator';

export const initialize = ({
  processId,
  channelId,
  ledgerId,
  startingAllocation,
  startingDestination,
  protocolLocator,
  sharedData,
}: {
  processId: string;
  channelId: string;
  ledgerId: string;
  startingAllocation: string[];
  startingDestination: string[];
  protocolLocator: ProtocolLocator;
  sharedData: SharedData;
}): ProtocolStateWithSharedData<states.NonTerminalExistingLedgerFundingState | states.Failure> => {
  const ledgerChannel = selectors.getChannelState(sharedData, ledgerId);
  const theirCommitment = getLastCommitment(ledgerChannel);

  const appFunding = craftAppFunding(
    channelId,
    ledgerId,
    startingAllocation,
    startingDestination,
    sharedData,
  );
  let consensusUpdateState: ConsensusUpdateState;
  ({ sharedData, protocolState: consensusUpdateState } = initializeConsensusUpdate({
    processId,
    channelId: ledgerId,
    clearedToSend: false,
    proposedAllocation: appFunding.proposedAllocation,
    proposedDestination: appFunding.proposedDestination,
    protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
    sharedData,
  }));

  if (ledgerChannelNeedsTopUp(theirCommitment, startingAllocation, startingDestination)) {
    let ledgerTopUpState: LedgerTopUpState;
    ({ protocolState: ledgerTopUpState, sharedData } = initializeLedgerTopUp({
      processId,
      channelId,
      ledgerId,
      proposedAllocation: startingAllocation,
      proposedDestination: startingDestination,
      originalAllocation: theirCommitment.allocation,
      protocolLocator: makeLocator(protocolLocator, LEDGER_TOP_UP_PROTOCOL_LOCATOR),
      sharedData,
    }));

    return {
      protocolState: states.waitForLedgerTopUp({
        ledgerTopUpState,
        processId,
        channelId,
        ledgerId,
        startingAllocation,
        startingDestination,
        protocolLocator,
        consensusUpdateState,
      }),
      sharedData,
    };
  }
  // If the ledger channel does not need a top up we can start exchanging consensus commitments
  ({ sharedData, protocolState: consensusUpdateState } = consensusUpdateReducer(
    consensusUpdateState,
    sharedData,
    clearedToSend({
      protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
      processId,
    }),
  ));
  return {
    protocolState: states.waitForLedgerUpdate({
      processId,
      ledgerId,
      channelId,
      startingAllocation,
      startingDestination,
      consensusUpdateState,
      protocolLocator,
    }),
    sharedData,
  };
};

export const existingLedgerFundingReducer = (
  protocolState: states.ExistingLedgerFundingState,
  sharedData: SharedData,
  action: ExistingLedgerFundingAction,
): ProtocolStateWithSharedData<states.ExistingLedgerFundingState> => {
  switch (protocolState.type) {
    case 'ExistingLedgerFunding.WaitForLedgerUpdate':
      return waitForLedgerUpdateReducer(protocolState, sharedData, action);
    case 'ExistingLedgerFunding.WaitForLedgerTopUp':
      return waitForLedgerTopUpReducer(protocolState, sharedData, action);
  }
  return { protocolState, sharedData };
};

const waitForLedgerTopUpReducer = (
  protocolState: states.WaitForLedgerTopUp,
  sharedData: SharedData,
  action: ExistingLedgerFundingAction,
): ProtocolStateWithSharedData<states.ExistingLedgerFundingState> => {
  if (routesToConsensusUpdate(action, protocolState.protocolLocator)) {
    let consensusUpdateState: ConsensusUpdateState;
    ({ protocolState: consensusUpdateState, sharedData } = consensusUpdateReducer(
      protocolState.consensusUpdateState,
      sharedData,
      action,
    ));
    return {
      protocolState: {
        ...protocolState,
        consensusUpdateState,
      },
      sharedData,
    };
  } else if (routesToLedgerTopUp(action, protocolState.protocolLocator)) {
    const { protocolState: ledgerTopUpState, sharedData: newSharedData } = ledgerTopUpReducer(
      protocolState.ledgerTopUpState,
      sharedData,
      action,
    );
    sharedData = newSharedData;

    if (ledgerTopUpState.type === 'LedgerTopUp.Failure') {
      return {
        protocolState: states.failure({ reason: 'LedgerTopUpFailure' }),
        sharedData,
      };
    } else if (ledgerTopUpState.type === 'LedgerTopUp.Success') {
      const { protocolLocator, processId } = protocolState;
      let consensusUpdateState: ConsensusUpdateState;
      ({ protocolState: consensusUpdateState, sharedData } = consensusUpdateReducer(
        protocolState.consensusUpdateState,
        sharedData,
        clearedToSend({
          protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
          processId,
        }),
      ));

      if (isTerminal(consensusUpdateState)) {
        return handleTerminalConsensusUpdate(
          protocolState.channelId,
          protocolState.ledgerId,
          consensusUpdateState,
          sharedData,
        );
      } else {
        return {
          protocolState: states.waitForLedgerUpdate({
            ...protocolState,
            consensusUpdateState,
          }),
          sharedData,
        };
      }
    } else {
      return {
        protocolState: states.waitForLedgerTopUp({ ...protocolState, ledgerTopUpState }),
        sharedData,
      };
    }
  } else {
    return {
      protocolState,
      sharedData,
    };
  }
};

const waitForLedgerUpdateReducer = (
  protocolState: states.WaitForLedgerUpdate,
  sharedData: SharedData,
  action: ExistingLedgerFundingAction,
) => {
  if (!isConsensusUpdateAction(action)) {
    console.warn(`Expected Consensus Update action received ${action.type} instead`);
    return { protocolState, sharedData };
  }
  let consensusUpdateState: ConsensusUpdateState;
  ({ sharedData, protocolState: consensusUpdateState } = consensusUpdateReducer(
    protocolState.consensusUpdateState,
    sharedData,
    action,
  ));

  if (isTerminal(consensusUpdateState)) {
    return handleTerminalConsensusUpdate(
      protocolState.channelId,
      protocolState.ledgerId,
      consensusUpdateState,
      sharedData,
    );
  } else {
    return {
      protocolState: {
        ...protocolState,
        consensusUpdateState,
      },
      sharedData,
    };
  }
};

function ledgerChannelNeedsTopUp(
  latestCommitment: Commitment,
  proposedAllocation: string[],
  proposedDestination: string[],
) {
  if (
    latestCommitment.commitmentType !== CommitmentType.App &&
    latestCommitment.commitmentType !== CommitmentType.PostFundSetup
  ) {
    throw new Error('Ledger channel is already closed.');
  }
  // We assume that destination/allocation are the same length and destination contains the same addresses
  // Otherwise we shouldn't be in this protocol at all
  for (let i = 0; i < proposedDestination.length; i++) {
    const address = proposedDestination[i];
    const existingIndex = latestCommitment.destination.indexOf(address);
    if (
      existingIndex > -1 &&
      bigNumberify(latestCommitment.allocation[existingIndex]).lt(proposedAllocation[i])
    ) {
      return true;
    }
  }
  return false;
}

function craftAppFunding(
  appChannelId: string,
  ledgerChannelId: string,
  startingAllocation: string[],
  startingDestination: string[],
  sharedData: SharedData,
): { proposedAllocation: string[]; proposedDestination: string[] } {
  const { allocation: ledgerAllocation, destination: ledgerDestination } = getLatestCommitment(
    ledgerChannelId,
    sharedData,
  );

  const appTotal = startingAllocation.reduce(addHex);

  // If the ledger allocation is greater than the startingAllocation requested
  // we subtract the startingAllocation from the ledger allocation
  const updatedLedgerAllocation = ledgerAllocation.map((a, i) => {
    const address = ledgerDestination[i];
    const startingIndex = startingDestination.indexOf(address);
    const difference =
      startingIndex < 0 ? bigNumberify(0) : bigNumberify(a).sub(startingAllocation[startingIndex]);
    return difference.gt(0) ? difference.toHexString() : bigNumberify(0).toHexString();
  });

  const {
    allocation: proposedAllocation,
    destination: proposedDestination,
  } = removeZeroFundsFromBalance(
    [appTotal, ...updatedLedgerAllocation],
    [appChannelId, ...ledgerDestination],
  );

  return {
    proposedAllocation,
    proposedDestination,
  };
}

function handleTerminalConsensusUpdate(
  channelId: string,
  ledgerId: string,
  consensusUpdateState: TerminalConsensusUpdateState,
  sharedData: SharedData,
) {
  if (consensusUpdateState.type === 'ConsensusUpdate.Failure') {
    return {
      protocolState: states.failure({ reason: 'LedgerTopUpFailure' }),
      sharedData,
    };
  } else {
    const fundingState: ChannelFundingState = {
      directlyFunded: false,
      fundingChannel: ledgerId,
    };

    sharedData = setFundingState(sharedData, channelId, fundingState);
    return {
      protocolState: states.success({}),
      sharedData,
    };
  }
}

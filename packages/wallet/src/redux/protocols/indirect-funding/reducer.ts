import { SharedData } from '../../state';
import { ProtocolStateWithSharedData } from '..';
import { IndirectFundingState } from './states';
import * as selectors from '../../selectors';
import * as helpers from '../reducer-helpers';
import { getLastCommitment, ChannelState } from '../../channel-store/channel-state';
import { CommitmentType } from 'fmg-core';
import {
  initializeExistingLedgerFunding,
  isExistingLedgerFundingAction,
  existingLedgerFundingReducer,
} from '../existing-ledger-funding';
import * as states from './states';
import {
  initializeNewLedgerChannel,
  isNewLedgerChannelAction,
  NewLedgerChannelReducer,
} from '../new-ledger-channel';
import { IndirectFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { WalletAction } from '../../actions';

export function initialize(
  processId: string,
  channelId: string,
  targetAllocation: string[],
  targetDestination: string[],
  sharedData: SharedData,
): ProtocolStateWithSharedData<IndirectFundingState> {
  const existingLedgerChannel = selectors.getFundedLedgerChannelForParticipants(
    sharedData,
    helpers.getOurAddress(channelId, sharedData),
    helpers.getOpponentAddress(channelId, sharedData),
  );

  if (ledgerChannelIsReady(existingLedgerChannel)) {
    return fundWithExistingLedgerChannel({
      processId,
      channelId,
      targetAllocation,
      targetDestination,
      sharedData,
      existingLedgerChannel,
    });
  } else {
    const {
      protocolState: NewLedgerChannelState,
      sharedData: newSharedData,
    } = initializeNewLedgerChannel(processId, channelId, sharedData);

    if (NewLedgerChannelState.type === 'NewLedgerChannel.Success') {
      return { protocolState: states.success({}), sharedData: newSharedData };
    } else if (NewLedgerChannelState.type === 'NewLedgerChannel.Failure') {
      return {
        protocolState: states.failure({ reason: 'NewLedgerChannel Failure' }),
        sharedData: newSharedData,
      };
    }

    return {
      protocolState: states.waitForNewLedgerChannel({
        processId,
        channelId,
        newLedgerChannel: NewLedgerChannelState,
        targetAllocation,
        targetDestination,
      }),
      sharedData: newSharedData,
    };
  }
}

export function indirectFundingReducer(
  protocolState: states.NonTerminalIndirectFundingState,
  sharedData: SharedData,
  action: IndirectFundingAction,
): ProtocolStateWithSharedData<states.IndirectFundingState> {
  switch (protocolState.type) {
    case 'IndirectFunding.WaitForNewLedgerChannel':
      return waitForNewLedgerChannelReducer(protocolState, action, sharedData);
    case 'IndirectFunding.WaitForExistingLedgerFunding':
      return waitForExistingLedgerFundingReducer(protocolState, action, sharedData);

    default:
      return unreachable(protocolState);
  }
}

function waitForNewLedgerChannelReducer(
  protocolState: states.WaitForNewLedgerChannel,
  action: WalletAction,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.IndirectFundingState> {
  if (!isNewLedgerChannelAction(action)) {
    console.warn(`Received ${action} but currently in ${protocolState.type}`);
    return { protocolState, sharedData };
  }

  const {
    protocolState: newLedgerChannelState,
    sharedData: newSharedData,
  } = NewLedgerChannelReducer(protocolState.newLedgerChannel, sharedData, action);
  switch (newLedgerChannelState.type) {
    case 'NewLedgerChannel.Failure':
      return {
        protocolState: states.failure({ reason: 'NewLedgerChannel Failure' }),
        sharedData: newSharedData,
      };
    case 'NewLedgerChannel.Success':
      const { channelId } = protocolState;
      const existingLedgerChannel = selectors.getFundedLedgerChannelForParticipants(
        sharedData,
        helpers.getOurAddress(channelId, sharedData),
        helpers.getOpponentAddress(channelId, sharedData),
      );
      if (ledgerChannelIsReady(existingLedgerChannel)) {
        return fundWithExistingLedgerChannel({
          ...protocolState,
          channelId,
          sharedData,
          existingLedgerChannel,
        });
      } else {
        throw new Error(
          `Expected ledger channel ${protocolState.newLedgerChannel.channelId} not found`,
        );
      }
    default:
      return {
        protocolState: states.waitForNewLedgerChannel({
          ...protocolState,
          newLedgerChannel: newLedgerChannelState,
        }),
        sharedData: newSharedData,
      };
  }
}

function waitForExistingLedgerFundingReducer(
  protocolState: states.WaitForExistingLedgerFunding,
  action: WalletAction,
  sharedData: SharedData,
) {
  if (!isExistingLedgerFundingAction(action)) {
    console.warn(`Received ${action} but currently in ${protocolState.type}`);
    return { protocolState, sharedData };
  }

  const {
    protocolState: existingLedgerFundingState,
    sharedData: newSharedData,
  } = existingLedgerFundingReducer(protocolState.existingLedgerFundingState, sharedData, action);
  if (existingLedgerFundingState.type === 'ExistingLedgerFunding.Success') {
    return { protocolState: states.success({}), sharedData: newSharedData };
  } else if (existingLedgerFundingState.type === 'ExistingLedgerFunding.Failure') {
    return {
      protocolState: states.failure({
        reason: 'ExistingLedgerFunding Failure',
      }),
      sharedData: newSharedData,
    };
  } else {
    return {
      protocolState: states.waitForExistingLedgerFunding({
        ...protocolState,
        existingLedgerFundingState,
      }),
      sharedData: newSharedData,
    };
  }
}

function fundWithExistingLedgerChannel({
  processId,
  channelId,
  targetAllocation,
  targetDestination,
  sharedData,
  existingLedgerChannel,
}: {
  processId: string;
  channelId: string;
  targetAllocation: string[];
  targetDestination: string[];
  sharedData: SharedData;
  existingLedgerChannel: ChannelState;
}): ProtocolStateWithSharedData<IndirectFundingState> {
  const ledgerId = existingLedgerChannel.channelId;
  const {
    protocolState: existingLedgerFundingState,
    sharedData: newSharedData,
  } = initializeExistingLedgerFunding(
    processId,
    channelId,
    ledgerId,
    targetAllocation,
    targetDestination,
    sharedData,
  );

  if (existingLedgerFundingState.type === 'ExistingLedgerFunding.Success') {
    return { protocolState: states.success({}), sharedData: newSharedData };
  } else if (existingLedgerFundingState.type === 'ExistingLedgerFunding.Failure') {
    return {
      protocolState: states.failure({
        reason: 'ExistingLedgerFunding Failure',
      }),
      sharedData: newSharedData,
    };
  }

  return {
    protocolState: states.waitForExistingLedgerFunding({
      processId,
      channelId,
      ledgerId,
      existingLedgerFundingState,
      targetAllocation,
      targetDestination,
    }),
    sharedData: newSharedData,
  };
}

function ledgerChannelIsReady(
  existingLedgerChannel: ChannelState | undefined,
): existingLedgerChannel is ChannelState {
  return (
    !!existingLedgerChannel &&
    (getLastCommitment(existingLedgerChannel).commitmentType === CommitmentType.App ||
      getLastCommitment(existingLedgerChannel).commitmentType === CommitmentType.PostFundSetup)
  );
}

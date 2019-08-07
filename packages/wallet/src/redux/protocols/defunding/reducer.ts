import { SharedData, getChannel } from '../../state';
import { ProtocolStateWithSharedData, makeLocator } from '..';
import * as states from './states';
import * as helpers from '../reducer-helpers';
import { withdrawalReducer, initialize as withdrawalInitialize } from './../withdrawing/reducer';
import * as selectors from '../../selectors';
import * as actions from './actions';
import { isWithdrawalAction } from '../withdrawing/actions';
import { unreachable } from '../../../utils/reducer-utils';
import {
  indirectDefundingReducer,
  initialize as indirectDefundingInitialize,
} from '../indirect-defunding/reducer';
import { isIndirectDefundingAction } from '../indirect-defunding/actions';
import * as indirectDefundingStates from '../indirect-defunding/states';
import { CommitmentReceived, EmbeddedProtocol } from '../../../communication';
import { getLastCommitment } from '../../channel-store';
import { ProtocolAction } from '../../../redux/actions';
import { VirtualDefundingState } from '../virtual-defunding/states';
import { initializeVirtualDefunding, virtualDefundingReducer } from '../virtual-defunding';
import { routesToConsensusUpdate } from '../consensus-update/actions';

export const initialize = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
  action?: CommitmentReceived,
): ProtocolStateWithSharedData<states.DefundingState> => {
  if (!helpers.channelIsClosed(channelId, sharedData)) {
    return { protocolState: states.failure({ reason: 'Channel Not Closed' }), sharedData };
  }
  const fundingType = helpers.getChannelFundingType(channelId, sharedData);
  switch (fundingType) {
    case helpers.FundingType.Direct:
      return createWaitForWithdrawal(sharedData, processId, channelId);
    case helpers.FundingType.Ledger:
      const ledgerId = helpers.getFundingChannelId(channelId, sharedData);
      const channel = getChannel(sharedData, channelId);
      if (!channel) {
        throw new Error(`Channel does not exist with id ${channelId}`);
      }
      const proposedAllocation = getLastCommitment(channel).allocation;
      const proposedDestination = getLastCommitment(channel).destination;
      const indirectDefundingState = indirectDefundingInitialize({
        processId,
        channelId,
        ledgerId,
        proposedAllocation,
        proposedDestination,
        sharedData,
        action,
      });

      const protocolState = states.waitForLedgerDefunding({
        processId,
        channelId,
        indirectDefundingState: indirectDefundingState.protocolState,
      });

      return { protocolState, sharedData: indirectDefundingState.sharedData };

    case helpers.FundingType.Virtual:
      let virtualDefunding: VirtualDefundingState;
      ({ protocolState: virtualDefunding, sharedData } = initializeVirtualDefunding({
        processId,
        targetChannelId: channelId,

        protocolLocator: makeLocator(EmbeddedProtocol.VirtualDefunding),
        sharedData,
      }));
      return {
        protocolState: states.waitForVirtualDefunding({ processId, channelId, virtualDefunding }),
        sharedData,
      };
  }
};

export const defundingReducer = (
  protocolState: states.DefundingState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<states.DefundingState> => {
  if (!actions.isDefundingAction(action)) {
    console.warn(`Defunding reducer received non-defunding action ${action.type}.`);
    return { protocolState, sharedData };
  }
  switch (protocolState.type) {
    case 'Defunding.WaitForWithdrawal':
      return waitForWithdrawalReducer(protocolState, sharedData, action);
    case 'Defunding.WaitForIndirectDefunding':
      return waitForIndirectDefundingReducer(protocolState, sharedData, action);
    case 'Defunding.WaitForVirtualDefunding':
      return waitForVirtualDefundingReducer(protocolState, sharedData, action);
    case 'Defunding.Failure':
    case 'Defunding.Success':
      return { protocolState, sharedData };
    default:
      return unreachable(protocolState);
  }
};

const waitForVirtualDefundingReducer = (
  protocolState: states.WaitForVirtualDefunding,
  sharedData: SharedData,
  action: actions.DefundingAction,
): ProtocolStateWithSharedData<states.DefundingState> => {
  if (!routesToConsensusUpdate(action, makeLocator(EmbeddedProtocol.ConsensusUpdate))) {
    console.warn(`Expected virtual defunding action but received ${action.type}`);
    return { protocolState, sharedData };
  }
  let virtualDefunding: VirtualDefundingState;
  ({ protocolState: virtualDefunding, sharedData } = virtualDefundingReducer(
    protocolState.virtualDefunding,
    sharedData,
    action,
  ));

  switch (virtualDefunding.type) {
    case 'VirtualDefunding.Failure':
      return {
        protocolState: states.failure({ reason: 'Virtual De-Funding Failure' }),
        sharedData,
      };
    case 'VirtualDefunding.Success':
      const fundingChannelId = helpers.getDirectlyFundedChannel(
        protocolState.channelId,
        sharedData,
      );
      return createWaitForWithdrawal(sharedData, protocolState.processId, fundingChannelId);
    default:
      return {
        protocolState: states.waitForVirtualDefunding({ ...protocolState, virtualDefunding }),
        sharedData,
      };
  }
};

const waitForIndirectDefundingReducer = (
  protocolState: states.WaitForIndirectDefunding,
  sharedData: SharedData,
  action: actions.DefundingAction,
) => {
  if (!isIndirectDefundingAction(action)) {
    return { protocolState, sharedData };
  }
  const {
    sharedData: updatedSharedData,
    protocolState: updatedIndirectDefundingState,
  } = indirectDefundingReducer(protocolState.indirectDefundingState, sharedData, action);
  if (indirectDefundingStates.isTerminal(updatedIndirectDefundingState)) {
    if (updatedIndirectDefundingState.type === 'IndirectDefunding.Success') {
      const fundingChannelId = helpers.getFundingChannelId(
        protocolState.channelId,
        updatedSharedData,
      );
      return createWaitForWithdrawal(updatedSharedData, protocolState.processId, fundingChannelId);
    } else {
      return {
        protocolState: states.failure({ reason: 'Ledger De-funding Failure' }),
        sharedData: updatedSharedData,
      };
    }
  }
  const updatedProtocolState = {
    ...protocolState,
    indirectDefundingState: updatedIndirectDefundingState,
  };
  return {
    protocolState: updatedProtocolState,
    sharedData: updatedSharedData,
  };
};

const waitForWithdrawalReducer = (
  protocolState: states.WaitForWithdrawal,
  sharedData: SharedData,
  action: actions.DefundingAction,
) => {
  if (!isWithdrawalAction(action)) {
    return { protocolState, sharedData };
  }
  const { protocolState: newWithdrawalState, sharedData: newSharedData } = withdrawalReducer(
    protocolState.withdrawalState,
    sharedData,
    action,
  );
  if (newWithdrawalState.type === 'Withdrawing.Success') {
    return {
      protocolState: states.success({}),
      sharedData: helpers.hideWallet(newSharedData),
    };
  } else if (newWithdrawalState.type === 'Withdrawing.Failure') {
    return {
      protocolState: states.failure({ reason: 'Withdrawal Failure' }),
      sharedData: newSharedData,
    };
  } else {
    return {
      protocolState: states.waitForWithdrawal({
        ...protocolState,
        withdrawalState: newWithdrawalState,
      }),
      sharedData: newSharedData,
    };
  }
};

const createWaitForWithdrawal = (sharedData: SharedData, processId: string, channelId: string) => {
  const withdrawalAmount = getWithdrawalAmount(sharedData, channelId);

  const { protocolState: withdrawalState, sharedData: newSharedData } = withdrawalInitialize(
    withdrawalAmount,
    channelId,
    processId,
    sharedData,
  );

  const protocolState = states.waitForWithdrawal({
    processId,
    withdrawalState,
    channelId,
  });

  return { protocolState, sharedData: newSharedData };
};
const getWithdrawalAmount = (sharedData: SharedData, channelId: string) => {
  const channelState = selectors.getChannelState(sharedData, channelId);
  return getLastCommitment(channelState).allocation[channelState.ourIndex];
};

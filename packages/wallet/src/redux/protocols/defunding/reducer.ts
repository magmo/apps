import { SharedData, getChannel } from '../../state';
import { ProtocolStateWithSharedData, makeLocator, EMPTY_LOCATOR } from '..';
import * as states from './states';
import * as helpers from '../reducer-helpers';
import * as actions from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import {
  indirectDefundingReducer,
  initialize as indirectDefundingInitialize,
} from '../indirect-defunding/reducer';
import { isIndirectDefundingAction } from '../indirect-defunding/actions';
import * as indirectDefundingStates from '../indirect-defunding/states';
import { EmbeddedProtocol } from '../../../communication';
import { getLastCommitment } from '../../channel-store';
import { ProtocolAction } from '../../../redux/actions';
import { VirtualDefundingState } from '../virtual-defunding/states';
import { initializeVirtualDefunding, virtualDefundingReducer } from '../virtual-defunding';
import { routesToVirtualDefunding } from '../virtual-defunding/actions';
import * as indirectDefundingActions from '../indirect-defunding/actions';

export const initialize = (
  processId: string,
  channelId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.DefundingState> => {
  if (!helpers.channelIsClosed(channelId, sharedData)) {
    return { protocolState: states.failure({ reason: 'Channel Not Closed' }), sharedData };
  }
  const fundingType = helpers.getChannelFundingType(channelId, sharedData);
  let indirectDefundingState: indirectDefundingStates.IndirectDefundingState;
  switch (fundingType) {
    case helpers.FundingType.Direct:
      return {
        protocolState: states.failure({ reason: 'Cannot defund directly funded channel' }),
        sharedData,
      };
    case helpers.FundingType.Ledger:
      ({ indirectDefundingState, sharedData } = createIndirectDefundingState(
        processId,
        channelId,
        true,
        sharedData,
      ));

      return {
        protocolState: states.waitForLedgerDefunding({
          processId,
          channelId,
          ledgerId: helpers.getFundingChannelId(channelId, sharedData),
          indirectDefundingState,
        }),
        sharedData,
      };
    case helpers.FundingType.Virtual:
      let virtualDefunding: VirtualDefundingState;
      ({ protocolState: virtualDefunding, sharedData } = initializeVirtualDefunding({
        processId,
        targetChannelId: channelId,

        protocolLocator: makeLocator(EmbeddedProtocol.VirtualDefunding),
        sharedData,
      }));

      return {
        protocolState: states.waitForVirtualDefunding({
          processId,
          channelId,
          ledgerId: helpers.getFundingChannelId(channelId, sharedData),
          virtualDefunding,
        }),
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
  if (!routesToVirtualDefunding(action, EMPTY_LOCATOR)) {
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
      return { protocolState: states.success({}), sharedData: helpers.hideWallet(sharedData) };

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
  return handleIndirectDefundingAction(protocolState, sharedData, action);
};

const handleIndirectDefundingAction = (
  protocolState: states.WaitForIndirectDefunding,
  sharedData: SharedData,
  action: indirectDefundingActions.IndirectDefundingAction,
) => {
  let indirectDefundingState: indirectDefundingStates.IndirectDefundingState;
  ({ protocolState: indirectDefundingState, sharedData } = indirectDefundingReducer(
    protocolState.indirectDefundingState,
    sharedData,
    action,
  ));
  switch (indirectDefundingState.type) {
    case 'IndirectDefunding.Failure':
      return {
        protocolState: states.failure({ reason: 'Indirect Defunding Failure' }),
        sharedData,
      };
    case 'IndirectDefunding.Success':
      return { protocolState: states.success({}), sharedData: helpers.hideWallet(sharedData) };
    default:
      return { protocolState: { ...protocolState, indirectDefundingState }, sharedData };
  }
};

const createIndirectDefundingState = (
  processId: string,
  channelId: string,
  clearedToProceed: boolean,
  sharedData: SharedData,
) => {
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
    clearedToProceed,
    protocolLocator: makeLocator([], EmbeddedProtocol.IndirectDefunding),
  });

  return { indirectDefundingState: indirectDefundingState.protocolState, sharedData };
};

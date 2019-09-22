import { SharedData, registerChannelToMonitor, setChannelStore } from '../../state';
import * as states from './states';
import * as actions from './actions';
import { ProtocolStateWithSharedData } from '..';
import { unreachable } from '../../../utils/reducer-utils';
import { channelStoreReducer } from '../../channel-store/reducer';
import { ProtocolAction } from '../../actions';
import * as dispute from '../dispute';
import { disputeReducer } from '../dispute/reducer';
import { accumulateSideEffects } from '../../outbox';
// TODO: Right now we're using a fixed application ID
// since we're not too concerned with handling multiple running app channels.
// This might need to change in the future.
export const APPLICATION_PROCESS_ID = 'Application';

export function initialize(
  sharedData: SharedData,
  channelId: string,
  address: string,
  privateKey: string,
): ProtocolStateWithSharedData<states.ApplicationState> {
  return {
    protocolState: states.waitForFirstState({ channelId, privateKey, address }),
    sharedData: registerChannelToMonitor(sharedData, APPLICATION_PROCESS_ID, channelId, []),
  };
}

export function applicationReducer(
  protocolState: states.ApplicationState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<states.ApplicationState> {
  if (states.isTerminalApplicationState(protocolState)) {
    return { protocolState, sharedData };
  }
  if (!actions.isApplicationAction(action)) {
    return { protocolState, sharedData };
  }
  if (dispute.isDisputeAction(action)) {
    return handleDisputeAction(protocolState, sharedData, action);
  }
  switch (action.type) {
    case 'WALLET.APPLICATION.STATES_RECEIVED':
      return statesReceived(protocolState, sharedData, action);
    case 'WALLET.APPLICATION.CONCLUDED':
      return { sharedData, protocolState: states.success({}) };
    case 'WALLET.APPLICATION.CHALLENGE_DETECTED':
      return challengeDetectedReducer(protocolState, sharedData, action);
    case 'WALLET.APPLICATION.CHALLENGE_REQUESTED':
      return challengeRequestedReducer(protocolState, sharedData, action);
    default:
      return unreachable(action);
  }
}

function statesReceived(
  protocolState: states.NonTerminalApplicationState,
  sharedData: SharedData,
  action: actions.StatesReceived,
): ProtocolStateWithSharedData<states.ApplicationState> {
  const { signedStates } = action;
  const { state: channelStore, sideEffects } = channelStoreReducer(
    sharedData.channelStore,
    actions.statesReceived({ signedStates, processId: APPLICATION_PROCESS_ID }),
  );
  sharedData = setChannelStore(sharedData, channelStore);
  // TODO: This is kind of ugly
  sharedData.outboxState = accumulateSideEffects(sharedData.outboxState, sideEffects);
  return { protocolState, sharedData };
}

function challengeRequestedReducer(
  protocolState: states.NonTerminalApplicationState,
  sharedData: SharedData,
  action: actions.ChallengeRequested,
): ProtocolStateWithSharedData<states.ApplicationState> {
  const { channelId, processId } = action;
  const disputeState = dispute.initializeChallenger(channelId, processId, sharedData);
  const newProtocolState = states.waitForDispute({
    ...protocolState,
    disputeState: disputeState.state,
  });
  return {
    protocolState: newProtocolState,
    sharedData: { ...disputeState.sharedData, currentProcessId: APPLICATION_PROCESS_ID },
  };
}

function challengeDetectedReducer(
  protocolState: states.NonTerminalApplicationState,
  sharedData: SharedData,
  action: actions.ChallengeDetected,
): ProtocolStateWithSharedData<states.ApplicationState> {
  const { channelId, processId, expiresAt: expiryTime, signedState } = action;
  const disputeState = dispute.initializeResponder(
    processId,
    channelId,
    expiryTime,
    sharedData,
    signedState,
  );
  const newProtocolState = states.waitForDispute({
    ...protocolState,
    disputeState: disputeState.protocolState,
  });
  return {
    protocolState: newProtocolState,
    sharedData: { ...disputeState.sharedData, currentProcessId: APPLICATION_PROCESS_ID },
  };
}

function handleDisputeAction(
  protocolState: states.NonTerminalApplicationState,
  sharedData: SharedData,
  action: dispute.DisputeAction,
): ProtocolStateWithSharedData<states.ApplicationState> {
  if (protocolState.type !== 'Application.WaitForDispute') {
    return { protocolState, sharedData };
  }
  const newDisputeState = disputeReducer(protocolState.disputeState, sharedData, action);
  if (
    newDisputeState.protocolState.type === 'Challenging.SuccessOpen' ||
    newDisputeState.protocolState.type === 'Challenging.Failure' ||
    newDisputeState.protocolState.type === 'Responding.Success'
  ) {
    return {
      protocolState: states.ongoing({ ...protocolState }),
      sharedData: newDisputeState.sharedData,
    };
  }
  if (
    newDisputeState.protocolState.type === 'Challenging.SuccessClosed' ||
    newDisputeState.protocolState.type === 'Responding.Failure'
  ) {
    return {
      protocolState: states.success({ ...protocolState }),
      sharedData: newDisputeState.sharedData,
    };
  }
  const newApplicationState = { ...protocolState, disputeState: newDisputeState.protocolState };
  return { protocolState: newApplicationState, sharedData: newDisputeState.sharedData };
}

import { initializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { unreachable } from '../utils/reducer-utils';
import * as actions from './actions';
import { accumulateSideEffects } from './outbox';
import { clearOutbox } from './outbox/reducer';
import { ProtocolState } from './protocols';
import {
  isNewProcessAction,
  isProtocolAction,
  NewProcessAction,
  INITIALIZE_CHANNEL,
} from './protocols/actions';
import * as applicationProtocol from './protocols/application';
import {
  challengingReducer,
  initializeChallengerState,
  initializeResponderState,
} from './protocols/dispute/reducer';
import * as concludingProtocol from './protocols/concluding';
import * as fundProtocol from './protocols/funding';
import * as states from './state';
import { WalletProtocol } from './types';
import { APPLICATION_PROCESS_ID } from './protocols/application/reducer';
import { adjudicatorStateReducer } from './adjudicator-state/reducer';
import { CONCLUDE_INSTIGATED, isStartProcessAction } from '../communication';
import { communication } from '../..';

const initialState = states.waitForLogin();

export const walletReducer = (
  state: states.WalletState = initialState,
  action: actions.WalletAction,
): states.WalletState => {
  const nextState = { ...state, outboxState: clearOutbox(state.outboxState, action) };

  switch (nextState.type) {
    case states.WAIT_FOR_LOGIN:
      return waitForLoginReducer(nextState, action);
    case states.METAMASK_ERROR:
      // We stay in the metamask error state until a change to
      // metamask settings forces a refresh
      return state;
    case states.WALLET_INITIALIZED:
      return initializedReducer(nextState, action);
    default:
      return unreachable(nextState);
  }
};

export function initializedReducer(
  state: states.Initialized,
  action: actions.WalletAction,
): states.WalletState {
  let newState = { ...state };
  if (actions.isSharedDataUpdateAction(action)) {
    newState = updateSharedData(newState, action);
  }

  if (isNewProcessAction(action)) {
    return routeToNewProcessInitializer(newState, action);
  } else if (isProtocolAction(action)) {
    return routeToProtocolReducer(newState, action);
  }

  return newState;
}

function updateSharedData(
  state: states.Initialized,
  action: actions.SharedDataUpdateAction,
): states.Initialized {
  if (actions.isAdjudicatorEventAction(action)) {
    return { ...state, adjudicatorState: adjudicatorStateReducer(state.adjudicatorState, action) };
  } else {
    return state;
  }
}

function routeToProtocolReducer(
  state: states.Initialized,
  action: actions.ProtocolAction,
): states.Initialized {
  const processState = state.processStore[action.processId];
  if (!processState) {
    // Log warning?
    return state;
  } else {
    switch (processState.protocol) {
      case WalletProtocol.Funding:
        const { protocolState, sharedData } = fundProtocol.reducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(state, sharedData, processState, protocolState);

      case WalletProtocol.Application:
        const {
          protocolState: appProtocolState,
          sharedData: appSharedData,
        } = applicationProtocol.reducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(state, appSharedData, processState, appProtocolState);
      case WalletProtocol.Dispute:
        const {
          protocolState: challengingProtocolState,
          sharedData: challengingSharedData,
        } = challengingReducer(processState.protocolState, states.sharedData(state), action);
        return updatedState(state, challengingSharedData, processState, challengingProtocolState);

      case WalletProtocol.Concluding:
        const {
          protocolState: concludingProtocolState,
          sharedData: concludingSharedData,
        } = concludingProtocol.reducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(state, concludingSharedData, processState, concludingProtocolState);
      default:
        // TODO: This should return unreachable(state), but right now, only some protocols are
        // "whitelisted" to run as a top-level process, which means we can't
        // exhaust all options
        return state;
    }
  }
}

function updatedState(
  state: states.Initialized,
  sharedData: states.SharedData,
  processState: states.ProcessState,
  protocolState: ProtocolState,
) {
  const newState = { ...state, ...sharedData };
  const newProcessState = { ...processState, protocolState };
  newState.processStore = {
    ...newState.processStore,
    [processState.processId]: newProcessState,
  };
  return newState;
}

export function getProcessId(action: NewProcessAction): string {
  if (isStartProcessAction(action)) {
    return communication.getProcessId(action);
  } else if (action.type === INITIALIZE_CHANNEL) {
    return APPLICATION_PROCESS_ID;
  } else if ('channelId' in action) {
    return `${action.protocol}-${action.channelId}`;
  }
  throw new Error('Invalid action');
}

function initializeNewProtocol(
  state: states.Initialized,
  action: actions.protocol.NewProcessAction,
): { protocolState: ProtocolState; sharedData: states.SharedData } {
  const processId = getProcessId(action);
  const incomingSharedData = states.sharedData(state);
  switch (action.type) {
    case actions.protocol.FUNDING_REQUESTED: {
      const { channelId } = action;
      return fundProtocol.initialize(incomingSharedData, channelId, processId, action.playerIndex);
    }
    case actions.protocol.CONCLUDE_REQUESTED: {
      const { channelId } = action;
      const { protocolState, sharedData } = concludingProtocol.initializeInstigatorState(
        channelId,
        processId,
        incomingSharedData,
      );
      return { protocolState, sharedData };
    }
    case CONCLUDE_INSTIGATED: {
      const { signedCommitment } = action;
      const { protocolState, sharedData } = concludingProtocol.initializeResponderState(
        signedCommitment,
        processId,
        incomingSharedData,
      );
      return { protocolState, sharedData };
    }
    case actions.protocol.CREATE_CHALLENGE_REQUESTED: {
      const { channelId } = action;
      const { protocolState, sharedData } = initializeChallengerState(
        channelId,
        processId,
        incomingSharedData,
      );
      return { protocolState, sharedData };
    }
    case actions.protocol.CHALLENGE_CREATED:
      return initializeResponderState(
        processId,
        action.channelId,
        incomingSharedData,
        action.commitment,
      );
    case actions.protocol.INITIALIZE_CHANNEL:
      return applicationProtocol.initialize(incomingSharedData);

    default:
      return unreachable(action);
  }
}

function routeToNewProcessInitializer(
  state: states.Initialized,
  action: actions.protocol.NewProcessAction,
): states.Initialized {
  const processId = getProcessId(action);
  const { protocolState, sharedData } = initializeNewProtocol(state, action);
  return startProcess(state, sharedData, action, protocolState, processId);
}

const waitForLoginReducer = (
  state: states.WaitForLogin,
  action: actions.WalletAction,
): states.WalletState => {
  switch (action.type) {
    case actions.LOGGED_IN:
      return states.initialized({
        ...state,
        uid: action.uid,
        outboxState: accumulateSideEffects(state.outboxState, {
          messageOutbox: [initializationSuccess()],
        }),
        processStore: {},
        adjudicatorStore: {},
      });
    default:
      return state;
  }
};

function startProcess(
  state: states.Initialized,
  sharedData: states.SharedData,
  action: NewProcessAction,
  protocolState: ProtocolState,
  processId: string,
): states.Initialized {
  const newState = { ...state, ...sharedData };
  const { protocol } = action;
  newState.processStore = {
    ...newState.processStore,
    [processId]: { processId, protocolState, channelsToMonitor: [], protocol },
  };
  // TODO: Right now any new processId get sets to the current process Id.
  // We probably need a priority queue so some protocols can override another
  // IE: Responding to a challenge is higher priority than funding.
  newState.currentProcessId = processId;

  return newState;
}

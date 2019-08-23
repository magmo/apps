import { initializationSuccess } from 'magmo-wallet-client/lib/wallet-events';
import { unreachable } from '../utils/reducer-utils';
import * as actions from './actions';
import { accumulateSideEffects } from './outbox';
import { clearOutbox } from './outbox/reducer';
import { ProtocolState } from './protocols';
import { isNewProcessAction, NewProcessAction } from './protocols/actions';
import * as applicationProtocol from './protocols/application';
import * as concludingProtocol from './protocols/concluding';
import * as fundProtocol from './protocols/funding';
import * as states from './state';
import { APPLICATION_PROCESS_ID } from './protocols/application/reducer';
import { adjudicatorStateReducer } from './adjudicator-state/reducer';
import { isStartProcessAction, ProcessProtocol } from '../communication';
import * as communication from '../communication';
import { ethers } from 'ethers';
import * as closeLedgerChannelProtocol from './protocols/close-ledger-channel';
import _ from 'lodash';
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
  } else if (actions.isProtocolAction(action)) {
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
    console.warn('No process');
    return state;
  } else {
    switch (processState.protocol) {
      case ProcessProtocol.Funding:
        const { protocolState, sharedData } = fundProtocol.fundingReducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(state, sharedData, processState, protocolState, action.processId);
      case ProcessProtocol.Application:
        const {
          protocolState: appProtocolState,
          sharedData: appSharedData,
        } = applicationProtocol.reducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(state, appSharedData, processState, appProtocolState, action.processId);
      case ProcessProtocol.Concluding:
        const {
          protocolState: concludingProtocolState,
          sharedData: concludingSharedData,
        } = concludingProtocol.concludingReducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(
          state,
          concludingSharedData,
          processState,
          concludingProtocolState,
          action.processId,
        );

      case ProcessProtocol.CloseLedgerChannel:
        const {
          protocolState: closeLedgerChannelState,
          sharedData: closeLedgerChannelSharedData,
        } = closeLedgerChannelProtocol.closeLedgerChannelReducer(
          processState.protocolState,
          states.sharedData(state),
          action,
        );
        return updatedState(
          state,
          closeLedgerChannelSharedData,
          processState,
          closeLedgerChannelState,
          action.processId,
        );
      default:
        return unreachable(processState.protocol);
    }
  }
}

function updatedState(
  state: states.Initialized,
  sharedData: states.SharedData,
  processState: states.ProcessState,
  protocolState: ProtocolState,
  processId: string,
) {
  if (states.isTerminalProtocolState(protocolState)) {
    return endProcess(state, sharedData, processId);
  } else {
    const newState = { ...state, ...sharedData };
    const newProcessState = { ...processState, protocolState };
    newState.processStore = {
      ...newState.processStore,
      [processState.processId]: newProcessState,
    };
    return newState;
  }
}

export function getProcessId(action: NewProcessAction): string {
  if (isStartProcessAction(action)) {
    return communication.getProcessId(action);
  } else if (action.type === 'WALLET.NEW_PROCESS.INITIALIZE_CHANNEL') {
    return APPLICATION_PROCESS_ID;
  } else if ('channelId' in action) {
    return `${action.protocol}-${action.channelId}`;
  }
  throw new Error('Invalid action');
}

function initializeNewProtocol(
  state: states.Initialized,
  action: NewProcessAction,
): { protocolState: ProtocolState; sharedData: states.SharedData } {
  const processId = getProcessId(action);
  const incomingSharedData = states.sharedData(state);
  // TODO do not reinitialise an existing process
  switch (action.type) {
    case 'WALLET.NEW_PROCESS.FUNDING_REQUESTED': {
      const { channelId } = action;
      return fundProtocol.initializeFunding(incomingSharedData, processId, channelId);
    }
    case 'WALLET.NEW_PROCESS.CONCLUDE_REQUESTED': {
      const { channelId } = action;
      const { protocolState, sharedData } = concludingProtocol.initialize({
        channelId,
        processId,
        opponentInstigatedConclude: false,
        sharedData: incomingSharedData,
      });
      return { protocolState, sharedData };
    }
    case 'WALLET.NEW_PROCESS.CONCLUDE_INSTIGATED': {
      const { channelId } = action;
      const { protocolState, sharedData } = concludingProtocol.initialize({
        channelId,
        processId,
        opponentInstigatedConclude: true,
        sharedData: incomingSharedData,
      });
      return { protocolState, sharedData };
    }
    case 'WALLET.NEW_PROCESS.INITIALIZE_CHANNEL':
      return applicationProtocol.initialize(
        incomingSharedData,
        action.channelId,
        state.address,
        state.privateKey,
      );
    case 'WALLET.NEW_PROCESS.CLOSE_LEDGER_CHANNEL':
      return closeLedgerChannelProtocol.initializeCloseLedgerChannel(
        processId,
        action.channelId,
        incomingSharedData,
      );
    default:
      return unreachable(action);
  }
}

function routeToNewProcessInitializer(
  state: states.Initialized,
  action: NewProcessAction,
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
    case 'WALLET.LOGGED_IN':
      let { address, privateKey } = state;
      if (!address || !privateKey) {
        ({ privateKey, address } = ethers.Wallet.createRandom());
      }
      return states.initialized({
        ...state,
        uid: action.uid,
        outboxState: accumulateSideEffects(state.outboxState, {
          messageOutbox: [initializationSuccess(address)],
        }),
        processStore: {},
        privateKey,
        address,
      });
    default:
      return state;
  }
};
function endProcess(
  state: states.Initialized,
  sharedData: states.SharedData,
  processId: string,
): states.Initialized {
  const newState = _.cloneDeep({ ...state, ...sharedData });
  delete newState.processStore[processId];
  return states.removeFromPriorityQueue(newState, processId);
}

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

  return states.addToPriorityQueue(newState, {
    processId,
    priority: getProtocolPriority(protocol),
  });
}

function getProtocolPriority(protocol: ProcessProtocol): states.Priority {
  switch (protocol) {
    case ProcessProtocol.Application:
      return states.Priority.Low;
    default:
      return states.Priority.Medium;
  }
}

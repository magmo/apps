import { bigNumberify } from 'ethers/utils';
import { unreachable } from '../../../utils/reducer-utils';
import { createDepositTransaction } from '../../../utils/transaction-generator';
import * as actions from '../../actions';
import { ProtocolReducer, ProtocolStateWithSharedData } from '../../protocols';
import { SharedData } from '../../state';
import {
  initialize as initTransactionState,
  transactionReducer,
} from '../transaction-submission/reducer';
import * as states from './state';
import { isTransactionAction } from '../transaction-submission/actions';
import { isTerminal, SUCCESS } from '../transaction-submission/states';

type DFReducer = ProtocolReducer<states.DirectFundingState>;

export const directFundingStateReducer: DFReducer = (
  state: states.DirectFundingState,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (action.type === actions.FUNDING_RECEIVED_EVENT && action.channelId === state.channelId) {
    // You can always move to CHANNEL_FUNDED based on the action
    // of some arbitrary actor, so this behaviour is common regardless of the stage of
    // the state
    if (bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)) {
      return {
        protocolState: states.channelFunded(state),
        sharedData,
      };
    }
  }

  switch (state.type) {
    case states.NOT_SAFE_TO_DEPOSIT:
      return notSafeToDepositReducer(state, sharedData, action);
    case states.WAIT_FOR_DEPOSIT_TRANSACTION:
      return waitForDepositTransactionReducer(state, sharedData, action);
    case states.WAIT_FOR_FUNDING_CONFIRMATION:
      return waitForFundingConfirmationReducer(state, sharedData, action);
    case states.CHANNEL_FUNDED:
      return channelFundedReducer(state, sharedData, action);
    default:
      return unreachable(state);
  }
};

const notSafeToDepositReducer: DFReducer = (
  state: states.NotSafeToDeposit,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (
        action.channelId === state.channelId &&
        bigNumberify(action.totalForDestination).gte(state.safeToDepositLevel)
      ) {
        const depositTransaction = createDepositTransaction(
          state.channelId,
          state.requestedYourContribution,
        );

        const { storage: newSharedData, state: transactionSubmissionState } = initTransactionState(
          depositTransaction,
          `direct-funding.${action.channelId}`, // TODO: what is the correct way of fetching the process id?
          sharedData,
        );
        return {
          protocolState: states.waitForDepositTransaction(state, transactionSubmissionState),
          sharedData: newSharedData,
        };
      } else {
        return { protocolState: state, sharedData };
      }
    default:
      return { protocolState: state, sharedData };
  }
};

const waitForDepositTransactionReducer: DFReducer = (
  protocolState: states.WaitForDepositTransaction,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (!isTransactionAction(action)) {
    return { protocolState, sharedData };
  }
  const { storage: newSharedData, state: newTransactionState } = transactionReducer(
    protocolState.transactionSubmissionState,
    sharedData,
    action,
  );
  if (!isTerminal(newTransactionState)) {
    return {
      sharedData: newSharedData,
      protocolState: { ...protocolState, transactionSubmissionState: newTransactionState },
    };
  } else {
    if (newTransactionState.type === SUCCESS) {
      return {
        protocolState: states.waitForFundingConfirmation(protocolState),
        sharedData,
      };
    } else {
      // TODO: treat the transaction failure case
      return { protocolState, sharedData };
    }
  }
};

const waitForFundingConfirmationReducer: DFReducer = (
  state: states.WaitForFundingConfirmation,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  // TODO: This code path is unreachable, but the compiler doesn't know that.
  // Can we fix that?
  switch (action.type) {
    case actions.FUNDING_RECEIVED_EVENT:
      if (
        action.channelId === state.channelId &&
        bigNumberify(action.totalForDestination).gte(state.requestedTotalFunds)
      ) {
        return {
          protocolState: states.channelFunded(state),
          sharedData,
        };
      } else {
        return { protocolState: state, sharedData };
      }
    default:
      return { protocolState: state, sharedData };
  }
};
const channelFundedReducer: DFReducer = (
  state: states.ChannelFunded,
  sharedData: SharedData,
  action: actions.WalletAction,
): ProtocolStateWithSharedData<states.DirectFundingState> => {
  if (action.type === actions.FUNDING_RECEIVED_EVENT) {
    if (bigNumberify(action.totalForDestination).lt(state.requestedTotalFunds)) {
      // TODO: Deal with chain re-orgs that de-fund the channel here
      return { protocolState: state, sharedData };
    }
  }
  return { protocolState: state, sharedData };
};

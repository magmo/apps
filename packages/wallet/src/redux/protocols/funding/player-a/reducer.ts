import * as states from './states';
import * as actions from './actions';

import {
  Action as IndirectFundingAction,
  isIndirectFundingAction,
} from '../../indirect-funding/actions';
import { SharedData, queueMessage } from '../../../state';
import { ProtocolStateWithSharedData } from '../..';
import { unreachable } from '../../../../utils/reducer-utils';
import { PlayerIndex } from '../../../types';
import { showWallet } from '../../reducer-helpers';
import { fundingFailure } from 'magmo-wallet-client';
import { sendStrategyProposed } from '../../../../communication';
import {
  indirectFundingReducer,
  initialize as initializeIndirectFunding,
} from '../../indirect-funding/reducer';
import * as indirectFundingStates from '../../indirect-funding/state';
import * as selectors from '../../../selectors';
type EmbeddedAction = IndirectFundingAction;

export function initialize(
  sharedData: SharedData,
  processId: string,
  channelId: string,
  opponentAddress: string,
): ProtocolStateWithSharedData<states.FundingState> {
  return {
    protocolState: states.waitForStrategyChoice({
      processId,
      targetChannelId: channelId,
      opponentAddress,
    }),
    sharedData: showWallet(sharedData),
  };
}

export function fundingReducer(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.FundingAction | EmbeddedAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (isIndirectFundingAction(action)) {
    return handleIndirectFundingAction(state, sharedData, action);
  }

  switch (action.type) {
    case actions.STRATEGY_CHOSEN:
      return strategyChosen(state, sharedData, action);
    case actions.STRATEGY_APPROVED:
      return strategyApproved(state, sharedData, action);
    case actions.STRATEGY_REJECTED:
      return strategyRejected(state, sharedData, action);
    case actions.FUNDING_SUCCESS_ACKNOWLEDGED:
      return fundingSuccessAcknowledged(state, sharedData, action);
    case actions.CANCELLED:
      return cancelled(state, sharedData, action);
    default:
      return unreachable(action);
  }
}

function handleIndirectFundingAction(
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: IndirectFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (protocolState.type !== 'WaitForFunding') {
    console.error(
      `Funding reducer received indirect funding action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }

  const { protocolState: newProtocolState, sharedData: newSharedData } = updateFundingState(
    protocolState,
    sharedData,
    action,
  );
  if (!indirectFundingStates.isTerminal(newProtocolState.fundingState)) {
    return { protocolState: handleFundingComplete(newProtocolState), sharedData: newSharedData };
  } else {
    return { protocolState: newProtocolState, sharedData: newSharedData };
  }
}

function strategyChosen(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyChosen,
) {
  if (state.type !== states.WAIT_FOR_STRATEGY_CHOICE) {
    return { protocolState: state, sharedData };
  }
  const { processId, opponentAddress } = state;
  const { strategy } = action;
  const message = sendStrategyProposed(opponentAddress, processId, strategy);
  return {
    protocolState: states.waitForStrategyResponse({ ...state, strategy }),
    sharedData: queueMessage(sharedData, message),
  };
}

function strategyApproved(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyApproved,
) {
  if (state.type !== states.WAIT_FOR_STRATEGY_RESPONSE) {
    return { protocolState: state, sharedData };
  }
  const channelState = selectors.getChannelState(sharedData, state.targetChannelId);
  const { protocolState: fundingState, sharedData: newSharedData } = initializeIndirectFunding(
    channelState,
    sharedData,
  );
  return {
    protocolState: states.waitForFunding({ ...state, fundingState }),
    sharedData: newSharedData,
  };
}

function strategyRejected(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyRejected,
) {
  if (state.type !== states.WAIT_FOR_STRATEGY_RESPONSE) {
    return { protocolState: state, sharedData };
  }
  return { protocolState: states.waitForStrategyChoice(state), sharedData };
}

function fundingSuccessAcknowledged(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.FundingSuccessAcknowledged,
) {
  if (state.type !== states.WAIT_FOR_SUCCESS_CONFIRMATION) {
    return { protocolState: state, sharedData };
  }
  return { protocolState: states.success(), sharedData };
}

function cancelled(state: states.FundingState, sharedData: SharedData, action: actions.Cancelled) {
  if (
    state.type !== states.WAIT_FOR_STRATEGY_CHOICE &&
    state.type !== states.WAIT_FOR_STRATEGY_RESPONSE
  ) {
    return { protocolState: state, sharedData };
  }
  switch (action.by) {
    case PlayerIndex.A: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure('User refused'),
        sharedData: queueMessage(sharedData, message),
      };
    }
    case PlayerIndex.B: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure('Opponent refused'),
        sharedData: queueMessage(sharedData, message),
      };
    }
    default:
      return unreachable(action.by);
  }
}

function handleFundingComplete(
  protocolState: states.WaitForFunding,
): states.WaitForSuccessConfirmation | states.Failure {
  if (protocolState.fundingState.type === 'Success') {
    return states.waitForSuccessConfirmation(protocolState);
  } else {
    // TODO: Indirect funding should return a proper error to pass to our failure state
    return states.failure('Funding Failure');
  }
}
function updateFundingState(
  protocolState: states.WaitForFunding,
  sharedData: SharedData,
  action: IndirectFundingAction,
): ProtocolStateWithSharedData<states.WaitForFunding> {
  if (indirectFundingStates.isTerminal(protocolState.fundingState)) {
    console.error(
      `Funding reducer received indirect funding action ${
        action.type
      } but indirect funding is in terminal state ${protocolState.type}`,
    );
    return { protocolState, sharedData };
  }

  const {
    protocolState: updatedFundingState,
    sharedData: updatedSharedData,
  } = indirectFundingReducer(protocolState.fundingState, sharedData, action);

  return {
    protocolState: states.waitForFunding({ ...protocolState, fundingState: updatedFundingState }),
    sharedData: updatedSharedData,
  };
}

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
import { showWallet, hideWallet, sendFundingComplete } from '../../reducer-helpers';
import { fundingFailure } from 'magmo-wallet-client';
import { sendStrategyApproved } from '../../../../communication';
import {
  indirectFundingReducer,
  initialize as initializeIndirectFunding,
} from '../../indirect-funding/reducer';
import * as indirectFundingStates from '../../indirect-funding/state';
import * as selectors from '../../../selectors';
import { Properties } from '../../../utils';

type EmbeddedAction = IndirectFundingAction;

export function initialize(
  sharedData: SharedData,
  processId: string,
  channelId: string,
  opponentAddress: string,
): ProtocolStateWithSharedData<states.FundingState> {
  return {
    protocolState: states.waitForStrategyProposal({
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
    case actions.STRATEGY_PROPOSED:
      return strategyProposed(state, sharedData, action);
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
  if (protocolState.type !== states.WAIT_FOR_FUNDING) {
    console.error(
      `Funding reducer received indirect funding action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }

  const {
    protocolState: updatedFundingState,
    sharedData: updatedSharedData,
  } = indirectFundingReducer(protocolState.fundingState, sharedData, action);

  if (!indirectFundingStates.isTerminal(updatedFundingState)) {
    return {
      protocolState: states.waitForFunding({ ...protocolState, fundingState: updatedFundingState }),
      sharedData: updatedSharedData,
    };
  } else {
    return handleFundingComplete(protocolState, updatedFundingState, updatedSharedData);
  }
}

function strategyProposed(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyProposed,
) {
  if (state.type !== states.WAIT_FOR_STRATEGY_PROPOSAL) {
    return { protocolState: state, sharedData };
  }

  const { strategy } = action;
  return { protocolState: states.waitForStrategyApproval({ ...state, strategy }), sharedData };
}

function strategyApproved(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyApproved,
) {
  if (state.type !== states.WAIT_FOR_STRATEGY_APPROVAL) {
    return { protocolState: state, sharedData };
  }

  const { processId, opponentAddress } = state;
  const message = sendStrategyApproved(opponentAddress, processId);

  const channelState = selectors.getChannelState(sharedData, state.targetChannelId);
  const { protocolState: fundingState, sharedData: newSharedData } = initializeIndirectFunding(
    processId,
    channelState,
    sharedData,
  );
  if (indirectFundingStates.isTerminal(fundingState)) {
    console.error('Indirect funding strate initialized to terminal state.');
    return handleFundingComplete(state, fundingState, newSharedData);
  }
  return {
    protocolState: states.waitForFunding({ ...state, fundingState }),
    sharedData: queueMessage(newSharedData, message),
  };
}

function strategyRejected(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyRejected,
) {
  if (state.type !== states.WAIT_FOR_STRATEGY_APPROVAL) {
    return { protocolState: state, sharedData };
  }

  return {
    protocolState: states.waitForStrategyProposal({ ...state }),
    sharedData,
  };
}

function fundingSuccessAcknowledged(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.FundingSuccessAcknowledged,
) {
  if (state.type !== states.WAIT_FOR_SUCCESS_CONFIRMATION) {
    return { protocolState: state, sharedData };
  }
  const updatedSharedData = sendFundingComplete(sharedData, state.targetChannelId);
  return { protocolState: states.success(), sharedData: hideWallet(updatedSharedData) };
}

function cancelled(state: states.FundingState, sharedData: SharedData, action: actions.Cancelled) {
  if (
    state.type !== states.WAIT_FOR_STRATEGY_PROPOSAL &&
    state.type !== states.WAIT_FOR_STRATEGY_APPROVAL
  ) {
    return { protocolState: state, sharedData };
  }
  switch (action.by) {
    case PlayerIndex.A: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure('Opponent refused'),
        sharedData: queueMessage(sharedData, message),
      };
    }
    case PlayerIndex.B: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure('User refused'),
        sharedData: queueMessage(sharedData, message),
      };
    }
    default:
      return unreachable(action.by);
  }
}

function handleFundingComplete(
  protocolState: Properties<states.WaitForSuccessConfirmation>,
  fundingState: indirectFundingStates.IndirectFundingState,
  sharedData: SharedData,
) {
  if (fundingState.type === 'Success') {
    return {
      protocolState: states.waitForSuccessConfirmation(protocolState),
      sharedData,
    };
  } else {
    // TODO: Indirect funding should return a proper error to pass to our failure state
    return {
      protocolState: states.failure('Indirect Funding Failure'),
      sharedData,
    };
  }
}

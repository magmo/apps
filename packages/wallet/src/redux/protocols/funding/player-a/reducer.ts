import * as actions from './actions';
import * as states from './states';

import { CommitmentType } from 'fmg-core';
import { fundingFailure } from 'magmo-wallet-client';
import { ProtocolStateWithSharedData } from '../..';
import { sendStrategyProposed } from '../../../../communication';
import { unreachable } from '../../../../utils/reducer-utils';
import { getLastCommitment } from '../../../channel-store';
import * as selectors from '../../../selectors';
import { queueMessage, SharedData } from '../../../state';
import { TwoPartyPlayerIndex } from '../../../types';
import { Properties } from '../../../utils';
import {
  ExistingLedgerFundingAction,
  existingLedgerFundingReducer,
  initializeExistingLedgerFunding,
  isExistingLedgerFundingAction,
} from '../../existing-ledger-funding';
import * as existingLedgerFundingStates from '../../existing-ledger-funding/states';
import { isNewLedgerFundingAction, NewLedgerFundingAction } from '../../new-ledger-funding/actions';
import {
  initialize as initializeNewLedgerFunding,
  newLedgerFundingReducer,
} from '../../new-ledger-funding/reducer';
import * as newLedgerFundingStates from '../../new-ledger-funding/states';
import { hideWallet, sendFundingComplete, showWallet } from '../../reducer-helpers';

type EmbeddedAction = NewLedgerFundingAction;

export function initialize(
  sharedData: SharedData,
  processId: string,
  channelId: string,
  ourAddress: string,
  opponentAddress: string,
): ProtocolStateWithSharedData<states.FundingState> {
  return {
    protocolState: states.waitForStrategyChoice({
      processId,
      targetChannelId: channelId,
      opponentAddress,
      ourAddress,
    }),
    sharedData: showWallet(sharedData),
  };
}

export function fundingReducer(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.FundingAction | EmbeddedAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (isNewLedgerFundingAction(action) || isExistingLedgerFundingAction(action)) {
    return handleFundingAction(state, sharedData, action);
  }

  switch (action.type) {
    case 'WALLET.FUNDING.PLAYER_A.STRATEGY_CHOSEN':
      return strategyChosen(state, sharedData, action);
    case 'WALLET.FUNDING.STRATEGY_APPROVED':
      return strategyApproved(state, sharedData, action);
    case 'WALLET.FUNDING.PLAYER_A.STRATEGY_REJECTED':
      return strategyRejected(state, sharedData, action);
    case 'WALLET.FUNDING.PLAYER_A.FUNDING_SUCCESS_ACKNOWLEDGED':
      return fundingSuccessAcknowledged(state, sharedData, action);
    case 'WALLET.FUNDING.PLAYER_A.CANCELLED':
      return cancelled(state, sharedData, action);
    default:
      return unreachable(action);
  }
}

function handleFundingAction(
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: NewLedgerFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (protocolState.type !== 'Funding.PlayerA.WaitForFunding') {
    console.warn(
      `Funding reducer received indirect funding action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }

  if (
    isExistingLedgerFundingAction(action) &&
    existingLedgerFundingStates.isExistingLedgerFundingState(protocolState.fundingState)
  ) {
    return handleExistingLedgerFundingAction(protocolState, sharedData, action);
  } else {
    return handleNewLedgerFundingAction(protocolState, sharedData, action);
  }
}

function handleExistingLedgerFundingAction(
  protocolState: states.WaitForFunding,
  sharedData: SharedData,
  action: ExistingLedgerFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (!existingLedgerFundingStates.isExistingLedgerFundingState(protocolState.fundingState)) {
    console.error(
      `Funding reducer received indirect funding action ${
        action.type
      } but is currently in funding state ${protocolState.fundingState.type}`,
    );
    return { protocolState, sharedData };
  }
  const {
    protocolState: updatedFundingState,
    sharedData: updatedSharedData,
  } = existingLedgerFundingReducer(protocolState.fundingState, sharedData, action);

  if (!existingLedgerFundingStates.isTerminal(updatedFundingState)) {
    return {
      protocolState: states.waitForFunding({ ...protocolState, fundingState: updatedFundingState }),
      sharedData: updatedSharedData,
    };
  } else {
    return handleFundingComplete(protocolState, updatedFundingState, updatedSharedData);
  }
}

function handleNewLedgerFundingAction(
  protocolState: states.WaitForFunding,
  sharedData: SharedData,
  action: NewLedgerFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (!newLedgerFundingStates.isNewLedgerFundingState(protocolState.fundingState)) {
    console.error(
      `Funding reducer received indirect funding action ${
        action.type
      } but is currently in funding state ${protocolState.fundingState.type}`,
    );
    return { protocolState, sharedData };
  }
  const {
    protocolState: updatedFundingState,
    sharedData: updatedSharedData,
  } = newLedgerFundingReducer(protocolState.fundingState, sharedData, action);

  if (!newLedgerFundingStates.isTerminal(updatedFundingState)) {
    return {
      protocolState: states.waitForFunding({ ...protocolState, fundingState: updatedFundingState }),
      sharedData: updatedSharedData,
    };
  } else {
    return handleFundingComplete(protocolState, updatedFundingState, updatedSharedData);
  }
}

function strategyChosen(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyChosen,
) {
  if (state.type !== 'Funding.PlayerA.WaitForStrategyChoice') {
    return { protocolState: state, sharedData };
  }
  const { processId, opponentAddress } = state;
  let { strategy } = action;
  const existingLedgerChannel = selectors.getExistingLedgerChannelForParticipants(
    sharedData,
    state.ourAddress,
    state.opponentAddress,
  );
  // TODO: We probably want to let the user select this
  if (
    existingLedgerChannel &&
    getLastCommitment(existingLedgerChannel).commitmentType === CommitmentType.App
  ) {
    strategy = 'ExistingLedgerFundingStrategy';
  }
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
  if (state.type !== 'Funding.PlayerA.WaitForStrategyResponse') {
    return { protocolState: state, sharedData };
  }
  const channelState = selectors.getChannelState(sharedData, state.targetChannelId);

  if (state.strategy === 'ExistingLedgerFundingStrategy') {
    const existingLedgerChannel = selectors.getExistingLedgerChannelForParticipants(
      sharedData,
      state.ourAddress,
      state.opponentAddress,
    );
    if (
      !existingLedgerChannel ||
      getLastCommitment(existingLedgerChannel).commitmentType !== CommitmentType.App
    ) {
      throw new Error(
        `Could not find open existing ledger channel with participants ${state.ourAddress} and ${
          state.opponentAddress
        }.`,
      );
    }

    const {
      protocolState: fundingState,
      sharedData: newSharedData,
    } = initializeExistingLedgerFunding(
      state.processId,
      channelState.channelId,
      existingLedgerChannel.channelId,
      sharedData,
    );

    if (existingLedgerFundingStates.isTerminal(fundingState)) {
      console.error('Indirect funding strate initialized to terminal state.');
      return handleFundingComplete(state, fundingState, newSharedData);
    }
    return {
      protocolState: states.waitForFunding({ ...state, fundingState }),
      sharedData: newSharedData,
    };
  } else {
    const { protocolState: fundingState, sharedData: newSharedData } = initializeNewLedgerFunding(
      state.processId,
      channelState,
      sharedData,
    );
    if (newLedgerFundingStates.isTerminal(fundingState)) {
      console.error('Indirect funding strate initialized to terminal state.');
      return handleFundingComplete(state, fundingState, newSharedData);
    }
    return {
      protocolState: states.waitForFunding({ ...state, fundingState }),
      sharedData: newSharedData,
    };
  }
}

function strategyRejected(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.StrategyRejected,
) {
  if (state.type !== 'Funding.PlayerA.WaitForStrategyResponse') {
    return { protocolState: state, sharedData };
  }
  return { protocolState: states.waitForStrategyChoice(state), sharedData };
}

function fundingSuccessAcknowledged(
  state: states.FundingState,
  sharedData: SharedData,
  action: actions.FundingSuccessAcknowledged,
) {
  if (state.type !== 'Funding.PlayerA.WaitForSuccessConfirmation') {
    return { protocolState: state, sharedData };
  }
  const updatedSharedData = sendFundingComplete(sharedData, state.targetChannelId);
  return { protocolState: states.success({}), sharedData: hideWallet(updatedSharedData) };
}

function cancelled(state: states.FundingState, sharedData: SharedData, action: actions.Cancelled) {
  if (
    state.type !== 'Funding.PlayerA.WaitForStrategyChoice' &&
    state.type !== 'Funding.PlayerA.WaitForStrategyResponse'
  ) {
    return { protocolState: state, sharedData };
  }
  switch (action.by) {
    case TwoPartyPlayerIndex.A: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure({ reason: 'User refused' }),
        sharedData: queueMessage(sharedData, message),
      };
    }
    case TwoPartyPlayerIndex.B: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure({ reason: 'Opponent refused' }),
        sharedData: queueMessage(sharedData, message),
      };
    }
    default:
      return unreachable(action.by);
  }
}

function handleFundingComplete(
  protocolState: Properties<states.WaitForSuccessConfirmation>,
  fundingState:
    | newLedgerFundingStates.NewLedgerFundingState
    | existingLedgerFundingStates.ExistingLedgerFundingState,
  sharedData: SharedData,
) {
  if (
    fundingState.type === 'NewLedgerFunding.Success' ||
    fundingState.type === 'ExistingLedgerFunding.Success'
  ) {
    return {
      protocolState: states.waitForSuccessConfirmation(protocolState),
      sharedData,
    };
  } else {
    // TODO: Indirect funding should return a proper error to pass to our failure state
    return {
      protocolState: states.failure({ reason: 'Indirect Funding Failure' }),
      sharedData,
    };
  }
}

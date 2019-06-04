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
import { sendStrategyProposed } from '../../../../communication';
import {
  indirectFundingReducer,
  initialize as initializeIndirectFunding,
} from '../../indirect-funding/reducer';
import * as indirectFundingStates from '../../indirect-funding/states';
import * as selectors from '../../../selectors';
import { Properties } from '../../../utils';
import {
  initialize as initializeExistingChannelFunding,
  existingChannelFundingReducer,
} from '../../existing-channel-funding/reducer';
import * as existingChannelFundingStates from '../../existing-channel-funding/states';
import { addHex } from '../../../../utils/hex-utils';
import {
  ExistingChannelFundingAction,
  isExistingChannelFundingAction,
} from '../../existing-channel-funding/actions';
import { CommitmentType } from 'fmg-core';

type EmbeddedAction = IndirectFundingAction;

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
  if (isIndirectFundingAction(action) || isExistingChannelFundingAction(action)) {
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
  action: IndirectFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (protocolState.type !== 'Funding.PlayerA.WaitForFunding') {
    console.error(
      `Funding reducer received indirect funding action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }

  if (
    isExistingChannelFundingAction(action) &&
    existingChannelFundingStates.isExistingChannelFundingState(protocolState.fundingState)
  ) {
    return handleExistingChannelFundingAction(protocolState, sharedData, action);
  } else {
    return handleIndirectFundingAction(protocolState, sharedData, action);
  }
}

function handleExistingChannelFundingAction(
  protocolState: states.WaitForFunding,
  sharedData: SharedData,
  action: ExistingChannelFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (!existingChannelFundingStates.isExistingChannelFundingState(protocolState.fundingState)) {
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
  } = existingChannelFundingReducer(protocolState.fundingState, sharedData, action);

  if (!existingChannelFundingStates.isTerminal(updatedFundingState)) {
    return {
      protocolState: states.waitForFunding({ ...protocolState, fundingState: updatedFundingState }),
      sharedData: updatedSharedData,
    };
  } else {
    return handleFundingComplete(protocolState, updatedFundingState, updatedSharedData);
  }
}

function handleIndirectFundingAction(
  protocolState: states.WaitForFunding,
  sharedData: SharedData,
  action: IndirectFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (!indirectFundingStates.isIndirectFundingState(protocolState.fundingState)) {
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
    existingLedgerChannel.lastCommitment.commitment.commitmentType === CommitmentType.App
  ) {
    strategy = 'ExistingChannelStrategy';
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

  if (state.strategy === 'ExistingChannelStrategy') {
    const existingLedgerChannel = selectors.getExistingLedgerChannelForParticipants(
      sharedData,
      state.ourAddress,
      state.opponentAddress,
    );
    if (
      !existingLedgerChannel ||
      existingLedgerChannel.lastCommitment.commitment.commitmentType !== CommitmentType.App
    ) {
      throw new Error(
        `Could not find open existing ledger channel with participants ${state.ourAddress} and ${
          state.opponentAddress
        }.`,
      );
    }
    const total = channelState.lastCommitment.commitment.allocation.reduce(addHex);
    const {
      protocolState: fundingState,
      sharedData: newSharedData,
    } = initializeExistingChannelFunding(
      state.processId,
      channelState.channelId,
      existingLedgerChannel.channelId,
      total,
      sharedData,
    );

    if (existingChannelFundingStates.isTerminal(fundingState)) {
      console.error('Indirect funding strate initialized to terminal state.');
      return handleFundingComplete(state, fundingState, newSharedData);
    }
    return {
      protocolState: states.waitForFunding({ ...state, fundingState }),
      sharedData: newSharedData,
    };
  } else {
    const { protocolState: fundingState, sharedData: newSharedData } = initializeIndirectFunding(
      state.processId,
      channelState,
      sharedData,
    );
    if (indirectFundingStates.isTerminal(fundingState)) {
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
    case PlayerIndex.A: {
      const { targetChannelId } = state;
      const message = fundingFailure(targetChannelId, 'FundingDeclined');
      return {
        protocolState: states.failure({ reason: 'User refused' }),
        sharedData: queueMessage(sharedData, message),
      };
    }
    case PlayerIndex.B: {
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
    | indirectFundingStates.IndirectFundingState
    | existingChannelFundingStates.ExistingChannelFundingState,
  sharedData: SharedData,
) {
  if (
    fundingState.type === 'IndirectFunding.Success' ||
    fundingState.type === 'ExistingChannelFunding.Success'
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

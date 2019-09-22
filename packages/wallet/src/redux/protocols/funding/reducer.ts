import * as states from './states';
import * as helpers from '../reducer-helpers';

import { SharedData, queueMessage } from '../../state';
import { ProtocolStateWithSharedData, makeLocator, EMPTY_LOCATOR } from '..';
import { unreachable } from '../../../utils/reducer-utils';

import { showWallet, hideWallet, sendFundingComplete } from '../reducer-helpers';
import { fundingFailure } from 'magmo-wallet-client';
import { EmbeddedProtocol } from '../../../communication';

import * as ledgerFundingStates from '../ledger-funding/states';
import {
  ledgerFundingReducer,
  initializeLedgerFunding,
  LedgerFundingAction,
} from '../ledger-funding';
import * as virtualFunding from '../virtual-funding';
import {
  AdvanceChannelAction,
  advanceChannelReducer,
  initializeAdvanceChannel,
} from '../advance-channel';
import * as advanceChannelStates from '../advance-channel/states';
import { clearedToSend, routesToAdvanceChannel } from '../advance-channel/actions';
import { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from '../advance-channel/reducer';
import { routesToLedgerFunding } from '../ledger-funding/actions';
import { routesToVirtualFunding } from '../virtual-funding/actions';
import {
  FundingStrategyNegotiationState,
  TerminalFundingStrategyNegotiationState,
} from '../funding-strategy-negotiation/states';
import {
  initializeFundingStrategyNegotiation,
  fundingStrategyNegotiationReducer,
} from '../funding-strategy-negotiation';
import { FUNDING_STRATEGY_NEGOTIATION_PROTOCOL_LOCATOR } from '../../../communication/protocol-locator';
import {
  routesToFundingStrategyNegotiation,
  FundingStrategyNegotiationAction,
} from '../funding-strategy-negotiation/actions';
import * as fundingStrategyNegotiationStates from '../funding-strategy-negotiation/states';
import { ProtocolAction } from '../../actions';
import { getLastStateForChannel } from '../../selectors';

export function initialize(
  sharedData: SharedData,
  processId: string,
  channelId: string,
): ProtocolStateWithSharedData<states.FundingState> {
  const opponentAddress = helpers.getOpponentAddress(channelId, sharedData);
  const ourAddress = sharedData.address;

  let fundingStrategyNegotiationState: FundingStrategyNegotiationState;
  ({
    sharedData,
    protocolState: fundingStrategyNegotiationState,
  } = initializeFundingStrategyNegotiation({
    sharedData,
    channelId,
    processId,
    opponentAddress,
    ourAddress,
    protocolLocator: makeLocator(FUNDING_STRATEGY_NEGOTIATION_PROTOCOL_LOCATOR),
  }));

  if (fundingStrategyNegotiationStates.isTerminal(fundingStrategyNegotiationState)) {
    return handleFundingStrategyNegotiationComplete({
      fundingStrategyNegotiationState,
      sharedData,
      processId,
      targetChannelId: channelId,
      ourAddress,
      opponentAddress,
    });
  }

  return {
    protocolState: states.waitForStrategyNegotiation({
      processId,
      targetChannelId: channelId,
      opponentAddress,
      ourAddress,
      fundingStrategyNegotiationState,
    }),
    sharedData: showWallet(sharedData),
  };
}

export function fundingReducer(
  state: states.FundingState,
  sharedData: SharedData,
  action: ProtocolAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (routesToAdvanceChannel(action, EMPTY_LOCATOR)) {
    return handleAdvanceChannelAction(state, sharedData, action);
  } else if (routesToLedgerFunding(action, EMPTY_LOCATOR)) {
    return handleIndirectFundingAction(state, sharedData, action);
  } else if (routesToVirtualFunding(action, EMPTY_LOCATOR)) {
    return handleVirtualFundingAction(state, sharedData, action);
  } else if (routesToFundingStrategyNegotiation(action, EMPTY_LOCATOR)) {
    return handleFundingStrategyNegotiation(state, sharedData, action);
  } else {
    return fundingSuccessAcknowledged(state, sharedData);
  }
}
function handleFundingStrategyNegotiation(
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: FundingStrategyNegotiationAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (protocolState.type !== 'Funding.WaitForStrategyNegotiation') {
    console.warn(
      `Funding reducer received funding strategy negotiation action ${
        action.type
      } but is currently in state ${protocolState.type}`,
    );
    return { protocolState, sharedData };
  }

  let fundingStrategyNegotiationState: FundingStrategyNegotiationState;
  ({
    sharedData,
    protocolState: fundingStrategyNegotiationState,
  } = fundingStrategyNegotiationReducer(
    protocolState.fundingStrategyNegotiationState,
    sharedData,
    action,
  ));
  if (!fundingStrategyNegotiationStates.isTerminal(fundingStrategyNegotiationState)) {
    return {
      protocolState: states.waitForStrategyNegotiation({
        ...protocolState,
        fundingStrategyNegotiationState,
      }),
      sharedData,
    };
  } else {
    return handleFundingStrategyNegotiationComplete({
      ...protocolState,
      fundingStrategyNegotiationState,
      sharedData,
    });
  }
}

function handleFundingStrategyNegotiationComplete({
  processId,
  targetChannelId,
  ourAddress,
  opponentAddress,
  fundingStrategyNegotiationState,
  sharedData,
}: {
  processId: string;
  targetChannelId: string;
  ourAddress: string;
  opponentAddress: string;
  fundingStrategyNegotiationState: TerminalFundingStrategyNegotiationState;
  sharedData: SharedData;
}) {
  if (fundingStrategyNegotiationStates.isFailure(fundingStrategyNegotiationState)) {
    const message = fundingFailure(targetChannelId, 'FundingDeclined');

    return {
      protocolState: states.failure({ reason: 'FundingStrategyNegotiationFailure' }),
      sharedData: queueMessage(sharedData, message),
    };
  } else {
    let advanceChannelState: advanceChannelStates.AdvanceChannelState;
    ({ protocolState: advanceChannelState, sharedData } = initializeAdvanceChannel(sharedData, {
      channelId: targetChannelId,
      processId,
      stateType: advanceChannelStates.StateType.PostFunding,
      clearedToSend: false,
      protocolLocator: ADVANCE_CHANNEL_PROTOCOL_LOCATOR,
    }));

    switch (fundingStrategyNegotiationState.selectedFundingStrategy) {
      case 'IndirectFundingStrategy': {
        const latestState = getLastStateForChannel(sharedData, targetChannelId).state;
        let fundingState: ledgerFundingStates.LedgerFundingState;
        ({ protocolState: fundingState, sharedData } = initializeLedgerFunding({
          processId,
          channelId: targetChannelId,
          startingOutcome: latestState.outcome,
          participants: latestState.channel.participants,
          sharedData,
          protocolLocator: makeLocator(EmbeddedProtocol.LedgerFunding),
        }));
        if (fundingState.type === 'LedgerFunding.Failure') {
          return {
            protocolState: states.failure(fundingState),
            sharedData,
          };
        }
        return {
          protocolState: states.waitForLedgerFunding({
            processId,
            targetChannelId,
            ourAddress,
            fundingState,
            opponentAddress,
            postFundSetupState: advanceChannelState,
          }),
          sharedData,
        };
      }
      case 'VirtualFundingStrategy': {
        const { outcome: startingOutcome } = getLastStateForChannel(
          sharedData,
          targetChannelId,
        ).state;

        let fundingState: virtualFunding.VirtualFundingState;
        ({ protocolState: fundingState, sharedData } = virtualFunding.initializeVirtualFunding(
          sharedData,
          {
            processId,
            targetChannelId,
            startingOutcome,
            ourAddress: sharedData.address,
            // TODO: This should be an env variable
            hubAddress: '0x100063c326b27f78b2cBb7cd036B8ddE4d4FCa7C',
            protocolLocator: makeLocator(EmbeddedProtocol.VirtualFunding),
          },
        ));

        return {
          protocolState: states.waitForVirtualFunding({
            processId,
            targetChannelId,
            ourAddress,
            fundingState,
            opponentAddress,
            postFundSetupState: advanceChannelState,
          }),
          sharedData,
        };
      }
      default:
        return unreachable(fundingStrategyNegotiationState.selectedFundingStrategy);
    }
  }
}
function handleAdvanceChannelAction(
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: AdvanceChannelAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (
    protocolState.type !== 'Funding.WaitForPostFundSetup' &&
    protocolState.type !== 'Funding.WaitForLedgerFunding'
  ) {
    console.warn(
      `Funding reducer received advance channel action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }
  const result = advanceChannelReducer(protocolState.postFundSetupState, sharedData, action);
  if (!advanceChannelStates.isTerminal(result.protocolState)) {
    return {
      protocolState: { ...protocolState, postFundSetupState: result.protocolState },
      sharedData: result.sharedData,
    };
  } else if (result.protocolState.type === 'AdvanceChannel.Failure') {
    return {
      protocolState: states.failure({ reason: 'AdvanceChannelFailure' }),
      sharedData: result.sharedData,
    };
  } else {
    return {
      protocolState: states.waitForSuccessConfirmation(protocolState),
      sharedData: result.sharedData,
    };
  }
}

function handleIndirectFundingAction(
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: LedgerFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (protocolState.type !== 'Funding.WaitForLedgerFunding') {
    console.warn(
      `Funding reducer received indirect funding action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }

  const {
    protocolState: updatedFundingState,
    sharedData: updatedSharedData,
  } = ledgerFundingReducer(protocolState.fundingState, sharedData, action);

  if (!ledgerFundingStates.isTerminal(updatedFundingState)) {
    return {
      protocolState: states.waitForLedgerFunding({
        ...protocolState,
        fundingState: updatedFundingState,
      }),
      sharedData: updatedSharedData,
    };
  } else {
    return handleFundingComplete(protocolState, updatedFundingState, updatedSharedData);
  }
}

function handleVirtualFundingAction(
  protocolState: states.FundingState,
  sharedData: SharedData,
  action: virtualFunding.VirtualFundingAction,
): ProtocolStateWithSharedData<states.FundingState> {
  if (protocolState.type !== 'Funding.WaitForVirtualFunding') {
    console.warn(
      `Funding reducer received indirect funding action ${action.type} but is currently in state ${
        protocolState.type
      }`,
    );
    return { protocolState, sharedData };
  }

  const {
    protocolState: updatedFundingState,
    sharedData: updatedSharedData,
  } = virtualFunding.virtualFundingReducer(protocolState.fundingState, sharedData, action);

  if (!virtualFunding.isTerminal(updatedFundingState)) {
    return {
      protocolState: states.waitForVirtualFunding({
        ...protocolState,
        fundingState: updatedFundingState,
      }),
      sharedData: updatedSharedData,
    };
  } else {
    return handleFundingComplete(protocolState, updatedFundingState, updatedSharedData);
  }
}

function fundingSuccessAcknowledged(state: states.FundingState, sharedData: SharedData) {
  if (state.type !== 'Funding.WaitForSuccessConfirmation') {
    return { protocolState: state, sharedData };
  }
  const updatedSharedData = sendFundingComplete(sharedData, state.targetChannelId);
  return { protocolState: states.success({}), sharedData: hideWallet(updatedSharedData) };
}

function handleFundingComplete(
  protocolState: states.WaitForLedgerFunding | states.WaitForVirtualFunding,
  fundingState: ledgerFundingStates.LedgerFundingState | virtualFunding.VirtualFundingState,
  sharedData: SharedData,
) {
  switch (fundingState.type) {
    case 'LedgerFunding.Success':
    case 'VirtualFunding.Success': {
      // When funding is complete we alert the advance channel protocol that we are now cleared to exchange post fund setups
      let postFundSetupState: advanceChannelStates.AdvanceChannelState;
      ({ protocolState: postFundSetupState, sharedData } = advanceChannelReducer(
        protocolState.postFundSetupState,
        sharedData,
        clearedToSend({
          processId: protocolState.processId,
          protocolLocator: ADVANCE_CHANNEL_PROTOCOL_LOCATOR,
        }),
      ));
      return {
        protocolState: states.waitForPostFundSetup({
          ...protocolState,
          postFundSetupState,
        }),
        sharedData,
      };
    }
    default:
      // TODO: Indirect/Virtual funding should return a proper error to pass to our failure state
      return {
        protocolState: states.failure({ reason: 'Indirect Funding Failure' }),
        sharedData,
      };
  }
}

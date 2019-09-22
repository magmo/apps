import * as states from './states';
import { NewLedgerChannelState, failure } from './states';
import { SharedData, ChannelFundingState, setFundingState } from '../../state';
import { ProtocolStateWithSharedData, makeLocator } from '..';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../constants';
import { DirectFundingAction } from '../direct-funding';
import { isSuccess, isFailure, isTerminal } from '../direct-funding/states';
import {
  directFundingStateReducer,
  initialize as initializeDirectFunding,
} from '../direct-funding/reducer';
import { unreachable } from '../../../utils/reducer-utils';
import { NewLedgerChannelAction } from './actions';
import { EmbeddedProtocol, ProtocolLocator } from '../../../communication';
import * as advanceChannelState from '../advance-channel/states';
import {
  clearedToSend as advanceChannelClearedToSend,
  routesToAdvanceChannel,
} from '../advance-channel/actions';
import {
  initializeAdvanceChannel,
  isAdvanceChannelAction,
  advanceChannelReducer,
} from '../advance-channel';
import { getTwoPlayerIndex } from '../reducer-helpers';
import { ADVANCE_CHANNEL_PROTOCOL_LOCATOR } from '../advance-channel/reducer';
import { Outcome } from 'nitro-protocol/lib/src/contract/outcome';
import { encodeConsensusData } from 'nitro-protocol/lib/src/contract/consensus-data';

type ReturnVal = ProtocolStateWithSharedData<NewLedgerChannelState>;
type IDFAction = NewLedgerChannelAction;
export const NEW_LEDGER_FUNDING_PROTOCOL_LOCATOR = makeLocator(EmbeddedProtocol.NewLedgerChannel);

export function initialize({
  processId,
  chainId,
  startingOutcome,
  participants,
  challengeDuration,
  sharedData,
  protocolLocator,
}: {
  chainId: string;
  challengeDuration: string;
  processId: string;
  startingOutcome: Outcome;
  participants: string[];
  sharedData: SharedData;
  protocolLocator: ProtocolLocator;
}): ProtocolStateWithSharedData<states.NonTerminalNewLedgerChannelState | states.Failure> {
  const initializationArgs = {
    channelType: CONSENSUS_LIBRARY_ADDRESS,
    stateType: advanceChannelState.StateType.PreFunding,
    clearedToSend: true,
    processId,
    protocolLocator: makeLocator(protocolLocator, ADVANCE_CHANNEL_PROTOCOL_LOCATOR),
    participants,
    privateKey: sharedData.privateKey,
    challengeDuration,
    chainId,
    ourAddress: sharedData.address,
    appDefinition: CONSENSUS_LIBRARY_ADDRESS,
  };

  const advanceChannelResult = initializeAdvanceChannel(sharedData, {
    ...initializationArgs,

    ...channelSpecificArgs(startingOutcome),
  });
  sharedData = advanceChannelResult.sharedData;

  const protocolState = states.waitForPreFundSetup({
    processId,
    preFundSetupState: advanceChannelResult.protocolState,
    protocolLocator,
  });
  return { protocolState, sharedData };
}

export function NewLedgerChannelReducer(
  protocolState: states.NonTerminalNewLedgerChannelState,
  sharedData: SharedData,
  action: NewLedgerChannelAction,
): ReturnVal {
  switch (protocolState.type) {
    case 'NewLedgerChannel.WaitForPreFundSetup':
      return handleWaitForPreFundSetup(protocolState, sharedData, action);
    case 'NewLedgerChannel.WaitForDirectFunding':
      return handleWaitForDirectFunding(protocolState, sharedData, action);
    case 'NewLedgerChannel.WaitForPostFundSetup':
      return handleWaitForPostFundSetup(protocolState, sharedData, action);
    default:
      return unreachable(protocolState);
  }
}

function handleWaitForPostFundSetup(
  protocolState: states.WaitForPostFundSetup,
  sharedData: SharedData,
  action: IDFAction | DirectFundingAction,
): ReturnVal {
  if (!routesToAdvanceChannel(action, protocolState.protocolLocator)) {
    console.warn(`Expected an Advance Channel action received ${action.type} instead.`);
    return { protocolState, sharedData };
  }

  const advanceChannelResult = advanceChannelReducer(
    protocolState.postFundSetupState,
    sharedData,
    action,
  );
  sharedData = advanceChannelResult.sharedData;
  if (advanceChannelState.isTerminal(advanceChannelResult.protocolState)) {
    switch (advanceChannelResult.protocolState.type) {
      case 'AdvanceChannel.Failure':
        return { protocolState: failure({}), sharedData };
      case 'AdvanceChannel.Success':
        sharedData = updateFundingState(sharedData, protocolState.ledgerId);
        return {
          protocolState: states.success({
            ledgerId: protocolState.ledgerId,
          }),
          sharedData,
        };
      default:
        return unreachable(advanceChannelResult.protocolState);
    }
  } else {
    return {
      protocolState: {
        ...protocolState,
        postFundSetupState: advanceChannelResult.protocolState,
      },
      sharedData,
    };
  }
}

function handleWaitForPreFundSetup(
  protocolState: states.WaitForPreFundSetup,
  sharedData: SharedData,
  action: IDFAction | DirectFundingAction,
): ReturnVal {
  if (!isAdvanceChannelAction(action)) {
    console.warn(`Expected Advance Channel action but received ${action.type}`);
    return { protocolState, sharedData };
  }
  const preFundResult = advanceChannelReducer(protocolState.preFundSetupState, sharedData, action);
  sharedData = preFundResult.sharedData;
  if (!advanceChannelState.isTerminal(preFundResult.protocolState)) {
    return {
      protocolState: { ...protocolState, preFundSetupState: preFundResult.protocolState },
      sharedData,
    };
  } else {
    if (preFundResult.protocolState.type === 'AdvanceChannel.Failure') {
      return { protocolState: states.failure({}), sharedData };
    } else {
      const ledgerId = preFundResult.protocolState.channelId;
      // const latestState = getLastStateForChannel( sharedData,ledgerId).state;
      const safeToDepositLevel = '0x0';
      const total = '0x0';
      const requiredDeposit = '0x0;';
      // TODO: Implement this with outcomes
      // const total = latestState.allocation.reduce(addHex);
      // const requiredDeposit = isFirstPlayer(ledgerId, sharedData)
      //   ? latestState.allocation[0]
      //   : latestState.allocation[1];

      // const safeToDepositLevel = isFirstPlayer(ledgerId, sharedData)
      //   ? '0x0'
      //   : latestState.allocation[1];
      const ourIndex = getTwoPlayerIndex(ledgerId, sharedData);
      // update the state
      const directFundingState = initializeDirectFunding({
        processId: protocolState.processId,
        channelId: ledgerId,
        safeToDepositLevel,
        totalFundingRequired: total,
        requiredDeposit,
        ourIndex,
        sharedData,
        protocolLocator: makeLocator(protocolState.protocolLocator, EmbeddedProtocol.DirectFunding),
      });
      sharedData = directFundingState.sharedData;

      const advanceChannelResult = initializeAdvanceChannel(directFundingState.sharedData, {
        channelId: ledgerId,

        processId: protocolState.processId,
        stateType: advanceChannelState.StateType.PostFunding,
        clearedToSend: false,
        protocolLocator: makeLocator(
          protocolState.protocolLocator,
          ADVANCE_CHANNEL_PROTOCOL_LOCATOR,
        ),
      });
      sharedData = advanceChannelResult.sharedData;
      const newProtocolState = states.waitForDirectFunding({
        ...protocolState,
        ledgerId,
        directFundingState: directFundingState.protocolState,
        postFundSetupState: advanceChannelResult.protocolState,
      });

      return { protocolState: newProtocolState, sharedData };
    }
  }
}

function handleWaitForDirectFunding(
  protocolState: states.WaitForDirectFunding,
  sharedData: SharedData,
  action: IDFAction | DirectFundingAction,
): ReturnVal {
  if (routesToAdvanceChannel(action, protocolState.protocolLocator)) {
    const advanceChannelResult = advanceChannelReducer(
      protocolState.postFundSetupState,
      sharedData,
      action,
    );
    sharedData = advanceChannelResult.sharedData;
    return {
      protocolState: {
        ...protocolState,
        postFundSetupState: advanceChannelResult.protocolState,
      },
      sharedData,
    };
  }
  const existingDirectFundingState = protocolState.directFundingState;
  const protocolStateWithSharedData = directFundingStateReducer(
    existingDirectFundingState,
    sharedData,
    action,
  );
  const newDirectFundingState = protocolStateWithSharedData.protocolState;
  const newProtocolState = { ...protocolState, directFundingState: newDirectFundingState };
  sharedData = protocolStateWithSharedData.sharedData;

  if (!isTerminal(newDirectFundingState)) {
    return { protocolState: newProtocolState, sharedData };
  }
  if (isFailure(newDirectFundingState)) {
    return { protocolState: states.failure({}), sharedData };
  }
  if (isSuccess(newDirectFundingState)) {
    const { processId } = protocolState;
    const advanceChannelResult = advanceChannelReducer(
      protocolState.postFundSetupState,
      sharedData,
      advanceChannelClearedToSend({
        processId,
        protocolLocator: makeLocator(
          protocolState.protocolLocator,
          ADVANCE_CHANNEL_PROTOCOL_LOCATOR,
        ),
      }),
    );

    sharedData = advanceChannelResult.sharedData;

    if (advanceChannelResult.protocolState.type === 'AdvanceChannel.Success') {
      sharedData = updateFundingState(sharedData, advanceChannelResult.protocolState.channelId);
      return {
        protocolState: states.success({ ledgerId: advanceChannelResult.protocolState.channelId }),
        sharedData,
      };
    } else if (advanceChannelResult.protocolState.type === 'AdvanceChannel.Failure') {
      return {
        protocolState: states.failure({ reason: 'AdvanceChannelFailure' }),
        sharedData,
      };
    } else {
      return {
        protocolState: states.waitForPostFundSetup({
          ...protocolState,
          postFundSetupState: advanceChannelResult.protocolState,
        }),
        sharedData,
      };
    }
  }

  return { protocolState, sharedData };
}

// TODO: This should be an advance channel helper
function channelSpecificArgs(outcome: Outcome): { outcome: Outcome; appData: string } {
  return {
    outcome,

    appData: encodeConsensusData({ proposedOutcome: [], furtherVotesRequired: 0 }),
  };
}

function updateFundingState(sharedData: SharedData, ledgerId: string) {
  const ledgerFundingState: ChannelFundingState = {
    directlyFunded: true,
  };
  sharedData = setFundingState(sharedData, ledgerId, ledgerFundingState);
  return sharedData;
}

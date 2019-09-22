import { SharedData, registerChannelToMonitor } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData, ProtocolReducer, makeLocator } from '..';
import * as helpers from '../reducer-helpers';
import { TwoPartyPlayerIndex } from '../../types';
import {
  initialize as initializeDirectFunding,
  directFundingStateReducer,
} from '../direct-funding/reducer';
import { LedgerTopUpAction } from './actions';
import { isDirectFundingAction } from '../direct-funding/actions';
import {
  initializeConsensusUpdate,
  isConsensusUpdateAction,
  consensusUpdateReducer,
  ConsensusUpdateState,
} from '../consensus-update';
import { ProtocolLocator, EmbeddedProtocol } from '../../../communication';
import { CONSENSUS_UPDATE_PROTOCOL_LOCATOR } from '../consensus-update/reducer';
import { DirectFundingState } from '../direct-funding/states';
import { clearedToSend } from '../consensus-update/actions';
import { Outcome } from 'nitro-protocol/lib/src/contract/outcome';
export { LEDGER_TOP_UP_PROTOCOL_LOCATOR } from '../../../communication/protocol-locator';
export function initialize({
  processId,
  channelId,
  ledgerId,
  proposedOutcome,
  originalOutcome,
  protocolLocator,
  sharedData,
}: {
  processId: string;
  channelId: string;
  ledgerId: string;
  proposedOutcome: Outcome;
  originalOutcome: Outcome;
  protocolLocator: ProtocolLocator;
  sharedData: SharedData;
}): ProtocolStateWithSharedData<states.LedgerTopUpState> {
  sharedData = registerChannelToMonitor(sharedData, processId, ledgerId, protocolLocator);
  const { consensusUpdateState, sharedData: newSharedData } = initializeConsensusState(
    processId,
    ledgerId,
    protocolLocator,
    sharedData,
  );
  const newProtocolState = states.switchOrderAndAddATopUpUpdate({
    processId,
    ledgerId,
    channelId,
    proposedOutcome,
    originalOutcome,
    consensusUpdateState,
    protocolLocator,
  });
  return { protocolState: newProtocolState, sharedData: newSharedData };
}

const restoreOrderAndAddBTopUpUpdateReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.SwitchOrderAndAddATopUpUpdate,
  sharedData: SharedData,
  action: LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  if (!isConsensusUpdateAction(action)) {
    console.warn(`Received non consensus update action in ${protocolState.type} state.`);
    return { protocolState, sharedData };
  }
  const {
    protocolState: consensusUpdateState,
    sharedData: consensusUpdateSharedData,
  } = consensusUpdateReducer(protocolState.consensusUpdateState, sharedData, action);
  sharedData = consensusUpdateSharedData;
  const { processId, ledgerId } = protocolState;

  if (consensusUpdateState.type === 'ConsensusUpdate.Failure') {
    return {
      protocolState: states.failure({ reason: 'ConsensusUpdateFailure' }),
      sharedData: consensusUpdateSharedData,
    };
  } else if (consensusUpdateState.type === 'ConsensusUpdate.Success') {
    // TODO: Reimplement this with outcomes
    // If player B already has enough funds then skip to success
    // if (bigNumberify(originalAllocation[PlayerIndex.B]).gte(proposedAllocation[PlayerIndex.B])) {
    if (false) {
      return { protocolState: states.success({}), sharedData: consensusUpdateSharedData };
    }
    const {
      directFundingState,
      sharedData: directFundingSharedData,
    } = initializeDirectFundingState(
      processId,
      ledgerId,
      makeLocator(protocolState.protocolLocator, EmbeddedProtocol.DirectFunding),
      sharedData,
    );

    return {
      protocolState: states.waitForDirectFundingForB({ ...protocolState, directFundingState }),
      sharedData: directFundingSharedData,
    };
  } else {
    return {
      protocolState: states.restoreOrderAndAddBTopUpUpdate({
        ...protocolState,
        consensusUpdateState,
      }),
      sharedData,
    };
  }
};
const switchOrderAndAddATopUpUpdateReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.SwitchOrderAndAddATopUpUpdate,
  sharedData: SharedData,
  action: LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  if (!isConsensusUpdateAction(action)) {
    console.warn(`Received non consensus update action in ${protocolState.type} state.`);
    return { protocolState, sharedData };
  }

  let consensusUpdateState: ConsensusUpdateState;
  ({ protocolState: consensusUpdateState, sharedData } = consensusUpdateReducer(
    protocolState.consensusUpdateState,
    sharedData,
    action,
  ));

  const { processId, ledgerId } = protocolState;

  if (consensusUpdateState.type === 'ConsensusUpdate.Failure') {
    return {
      protocolState: states.failure({ reason: 'ConsensusUpdateFailure' }),
      sharedData,
    };
  } else if (consensusUpdateState.type === 'ConsensusUpdate.Success') {
    const playerAFunded = true;
    // TODO: Redo this with outcomes
    // const playerAFunded = bigNumberify(originalAllocation[TwoPartyPlayerIndex.A]).gte(
    //   proposedAllocation[TwoPartyPlayerIndex.A],
    // );

    ({ consensusUpdateState, sharedData } = initializeConsensusState(
      processId,
      ledgerId,
      protocolState.protocolLocator,
      sharedData,
    ));
    if (playerAFunded) {
      return {
        protocolState: states.restoreOrderAndAddBTopUpUpdate({
          ...protocolState,
          consensusUpdateState,
        }),
        sharedData,
      };
    }
    let directFundingState: DirectFundingState;
    ({ directFundingState, sharedData } = initializeDirectFundingState(
      processId,
      ledgerId,
      protocolState.protocolLocator,
      sharedData,
    ));

    return {
      protocolState: states.waitForDirectFundingForA({
        ...protocolState,
        directFundingState,
        consensusUpdateState,
      }),
      sharedData,
    };
  } else {
    return {
      protocolState: states.switchOrderAndAddATopUpUpdate({
        ...protocolState,
        consensusUpdateState,
      }),
      sharedData,
    };
  }
};
const waitForDirectFundingForAReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.WaitForDirectFundingForA,
  sharedData: SharedData,
  action: LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  if (isDirectFundingAction(action)) {
    let directFundingState: DirectFundingState;
    ({ protocolState: directFundingState, sharedData } = directFundingStateReducer(
      protocolState.directFundingState,
      sharedData,
      action,
    ));

    const { protocolLocator, processId } = protocolState;
    switch (directFundingState.type) {
      case 'DirectFunding.FundingFailure':
        return { protocolState: states.failure({ reason: 'DirectFundingFailure' }), sharedData };
      case 'DirectFunding.FundingSuccess':
        let consensusUpdateState: ConsensusUpdateState;
        ({ protocolState: consensusUpdateState, sharedData } = consensusUpdateReducer(
          protocolState.consensusUpdateState,
          sharedData,
          clearedToSend({
            protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
            processId,
          }),
        ));
        return {
          protocolState: states.restoreOrderAndAddBTopUpUpdate({
            ...protocolState,
            consensusUpdateState,
          }),
          sharedData,
        };
      default:
        return { protocolState: { ...protocolState, directFundingState }, sharedData };
    }
  } else if (isConsensusUpdateAction(action)) {
    let consensusUpdateState: ConsensusUpdateState;
    ({ protocolState: consensusUpdateState, sharedData } = consensusUpdateReducer(
      protocolState.consensusUpdateState,
      sharedData,
      action,
    ));
    return { protocolState: { ...protocolState, consensusUpdateState }, sharedData };
  } else {
    return { protocolState, sharedData };
  }
};

const waitForDirectFundingForBReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.WaitForDirectFundingForB,
  sharedData: SharedData,
  action: LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  if (!isDirectFundingAction(action)) {
    console.warn(`Received non direct funding action in ${protocolState.type} state.`);
    return { protocolState, sharedData };
  }

  const {
    protocolState: directFundingState,
    sharedData: directFundingSharedData,
  } = directFundingStateReducer(protocolState.directFundingState, sharedData, action);

  sharedData = directFundingSharedData;

  if (directFundingState.type === 'DirectFunding.FundingFailure') {
    return { protocolState: states.failure({ reason: 'DirectFundingFailure' }), sharedData };
  } else if (directFundingState.type === 'DirectFunding.FundingSuccess') {
    return { protocolState: states.success({}), sharedData };
  } else {
    return { protocolState: { ...protocolState, directFundingState }, sharedData };
  }
};

export const ledgerTopUpReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.LedgerTopUpState,
  sharedData: SharedData,
  action: LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  switch (protocolState.type) {
    case 'LedgerTopUp.SwitchOrderAndAddATopUpUpdate':
      return switchOrderAndAddATopUpUpdateReducer(protocolState, sharedData, action);
    case 'LedgerTopUp.WaitForDirectFundingForA':
      return waitForDirectFundingForAReducer(protocolState, sharedData, action);
    case 'LedgerTopUp.RestoreOrderAndAddBTopUpUpdate':
      return restoreOrderAndAddBTopUpUpdateReducer(protocolState, sharedData, action);
    case 'LedgerTopUp.WaitForDirectFundingForB':
      return waitForDirectFundingForBReducer(protocolState, sharedData, action);
    default:
      return { protocolState, sharedData };
  }
};

function initializeDirectFundingState(
  processId: string,
  ledgerId: string,
  protocolLocator: ProtocolLocator,
  sharedData: SharedData,
) {
  const isFirstPlayer = helpers.isFirstPlayer(ledgerId, sharedData);

  const requiredDeposit = '0x0';
  // TODO: Reimplement this with outcomes
  // if (playerFor === TwoPartyPlayerIndex.A && isFirstPlayer) {
  //   requiredDeposit = subHex(
  //     proposedAllocation[TwoPartyPlayerIndex.A],
  //     originalAllocation[TwoPartyPlayerIndex.A],
  //   );
  // } else if (playerFor === TwoPartyPlayerIndex.B && !isFirstPlayer) {
  //   requiredDeposit = subHex(
  //     proposedAllocation[TwoPartyPlayerIndex.B],
  //     originalAllocation[TwoPartyPlayerIndex.B],
  //   );
  // }

  // let totalFundingRequired = '0x0';
  // if (playerFor === TwoPartyPlayerIndex.A) {
  //   totalFundingRequired = addHex(
  //     proposedAllocation[TwoPartyPlayerIndex.A],
  //     originalAllocation[TwoPartyPlayerIndex.B],
  //   );
  // } else if (playerFor === TwoPartyPlayerIndex.B) {
  //   totalFundingRequired = proposedAllocation.reduce(addHex);
  // }

  const { protocolState: directFundingState, sharedData: newSharedData } = initializeDirectFunding({
    processId,
    channelId: ledgerId,
    safeToDepositLevel: '0x0', // Since we only have one player depositing we can always deposit right away
    requiredDeposit,
    totalFundingRequired: '0x0', // TODO: Update this once outcome changes are made
    ourIndex: isFirstPlayer ? TwoPartyPlayerIndex.A : TwoPartyPlayerIndex.B,
    sharedData,
    protocolLocator: makeLocator(protocolLocator, EmbeddedProtocol.DirectFunding),
  });
  return { directFundingState, sharedData: newSharedData };
}

function initializeConsensusState(
  processId: string,
  ledgerId: string,
  protocolLocator: ProtocolLocator,
  sharedData: SharedData,
) {
  // TODO: Redo with outcomes
  // let newAllocation;
  // let newDestination;
  // // For player A we want to move their top-upped deposit to the end and leave player B's as is
  // if (playerFor === TwoPartyPlayerIndex.A) {
  //   const currentAllocationForA = currentAllocation[TwoPartyPlayerIndex.A];
  //   const proposedAllocationForA = proposedAllocation[TwoPartyPlayerIndex.A];

  //   const newAllocationForA = bigNumberify(currentAllocationForA).gte(proposedAllocationForA)
  //     ? currentAllocationForA
  //     : proposedAllocationForA;

  //   newAllocation = [currentAllocation[TwoPartyPlayerIndex.B], newAllocationForA];
  //   newDestination = [
  //     proposedDestination[TwoPartyPlayerIndex.B],
  //     proposedDestination[TwoPartyPlayerIndex.A],
  //   ];
  // } else {
  //   // When we're handling this for player B the allocation has already been flipped, so our current value is first in the allocation
  //   const currentAllocationForB = currentAllocation[0];
  //   const currentAllocationForA = currentAllocation[1];
  //   const proposedAllocationForB = proposedAllocation[TwoPartyPlayerIndex.B];

  //   const newAllocationForB = bigNumberify(currentAllocationForB).gte(proposedAllocationForB)
  //     ? currentAllocationForB
  //     : proposedAllocationForB;
  //   // For Player B we're restoring the original order of [A,B]
  //   newAllocation = [currentAllocationForA, newAllocationForB];
  //   newDestination = proposedDestination;
  // }
  const newOutcome: Outcome = [];
  const {
    protocolState: consensusUpdateState,
    sharedData: newSharedData,
  } = initializeConsensusUpdate({
    processId,
    channelId: ledgerId,
    clearedToSend: true,
    proposedOutcome: newOutcome,
    protocolLocator: makeLocator(protocolLocator, CONSENSUS_UPDATE_PROTOCOL_LOCATOR),
    sharedData,
  });
  return { consensusUpdateState, sharedData: newSharedData };
}

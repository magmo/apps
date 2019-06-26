import { SharedData } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import * as helpers from '../reducer-helpers';
import { TwoPartyPlayerIndex } from '../../types';
import {
  initialize as initializeDirectFunding,
  directFundingStateReducer,
} from '../direct-funding/reducer';
import { LedgerTopUpAction } from './actions';
import { directFundingRequested, isDirectFundingAction } from '../direct-funding/actions';
import { addHex } from '../../../utils/hex-utils';
import {
  initializeConsensusUpdate,
  isConsensusUpdateAction,
  consensusUpdateReducer,
} from '../consensus-update';
import { bigNumberify } from 'ethers/utils';
export const LEDGER_TOP_UP_PROTOCOL_LOCATOR = 'LedgerTopUp';
export function initialize(
  processId: string,
  channelId: string,
  ledgerId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.LedgerTopUpState> {
  const lastCommitment = helpers.getLatestCommitment(ledgerId, sharedData);
  const { consensusUpdateState, sharedData: newSharedData } = initializeConsensusState(
    TwoPartyPlayerIndex.A,
    processId,
    ledgerId,
    proposedAllocation,
    proposedDestination,
    lastCommitment.allocation,

    sharedData,
  );
  const newProtocolState = states.switchOrderAndAddATopUpUpdate({
    processId,
    ledgerId,
    channelId,
    proposedAllocation,
    proposedDestination,
    consensusUpdateState,
    originalAllocation: lastCommitment.allocation,
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
  const { proposedAllocation, processId, ledgerId, originalAllocation } = protocolState;
  const lastCommitment = helpers.getLatestCommitment(protocolState.ledgerId, sharedData);
  if (consensusUpdateState.type === 'ConsensusUpdate.Failure') {
    return {
      protocolState: states.failure({ reason: 'ConsensusUpdateFailure' }),
      sharedData: consensusUpdateSharedData,
    };
  } else if (consensusUpdateState.type === 'ConsensusUpdate.Success') {
    const total = lastCommitment.allocation.reduce(addHex);
    const {
      directFundingState,
      sharedData: directFundingSharedData,
    } = initializeDirectFundingState(
      TwoPartyPlayerIndex.B,
      processId,
      ledgerId,
      total,
      proposedAllocation,
      originalAllocation,
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
  const {
    protocolState: consensusUpdateState,
    sharedData: consensusUpdateSharedData,
  } = consensusUpdateReducer(protocolState.consensusUpdateState, sharedData, action);
  sharedData = consensusUpdateSharedData;

  const { proposedAllocation, processId, ledgerId, originalAllocation } = protocolState;
  const lastCommitment = helpers.getLatestCommitment(protocolState.ledgerId, sharedData);

  if (consensusUpdateState.type === 'ConsensusUpdate.Failure') {
    return {
      protocolState: states.failure({ reason: 'ConsensusUpdateFailure' }),
      sharedData: consensusUpdateSharedData,
    };
  } else if (consensusUpdateState.type === 'ConsensusUpdate.Success') {
    const total = lastCommitment.allocation.reduce(addHex);
    const {
      directFundingState,
      sharedData: directFundingSharedData,
    } = initializeDirectFundingState(
      TwoPartyPlayerIndex.A,
      processId,
      ledgerId,
      total,
      proposedAllocation,
      originalAllocation,
      sharedData,
    );
    return {
      protocolState: states.waitForDirectFundingForA({ ...protocolState, directFundingState }),
      sharedData: directFundingSharedData,
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
  if (!isDirectFundingAction(action)) {
    console.warn(`Received non direct funding action in ${protocolState.type} state.`);
    return { protocolState, sharedData };
  }

  const {
    protocolState: directFundingState,
    sharedData: directFundingSharedData,
  } = directFundingStateReducer(protocolState.directFundingState, sharedData, action);

  sharedData = directFundingSharedData;

  const lastCommitment = helpers.getLatestCommitment(protocolState.ledgerId, sharedData);
  const { ledgerId, processId, proposedAllocation, proposedDestination } = protocolState;

  if (directFundingState.type === 'DirectFunding.FundingFailure') {
    return { protocolState: states.failure({ reason: 'DirectFundingFailure' }), sharedData };
  } else if (directFundingState.type === 'DirectFunding.FundingSuccess') {
    const { consensusUpdateState, sharedData: newSharedData } = initializeConsensusState(
      TwoPartyPlayerIndex.B,
      processId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
      lastCommitment.allocation,
      sharedData,
    );

    const newProtocolState = states.restoreOrderAndAddBTopUpUpdate({
      ...protocolState,
      consensusUpdateState,
    });
    return {
      protocolState: newProtocolState,
      sharedData: newSharedData,
    };
  } else {
    return { protocolState: { ...protocolState, directFundingState }, sharedData };
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
  playerFor: TwoPartyPlayerIndex,
  processId: string,
  ledgerId: string,
  total: string,
  proposedAllocation: string[],
  originalAllocation: string[],
  sharedData: SharedData,
) {
  const isFirstPlayer = helpers.isFirstPlayer(ledgerId, sharedData);

  let requiredDeposit;
  if (playerFor === TwoPartyPlayerIndex.A && isFirstPlayer) {
    requiredDeposit = bigNumberify(proposedAllocation[TwoPartyPlayerIndex.A])
      .sub(originalAllocation[TwoPartyPlayerIndex.A])
      .toHexString();
  } else if (playerFor === TwoPartyPlayerIndex.B && !isFirstPlayer) {
    requiredDeposit = bigNumberify(proposedAllocation[TwoPartyPlayerIndex.B])
      .sub(originalAllocation[TwoPartyPlayerIndex.B])
      .toHexString();
  } else {
    requiredDeposit = '0x0';
  }

  const directFundingAction = directFundingRequested({
    processId,
    channelId: ledgerId,
    safeToDepositLevel: '0x0',
    requiredDeposit,
    totalFundingRequired: total,
    ourIndex: isFirstPlayer ? TwoPartyPlayerIndex.A : TwoPartyPlayerIndex.B,
    exchangePostFundSetups: false,
  });

  const { protocolState: directFundingState, sharedData: newSharedData } = initializeDirectFunding(
    directFundingAction,
    sharedData,
  );
  return { directFundingState, sharedData: newSharedData };
}

function initializeConsensusState(
  playerFor: TwoPartyPlayerIndex,
  processId: string,
  ledgerId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  currentAllocation: string[],

  sharedData: SharedData,
) {
  let newAllocation;
  let newDestination;
  // For player A we want to move their top-upped deposit to the end and leave player B's as is
  if (playerFor === TwoPartyPlayerIndex.A) {
    newAllocation = [
      currentAllocation[TwoPartyPlayerIndex.B],
      proposedAllocation[TwoPartyPlayerIndex.A],
    ];
    newDestination = proposedDestination.reverse();
  } else {
    // For Player B we want to restore the order and use both updated deposits (since player A is already done with their top-up)
    newAllocation = [
      currentAllocation[TwoPartyPlayerIndex.A],
      proposedAllocation[TwoPartyPlayerIndex.B],
    ];
    newDestination = proposedDestination;
  }
  const {
    protocolState: consensusUpdateState,
    sharedData: newSharedData,
  } = initializeConsensusUpdate(processId, ledgerId, newAllocation, newDestination, sharedData);
  return { consensusUpdateState, sharedData: newSharedData };
}

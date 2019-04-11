import * as states from './state';
import * as channelState from '../../channel-state/state';

import * as actions from '../../actions';

import * as selectors from '../../selectors';

import { unreachable } from '../../../utils/reducer-utils';
import { PlayerIndex } from '../../types';

import { Channel } from 'fmg-core';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';
import {
  appChannelIsWaitingForFunding,
  receiveOpponentLedgerCommitment,
  safeToSendLedgerUpdate,
  createAndSendPostFundCommitment,
  ledgerChannelFundsAppChannel,
  confirmFundingForChannel,
  createCommitmentMessageRelay,
  receiveOwnLedgerCommitment,
  receiveLedgerCommitment,
  queueMessage,
  initializeChannelState,
} from '../reducer-helpers';
import {
  composePreFundCommitment,
  composeLedgerUpdateCommitment,
} from '../../../utils/commitment-utils';
import { WalletEvent } from 'magmo-wallet-client';
import { isfundingAction } from '../../direct-funding-store/direct-funding-state/actions';
import { addHex } from '../../../utils/hex-utils';
import { ProtocolStateWithSharedData, SharedData } from '../../protocols';

export function playerAReducer(
  state: ProtocolStateWithSharedData<states.PlayerAState>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerAState> {
  switch (state.protocolState.type) {
    case states.WAIT_FOR_APPROVAL:
      return waitForApprovalReducer(
        state as ProtocolStateWithSharedData<states.WaitForApproval>,
        action,
      );
    case states.WAIT_FOR_PRE_FUND_SETUP_1:
      return waitForPreFundSetup1Reducer(
        state as ProtocolStateWithSharedData<states.WaitForPreFundSetup1>,
        action,
      );
    case states.WAIT_FOR_DIRECT_FUNDING:
      return waitForDirectFunding(
        state as ProtocolStateWithSharedData<states.WaitForDirectFunding>,
        action,
      );
    case states.WAIT_FOR_POST_FUND_SETUP_1:
      return waitForPostFundSetup1Reducer(
        state as ProtocolStateWithSharedData<states.WaitForPostFundSetup1>,
        action,
      );
    case states.WAIT_FOR_LEDGER_UPDATE_1:
      return waitForLedgerUpdateReducer(
        state as ProtocolStateWithSharedData<states.WaitForLedgerUpdate1>,
        action,
      );
    default:
      return unreachable(state.protocolState);
  }
}

const waitForLedgerUpdateReducer = (
  state: ProtocolStateWithSharedData<states.WaitForLedgerUpdate1>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerAState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { sharedData, protocolState } = state;
      // Update ledger state
      let newSharedData = receiveOpponentLedgerCommitment(
        sharedData,
        action.commitment,
        action.signature,
      );
      newSharedData = createAndSendFinalUpdateCommitment(
        newSharedData,
        protocolState.channelId,
        protocolState.ledgerId,
      );
      if (
        ledgerChannelFundsAppChannel(newSharedData, protocolState.channelId, protocolState.ledgerId)
      ) {
        newSharedData = confirmFundingForChannel(newSharedData, protocolState.channelId);
      }
      return { protocolState, sharedData: newSharedData };
    default:
      return state;
  }
};

const waitForPostFundSetup1Reducer = (
  state: ProtocolStateWithSharedData<states.WaitForPostFundSetup1>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerAState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { sharedData, protocolState } = state;
      let newSharedData = receiveLedgerCommitment(sharedData, action);

      if (safeToSendLedgerUpdate(newSharedData, protocolState.ledgerId)) {
        newSharedData = createAndSendFirstUpdateCommitment(
          newSharedData,
          protocolState.channelId,
          protocolState.ledgerId,
        );
        const newProtocolState = states.waitForLedgerUpdate1(protocolState);
        return { protocolState: newProtocolState, sharedData: newSharedData };
      }

      return { protocolState, sharedData: newSharedData };

    default:
      return state;
  }
};

const waitForDirectFunding = (
  state: ProtocolStateWithSharedData<states.WaitForDirectFunding>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerAState> => {
  // Funding events currently occur directly against the ledger channel
  if (!isfundingAction(action)) {
    return state;
  } else {
    const { protocolState, sharedData } = state;
    // TODO: We need to add the direct funding to the state.
    // let newDirectFundingState = updateDirectFundingStatus(protocolState.directFunding, action);
    if (directFundingIsComplete(protocolState)) {
      let newSharedData = confirmFundingForChannel(sharedData, protocolState.ledgerId);
      newSharedData = createAndSendPostFundCommitment(newSharedData, protocolState.ledgerId);
      const newProtocolState = states.waitForPostFundSetup1(protocolState);
      return { protocolState: newProtocolState, sharedData: newSharedData };
    } else {
      return state;
    }
  }
};

const waitForPreFundSetup1Reducer = (
  state: ProtocolStateWithSharedData<states.WaitForPreFundSetup1>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerAState> => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { protocolState, sharedData } = state;
      const newSharedData = receiveOpponentLedgerCommitment(
        sharedData,
        action.commitment,
        action.signature,
      );
      if (appChannelIsWaitingForFunding(newSharedData, protocolState.channelId)) {
        // TODO: Request direct funding
        // newSharedData = requestDirectFunding(protocolState.directFundingState,newSharedData, protocolState.ledgerId)
        const newProtocolState = states.waitForDirectFunding(protocolState);
        return { protocolState: newProtocolState, sharedData: newSharedData };
      }
      return { protocolState, sharedData: newSharedData };
    default:
      return state;
  }
};

const waitForApprovalReducer = (
  state: ProtocolStateWithSharedData<states.WaitForApproval>,
  action: actions.indirectFunding.Action,
): ProtocolStateWithSharedData<states.PlayerAState> => {
  switch (action.type) {
    case actions.indirectFunding.playerA.STRATEGY_APPROVED:
      const { protocolState, sharedData } = state;
      const appChannelState = selectors.getOpenedChannelState(
        sharedData.channelState,
        action.channelId,
      );

      const { ledgerChannelState, preFundSetupMessage } = createLedgerChannel(
        action.consensusLibrary,
        appChannelState,
      );
      let newSharedData = initializeChannelState(sharedData, ledgerChannelState);
      newSharedData = queueMessage(newSharedData, preFundSetupMessage);

      const newProtocolState = states.waitForPreFundSetup1({
        channelId: protocolState.channelId,
        ledgerId: ledgerChannelState.channelId,
      });

      return { protocolState: newProtocolState, sharedData: newSharedData };
    default:
      return state;
  }
};

const directFundingIsComplete = (protocolState: states.WaitForDirectFunding): boolean => {
  return true;
  // TODO: Handle this when direct funding is defined on the state.
  // return protocolState.directFundingStatus === CHANNEL_FUNDED;
};
const createAndSendFinalUpdateCommitment = (
  sharedData: SharedData,
  appChannelId: string,
  ledgerChannelId: string,
): SharedData => {
  const appChannelState = selectors.getOpenedChannelState(sharedData.channelState, appChannelId);
  const proposedAllocation = [appChannelState.lastCommitment.commitment.allocation.reduce(addHex)];
  const proposedDestination = [appChannelState.channelId];
  const ledgerChannelState = selectors.getOpenedChannelState(
    sharedData.channelState,
    ledgerChannelId,
  );
  const { channel } = ledgerChannelState.lastCommitment.commitment;
  const { commitment, signature } = composeLedgerUpdateCommitment(
    channel,
    ledgerChannelState.turnNum + 1,
    ledgerChannelState.ourIndex,
    proposedAllocation,
    proposedDestination,
    proposedAllocation,
    proposedDestination,
    ledgerChannelState.privateKey,
  );

  // Update our ledger channel with the latest commitment
  const newSharedData = receiveOwnLedgerCommitment(sharedData, commitment);

  // Send out the commitment to the opponent
  newSharedData.outboxState.messageOutbox = [
    createCommitmentMessageRelay(
      ledgerChannelState.participants[PlayerIndex.B],
      appChannelId,
      commitment,
      signature,
    ),
  ];
  return newSharedData;
};

const createAndSendFirstUpdateCommitment = (
  sharedData: SharedData,
  appChannelId: string,
  ledgerChannelId: string,
): SharedData => {
  const appChannelState = selectors.getOpenedChannelState(sharedData.channelState, appChannelId);
  const proposedAllocation = [appChannelState.lastCommitment.commitment.allocation.reduce(addHex)];
  const proposedDestination = [appChannelState.channelId];
  // Compose the update commitment
  const ledgerChannelState = selectors.getOpenedChannelState(
    sharedData.channelState,
    ledgerChannelId,
  );
  const { channel, allocation, destination } = ledgerChannelState.lastCommitment.commitment;
  const { commitment, signature } = composeLedgerUpdateCommitment(
    channel,
    ledgerChannelState.turnNum + 1,
    ledgerChannelState.ourIndex,
    proposedAllocation,
    proposedDestination,
    allocation,
    destination,
    ledgerChannelState.privateKey,
  );

  // Update our ledger channel with the latest commitment
  const newSharedData = receiveOwnLedgerCommitment(sharedData, commitment);

  // Send out the commitment to the opponent
  newSharedData.outboxState.messageOutbox = [
    createCommitmentMessageRelay(
      ledgerChannelState.participants[PlayerIndex.B],
      appChannelId,
      commitment,
      signature,
    ),
  ];
  return newSharedData;
};

const createLedgerChannel = (
  consensusLibrary: string,
  appChannelState: channelState.OpenedState,
): { ledgerChannelState: channelState.WaitForPreFundSetup; preFundSetupMessage: WalletEvent } => {
  // 1. Determine ledger channel properties
  const nonce = 4; // TODO: Make random
  const { participants, address, privateKey } = appChannelState;
  const channelType = consensusLibrary;
  const ledgerChannel: Channel = { channelType, nonce, participants };
  const ledgerChannelId = channelID(ledgerChannel);
  const { allocation, destination } = appChannelState.lastCommitment.commitment;

  // 2. Create preFundSetupMessage
  const preFundSetupCommitment = composePreFundCommitment(
    ledgerChannel,
    allocation,
    destination,
    appChannelState.ourIndex,
    appChannelState.privateKey,
  );

  // 3. Create the channel state
  const ledgerChannelState = channelState.waitForPreFundSetup({
    address,
    privateKey,
    channelId: ledgerChannelId,
    libraryAddress: channelType,
    ourIndex: 0,
    participants,
    channelNonce: nonce,
    turnNum: 0,
    lastCommitment: preFundSetupCommitment,
    funded: false,
  });

  const { commitment, signature } = preFundSetupCommitment;
  const preFundSetupMessage = createCommitmentMessageRelay(
    appChannelState.participants[PlayerIndex.B],
    appChannelState.channelId,
    commitment,
    signature,
  );

  return { ledgerChannelState, preFundSetupMessage };
};

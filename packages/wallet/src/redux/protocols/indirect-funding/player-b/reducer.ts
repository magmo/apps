import * as states from '../state';
import { PlayerBState } from '../state';

import * as actions from '../../../actions';

import { unreachable } from '../../../../utils/reducer-utils';
import { channelID } from 'fmg-core/lib/channel';

import {
  appChannelIsWaitingForFunding,
  receiveOpponentLedgerCommitment,
  safeToSendLedgerUpdate,
  createAndSendUpdateCommitment,
  confirmFundingForChannel,
  updateDirectFundingStatus,
  requestDirectFunding,
  receiveOwnCommitment,
  createCommitmentMessageRelay,
  initializeChannelState,
  queueMessage,
  directFundingIsComplete,
} from '../reducer-helpers';
import { ProtocolStateWithSharedData } from '../../';
import { FundingAction, isDirectFundingAction } from '../../direct-funding/actions';
import * as channelState from '../../../channel-state/state';
import { Commitment } from 'fmg-core/lib/commitment';
import {
  composePreFundCommitment,
  composePostFundCommitment,
} from '../../../../utils/commitment-utils';
import { PlayerIndex } from '../../../types';
import * as selectors from '../../../selectors';
import { SharedData } from '../../../state';
import { IndirectFundingState } from '../state';

type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

export function initialize(channelId: string, sharedData: SharedData): ReturnVal {
  // todo: check that channel exists?
  return { protocolState: states.bWaitForPreFundSetup0({ channelId }), sharedData };
}

export function playerBReducer(
  protocolState: PlayerBState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal {
  switch (protocolState.type) {
    case 'BWaitForPreFundSetup0':
      return waitForPreFundSetup0(protocolState, sharedData, action);
    case 'BWaitForDirectFunding':
      return waitForDirectFunding(protocolState, sharedData, action);
    case 'BWaitForLedgerUpdate0':
      return waitForLedgerUpdate0(protocolState, sharedData, action);
    case 'BWaitForPostFundSetup0':
      return waitForPostFundSetup0(protocolState, sharedData, action);
    default:
      return unreachable(protocolState);
  }
}

const waitForPreFundSetup0 = (
  protocolState: states.BWaitForPreFundSetup0,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      const { commitment, signature } = action;

      // todo: check the properties of the created ledger channel
      let newSharedData = createLedgerChannel(
        protocolState.channelId,
        sharedData,
        commitment,
        signature,
      );
      newSharedData = respondWithPreFundSetup(protocolState.channelId, commitment, newSharedData);

      const ledgerId = channelID(commitment.channel);
      if (appChannelIsWaitingForFunding(newSharedData, protocolState.channelId)) {
        return startDirectFunding(protocolState, ledgerId, newSharedData);
      }

      return { protocolState, sharedData: newSharedData };
    default:
      return { protocolState, sharedData };
  }
};

const waitForDirectFunding = (
  protocolState: states.BWaitForDirectFunding,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal => {
  if (!isDirectFundingAction(action)) {
    return { sharedData, protocolState };
  } else {
    const updatedStateAndSharedData = updateStateWithDirectFundingAction(
      action,
      protocolState,
      sharedData,
    );

    let newSharedData = updatedStateAndSharedData.sharedData;
    let newProtocolState: PlayerBState = updatedStateAndSharedData.protocolState;

    if (directFundingIsComplete(newProtocolState.directFundingState)) {
      newSharedData = confirmFundingForChannel(newSharedData, protocolState.channelId);
      newProtocolState = states.bWaitForLedgerUpdate0(updatedStateAndSharedData.protocolState);
      return { protocolState: newProtocolState, sharedData: newSharedData };
    } else {
      return { sharedData, protocolState: newProtocolState };
    }
  }
};

const waitForLedgerUpdate0 = (
  protocolState: states.BWaitForLedgerUpdate0,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal => {
  switch (action.type) {
    case actions.COMMITMENT_RECEIVED:
      let newSharedData = receiveOpponentLedgerCommitment(
        sharedData,
        action.commitment,
        action.signature,
      );
      if (safeToSendLedgerUpdate(newSharedData, protocolState.ledgerId)) {
        newSharedData = createAndSendUpdateCommitment(
          newSharedData,
          protocolState.channelId,
          protocolState.ledgerId,
        );
        const newProtocolState = states.bWaitForPostFundSetup0(protocolState);
        return { protocolState: newProtocolState, sharedData: newSharedData };
      }
      return { protocolState, sharedData: newSharedData };
    default:
      return { protocolState, sharedData };
  }
};

const waitForPostFundSetup0 = (
  protocolState: states.BWaitForPostFundSetup0,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal => {
  if (action.type !== actions.COMMITMENT_RECEIVED) {
    return { protocolState, sharedData };
  }
  // extract the commitment
  // send it to the channel store?
  // craft the postFundSetup1
  // check that the channelStore will sign it

  // if yes
  //    put state in outbox
  //    transition the state to success

  const commitment = action.commitment;
  sharedData = respondWithPostFundSetup(protocolState.channelId, commitment, sharedData);
  const newProtocolState = states.success();
  return { protocolState: newProtocolState, sharedData };
};

const updateStateWithDirectFundingAction = (
  action: FundingAction,
  protocolState: states.BWaitForDirectFunding,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.BWaitForDirectFunding> => {
  const directFundingResult = updateDirectFundingStatus(
    protocolState.directFundingState,
    sharedData,
    action,
  );
  const newSharedData = directFundingResult.sharedData;
  const newProtocolState: PlayerBState = states.bWaitForDirectFunding({
    ...protocolState,
    directFundingState: directFundingResult.protocolState,
  });
  return { protocolState: newProtocolState, sharedData: newSharedData };
};

const startDirectFunding = (
  protocolState: states.BWaitForPreFundSetup0,
  ledgerId: string,
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.BWaitForDirectFunding> => {
  const {
    protocolState: directFundingProtocolState,
    sharedData: updatedSharedData,
  } = requestDirectFunding(`processId:${protocolState.channelId}`, sharedData, ledgerId);

  const newProtocolState = states.bWaitForDirectFunding({
    ...protocolState,
    ledgerId,
    directFundingState: directFundingProtocolState,
  });
  return { protocolState: newProtocolState, sharedData: updatedSharedData };
};

const createLedgerChannel = (
  appChannelId: string,
  sharedData: SharedData,
  incomingCommitment: Commitment,
  incomingSignature: string,
): SharedData => {
  const appChannelState = selectors.getOpenedChannelState(sharedData, appChannelId);
  const { address, privateKey } = appChannelState;
  const { channel } = incomingCommitment;

  const ledgerChannelId = channelID(channel);

  const newChannelState = channelState.waitForPreFundSetup({
    address,
    privateKey,
    channelId: ledgerChannelId,
    libraryAddress: channel.channelType,
    ourIndex: 1,
    participants: channel.participants as [string, string],
    channelNonce: channel.nonce,
    turnNum: 1,
    lastCommitment: { commitment: incomingCommitment, signature: incomingSignature },
    funded: false,
  });

  return initializeChannelState(sharedData, newChannelState);
};

const respondWithPreFundSetup = (
  appChannelId: string,
  incomingCommitment: Commitment,
  sharedData: SharedData,
): SharedData => {
  const appChannelState = selectors.getOpenedChannelState(sharedData, appChannelId);
  const { channel, allocation, destination } = incomingCommitment;
  // Create the commitment
  const preFundSetupCommitment = composePreFundCommitment(
    channel,
    allocation,
    destination,
    appChannelState.ourIndex,
    appChannelState.privateKey,
  );
  const { commitment, signature } = preFundSetupCommitment;

  // Update ledger channel state with commitment.
  const newSharedData = receiveOwnCommitment(sharedData, commitment);

  // Send the message to the opponent.
  const preFundSetupMessage = createCommitmentMessageRelay(
    appChannelState.participants[PlayerIndex.B],
    appChannelState.channelId,
    commitment,
    signature,
  );
  return queueMessage(newSharedData, preFundSetupMessage);
};

const respondWithPostFundSetup = (
  appChannelId: string,
  incomingCommitment: Commitment,
  sharedData: SharedData,
): SharedData => {
  const appChannelState = selectors.getOpenedChannelState(sharedData, appChannelId);
  // Create the commitment
  const preFundSetupCommitment = composePostFundCommitment(
    incomingCommitment,
    appChannelState.ourIndex,
    appChannelState.privateKey,
  );
  const { commitment, signature } = preFundSetupCommitment;

  // Update app channel state with commitment.
  const newSharedData = receiveOwnCommitment(sharedData, commitment);

  // Send the message to the opponent.
  const preFundSetupMessage = createCommitmentMessageRelay(
    appChannelState.participants[PlayerIndex.B],
    appChannelState.channelId,
    commitment,
    signature,
  );
  return queueMessage(newSharedData, preFundSetupMessage);
};

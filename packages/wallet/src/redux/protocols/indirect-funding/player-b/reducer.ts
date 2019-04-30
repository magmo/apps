import * as states from '../state';
import { PlayerBState } from '../state';

import * as actions from '../../../actions';

import { ProtocolStateWithSharedData } from '../../';
import { SharedData, checkAndStore, getChannel, signAndStore, queueMessage } from '../../../state';
import { IndirectFundingState } from '../state';
import { unreachable } from '../../../../utils/reducer-utils';
import {
  BWaitForPreFundSetup0,
  BWaitForDirectFunding,
  BWaitForLedgerUpdate0,
  BWaitForPostFundSetup0,
  bWaitForDirectFunding,
} from './state';
import { getChannelId, nextSetupCommitment } from '../../../../domain';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../../constants';
import { createCommitmentMessageRelay } from '../../reducer-helpers';
import { theirAddress } from '../../../../redux/channel-store';
import { initialDirectFundingState } from '../../direct-funding/state';

import { directFundingRequested } from '../../direct-funding/actions';

type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;
type IDFAction = actions.indirectFunding.Action;

export function initialize(channelId: string, sharedData: SharedData): ReturnVal {
  // todo: check that channel exists?
  return { protocolState: states.bWaitForPreFundSetup0({ channelId }), sharedData };
}

export function playerBReducer(
  protocolState: PlayerBState,
  sharedData: SharedData,
  action: IDFAction,
): ReturnVal {
  switch (protocolState.type) {
    case 'BWaitForPreFundSetup0':
      return handleWaitForPreFundSetup(protocolState, sharedData, action);
    case 'BWaitForDirectFunding':
      return handleWaitForDirectFunding(protocolState, sharedData, action);
    case 'BWaitForLedgerUpdate0':
      return handleWaitForLedgerUpdate(protocolState, sharedData, action);
    case 'BWaitForPostFundSetup0':
      return handleWaitForPostFundSetup(protocolState, sharedData, action);
    default:
      return unreachable(protocolState);
  }
}

function handleWaitForPreFundSetup(
  protocolState: BWaitForPreFundSetup0,
  sharedData: SharedData,
  action: IDFAction,
): ReturnVal {
  const unchangedState = { protocolState, sharedData };
  if (action.type !== actions.COMMITMENT_RECEIVED) {
    return unchangedState;
  }

  const checkResult = checkAndStore(sharedData, action.signedCommitment);
  if (!checkResult.isSuccess) {
    return unchangedState;
  }
  sharedData = checkResult.store;

  // at this point we don't know for sure that it was a pre-fund setup.
  // they could've sent us any valid update

  const theirCommitment = action.signedCommitment.commitment;
  const ledgerId = getChannelId(theirCommitment);
  let channel = getChannel(sharedData, ledgerId);
  if (!channel || channel.turnNum !== 0 || channel.libraryAddress !== CONSENSUS_LIBRARY_ADDRESS) {
    // todo: this could be more robust somehow.
    // Maybe we should generate what we were expecting and compare.
    return unchangedState;
  }

  // at this point we're happy that we have the pre-fund setup
  // we need to craft our reply

  const ourCommitment = nextSetupCommitment(theirCommitment);
  if (ourCommitment === 'NotASetupCommitment') {
    return unchangedState;
  }
  const signResult = signAndStore(sharedData, ourCommitment);
  if (!signResult.isSuccess) {
    return unchangedState;
  }
  sharedData = signResult.store;

  // just need to put our message in the outbox
  const messageRelay = createCommitmentMessageRelay(
    theirAddress(channel),
    'processId', // TODO don't use dummy values
    signResult.signedCommitment.commitment,
    signResult.signedCommitment.signature,
  );
  sharedData = queueMessage(sharedData, messageRelay);
  channel = getChannel(sharedData, ledgerId); // refresh channel

  // update the state
  const directFundingAction = directFundingRequested(
    'processId',
    ledgerId,
    '0',
    '0', // TODO don't use dummy values
    '0',
    1,
  );
  const directFundingState = initialDirectFundingState(directFundingAction, sharedData);
  const newProtocolState = bWaitForDirectFunding({
    ...protocolState,
    ledgerId,
    directFundingState: directFundingState.protocolState,
  });

  return { protocolState: newProtocolState, sharedData };
}

function handleWaitForDirectFunding(
  protocolState: BWaitForDirectFunding,
  sharedData: SharedData,
  action: IDFAction,
): ReturnVal {
  return { protocolState, sharedData };
}

function handleWaitForLedgerUpdate(
  protocolState: BWaitForLedgerUpdate0,
  sharedData: SharedData,
  action: IDFAction,
): ReturnVal {
  return { protocolState, sharedData };
}

function handleWaitForPostFundSetup(
  protocolState: BWaitForPostFundSetup0,
  sharedData: SharedData,
  action: IDFAction,
): ReturnVal {
  return { protocolState, sharedData };
}

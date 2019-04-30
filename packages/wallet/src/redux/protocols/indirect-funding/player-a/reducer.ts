import * as states from './state';

import * as actions from '../../../actions';

import {
  SharedData,
  signAndInitialize,
  getAddressAndPrivateKey,
  queueMessage,
} from '../../../state';
import { IndirectFundingState } from '../state';
import { ProtocolStateWithSharedData } from '../..';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator';
import { CommitmentType, Commitment, getChannelId } from '../../../../domain';
import { Channel } from 'fmg-core/lib/channel';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../../constants';
import { getChannel, theirAddress } from '../../../channel-store';
import { createCommitmentMessageRelay } from '../../reducer-helpers';

type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

export function initialize(channelId: string, sharedData: SharedData): ReturnVal {
  const channel = getChannel(sharedData.channelStore, channelId);
  if (!channel) {
    throw new Error(`Could not find existing application channel ${channelId}`);
  }
  // TODO: Should we have to pull these of the commitment or should they just be arguments to initialize?
  const { allocation, destination } = channel.lastCommitment.commitment;
  const ourCommitment = createInitialSetupCommitment(allocation, destination);

  const addressAndPrivateKey = getAddressAndPrivateKey(sharedData, channelId);
  if (!addressAndPrivateKey) {
    throw new Error(`Could not find address and private key for existing channel ${channelId}`);
  }

  const { address, privateKey } = addressAndPrivateKey;
  const signResult = signAndInitialize(sharedData, ourCommitment, address, privateKey);
  if (!signResult.isSuccess) {
    throw new Error('Could not store new ledger channel commitment.');
  }
  sharedData = signResult.store;

  const ledgerId = getChannelId(ourCommitment);

  // just need to put our message in the outbox
  const messageRelay = createCommitmentMessageRelay(
    theirAddress(channel),
    'processId', // TODO don't use dummy values
    signResult.signedCommitment.commitment,
    signResult.signedCommitment.signature,
  );
  sharedData = queueMessage(sharedData, messageRelay);

  const protocolState = states.aWaitForPreFundSetup1({
    channelId,
    ledgerId,
  });
  return { protocolState, sharedData };
}

export function playerAReducer(
  protocolState: states.PlayerAState,
  sharedData: SharedData,
  action: actions.indirectFunding.Action,
): ReturnVal {
  return { protocolState, sharedData };
}

function createInitialSetupCommitment(allocation: string[], destination: string[]): Commitment {
  const appAttributes = {
    proposedAllocation: allocation,
    proposedDestination: destination,
    consensusCounter: 0,
  };
  // TODO: We'll run into collisions if we reuse the same nonce
  const nonce = 0;
  console.log(nonce);
  const channel: Channel = {
    nonce,
    participants: destination,
    channelType: CONSENSUS_LIBRARY_ADDRESS,
  };
  return {
    turnNum: 0,
    commitmentCount: 0,
    commitmentType: CommitmentType.PreFundSetup,
    appAttributes: bytesFromAppAttributes(appAttributes),
    allocation,
    destination,
    channel,
  };
}

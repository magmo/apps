import { ChannelStore, getChannel, setChannel, setInitializingChannel } from './state';

import { ReducerWithSideEffects } from '../../utils/reducer-utils';
import { StateWithSideEffects } from '../utils';
import { WalletAction } from '../actions';
import {
  SignedCommitment,
  Commitment,
  signCommitment2,
  getChannelId,
  hasValidSignature,
} from '../../domain';
import { pushCommitment, ChannelState } from './channel-state/states';
import { validTransition } from './channel-state';
import * as channelActions from './actions';
import { ethers } from 'ethers';
import { channelInitializationSuccess } from 'magmo-wallet-client';

export const channelStoreReducer: ReducerWithSideEffects<ChannelStore> = (
  state: ChannelStore,
  action: WalletAction,
): StateWithSideEffects<ChannelStore> => {
  switch (action.type) {
    case channelActions.CREATE_CHANNEL:
      return createNewInitializingChannel(state);
    case channelActions.OPPONENT_COMMITMENT_RECEIVED:
      const { commitment, signature } = action;
      const checkResult = checkAndStore(state, { commitment, signature });
      // TODO Handle failure cases
      if (checkResult.isSuccess) {
        return { state: checkResult.store };
      }
      break;
    case channelActions.OWN_COMMITMENT_RECEIVED:
      const signResult = signAndStore(state, action.commitment);
      // TODO Handle failure cases
      if (signResult.isSuccess) {
        return { state: signResult.store };
      }
      break;
  }
  return { state };
};

// -----------------
// NEW FUNCTIONALITY
// -----------------

function createNewInitializingChannel(store: ChannelStore) {
  const { address, privateKey } = ethers.Wallet.createRandom();
  const state = setInitializingChannel(store, { address, privateKey });
  return { state, sideEffects: { messageOutbox: channelInitializationSuccess(address) } };
}

interface SignSuccess {
  isSuccess: true;
  signedCommitment: SignedCommitment;
  store: ChannelStore;
}

interface SignFailure {
  isSuccess: false;
  reason: SignFailureReason;
}

type SignFailureReason = 'ChannelDoesntExist' | 'TransitionUnsafe' | 'NotOurTurn';
type SignResult = SignSuccess | SignFailure;

// Signs and stores a commitment from our own app or wallet.
// Doesn't work for the first state - the channel must already exist.
export function signAndStore(store: ChannelStore, commitment: Commitment): SignResult {
  const channelId = getChannelId(commitment);
  let channel = getChannel(store, channelId);
  if (!channel) {
    return { isSuccess: false, reason: 'ChannelDoesntExist' };
  }
  const signedCommitment = signCommitment2(commitment, channel.address);

  // this next check is weird. It'll check whether it was our turn.
  // Maybe this should be done as part of signCommitment2
  if (!hasValidSignature(signedCommitment)) {
    return { isSuccess: false, reason: 'NotOurTurn' };
  }

  // store if safe
  if (!isSafeTransition(store, channel, commitment)) {
    return { isSuccess: false, reason: 'TransitionUnsafe' };
  }

  channel = pushCommitment(channel, signedCommitment);
  store = setChannel(store, channel);

  return { isSuccess: true, signedCommitment, store };
}

interface CheckSuccess {
  isSuccess: true;
  store: ChannelStore;
}

interface CheckFailure {
  isSuccess: false;
}

type CheckResult = CheckSuccess | CheckFailure;

// For use with a signed commitment received from an opponent.
// Will create a channel if turnNum=0 and channel doesn't already exist.
export function checkAndStore(
  store: ChannelStore,
  signedCommitment: SignedCommitment,
): CheckResult {
  if (!hasValidSignature(signedCommitment)) {
    return { isSuccess: false };
  }
  const commitment = signedCommitment.commitment;
  const channelId = getChannelId(commitment);
  let channel = getChannel(store, channelId);

  if (!channel) {
    // do I need to do any checks? seems like no?
    // I guess I need to make sure I'm a participant and set my participant number
    // just create a channel from the commitment?
    // store = setChannel(store, channel);
    return { isSuccess: true, store };
  }

  if (!isSafeTransition(store, channel, commitment)) {
    return { isSuccess: false };
  }

  channel = pushCommitment(channel, signedCommitment);

  // todo
  return { isSuccess: false };
}

// Currently just checks for validTransition
// In the future might check things like value preservation in the network.
function isSafeTransition(
  store: ChannelStore,
  channel: ChannelState,
  commitment: Commitment,
): boolean {
  return validTransition(channel, commitment);
}

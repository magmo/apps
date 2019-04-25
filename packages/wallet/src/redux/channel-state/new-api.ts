import { SignedCommitment } from './shared/state';
import { ChannelState, getChannel, setChannel } from './state';
import { Commitment } from 'fmg-core/lib/commitment';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';

type Result = 'success' | 'fail';

export function signAndStore(channelState: ChannelState, commitment: Commitment): Result {
  const channelId = channelID(commitment.channel);
  const existingChannel = getChannel(channelState, channelId);

  if (!existingChannel) {
    // need to look up the private key in the opening channels
    // const isValidFirst = isValidFirstCommitment(commitment);
    // if (!valid) {
    //   return 'fail';
    // }
    // // sign it
    // const newChannel = initializeChannelFromCommitment(commitment);
    // return setChannel(channelState, newChannel);
  } else {
    const isValid = isValidTransition(existingChannel, commitment);
    // sign it
  }

  // sign it
  // check it's a validTransition
  // store
}

export function checkAndStore(channelState: ChannelState, commitment: SignedCommitment): Result {
  // check that the signature is valid
  // check it's a validTransition
  // store
}

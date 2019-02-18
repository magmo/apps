import { State, bigNumberify } from "fmg-core";
import { WalletState } from '../states';

export function unreachable(x: never) { return x; }

export const validTransition = (fromState: WalletState, toState: State) => {
  // todo: check the game rules

  if (!('turnNum' in fromState)) { return false; }
  if (!('libraryAddress' in fromState)) { return false; }

  return (toState.turnNum.eq(fromState.turnNum.add(1))) &&
    (bigNumberify(toState.channel.channelNonce).eq(fromState.channelNonce)) &&
    (toState.channel.participants[0] === fromState.participants[0]) &&
    (toState.channel.participants[1] === fromState.participants[1]) &&
    (toState.channel.channelType === fromState.libraryAddress) &&
    (toState.channel.id === fromState.channelId);
};

export const ourTurn = (state: WalletState) => {
  if (!('turnNum' in state)) { return false; }
  const turnIndex = state.turnNum.mod(2);
  const ourIndex = bigNumberify(state.ourIndex);
  return !turnIndex.eq(ourIndex);
};

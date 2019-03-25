import { SharedChannelState, baseChannelState } from '../../shared/state';

export interface LedgerChannelInitialized extends SharedChannelState {
  channelId: string;
  libraryAddress: string;
  ourIndex: number;
  participants: [string, string];
  channelNonce: number;
  turnNum: number;
  allocation: [string, string];
  funded: boolean;
}

export function ledgerChannelInitialized<T extends LedgerChannelInitialized>(
  params: T,
): LedgerChannelInitialized {
  const {
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
    allocation,
  } = params;
  return {
    ...baseChannelState(params),
    channelId,
    ourIndex,
    participants,
    channelNonce,
    turnNum,
    libraryAddress,
    funded,
    allocation,
  };
}

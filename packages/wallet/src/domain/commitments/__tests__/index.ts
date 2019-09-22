import { bigNumberify } from 'ethers/utils';
import { channelID } from 'fmg-core/lib/channel';
import { ETH_ASSET_HOLDER } from '../../../constants';
import { ThreePartyPlayerIndex, TwoPartyPlayerIndex } from '../../../redux/types';
import { unreachable } from '../../../utils/reducer-utils';
import { encodeConsensusData } from 'nitro-protocol/lib/src/contract/consensus-data';
import { Outcome, AllocationAssetOutcome } from 'nitro-protocol/lib/src/contract/outcome';
import { State } from 'nitro-protocol/lib/src/contract/state';
import { Channel, getChannelId } from 'nitro-protocol/lib/src/contract/channel';
import { signState } from 'nitro-protocol/lib/src/signatures';
import { SignedState } from 'nitro-protocol';
import { ChannelState } from '../../../redux/channel-store';
import { SharedData, emptySharedData } from '../../../redux/state';
import { ethers } from 'ethers';
export const asPrivateKey = '0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d';
export const asAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
export const bsPrivateKey = '0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72';
export const bsAddress = '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb';
export const hubPrivateKey = '0xce442e75dd539bd632aca84efa0b7de5c5b48aa4bbf028c8a6c17b2e7a16446e';
export const hubAddress = '0xAbcdE1140bA6aE8e702b78f63A4eA1D1553144a1';

export const threeParticipants: [string, string, string] = [asAddress, bsAddress, hubAddress];
export const participants: [string, string] = [asAddress, bsAddress];
export const TEST_CONSENSUS_LIBRARY_ADDRESS = '0x' + '2'.repeat(40);
export const libraryAddress = '0x' + '1'.repeat(40);
export const channelNonce = 4;
export const channel = { channelType: libraryAddress, nonce: channelNonce, participants };
export const channelId = channelID(channel);

// TODO: Move this to the correct location
export const convertAddressToBytes32 = (address: string) => {
  const hexValue = bigNumberify(address).toHexString();
  return hexValue.padEnd(66, '0');
};

export const convertBytes32ToAddress = (bytes: string) => {
  const hexValue = bigNumberify(bytes).toHexString();
  return hexValue.slice(0, 42);
};
export const twoThree: Outcome = [
  {
    assetHolderAddress: ETH_ASSET_HOLDER,
    allocation: [
      {
        destination: convertAddressToBytes32(asAddress),
        amount: bigNumberify(2).toHexString(),
      },
      { destination: convertAddressToBytes32(bsAddress), amount: bigNumberify(3).toHexString() },
    ],
  },
];

const twoThreeTwo: Outcome = [
  {
    assetHolderAddress: ETH_ASSET_HOLDER,
    allocation: [
      { destination: convertAddressToBytes32(asAddress), amount: bigNumberify(2).toHexString() },
      { destination: convertAddressToBytes32(bsAddress), amount: bigNumberify(3).toHexString() },
      { destination: convertAddressToBytes32(hubAddress), amount: bigNumberify(2).toHexString() },
    ],
  },
];

export const addressAndPrivateKeyLookup: {
  [idx in TwoPartyPlayerIndex | ThreePartyPlayerIndex]: { address: string; privateKey: string }
} = {
  [TwoPartyPlayerIndex.A]: { address: asAddress, privateKey: asPrivateKey },
  [TwoPartyPlayerIndex.B]: { address: bsAddress, privateKey: bsPrivateKey },
  [ThreePartyPlayerIndex.A]: { address: asAddress, privateKey: asPrivateKey },
  [ThreePartyPlayerIndex.B]: { address: bsAddress, privateKey: bsPrivateKey },
  [ThreePartyPlayerIndex.Hub]: { address: hubAddress, privateKey: hubPrivateKey },
};

const blankOutcome: Outcome = [];

interface AppCommitmentParams {
  turnNum: number;
  isFinal?: boolean;
  outcome?: Outcome;
  appData?: string;
}

const EMPTY_APP_DATA = encodeConsensusData({
  furtherVotesRequired: 0,
  proposedOutcome: [],
});
export const APP_CHANNEL: Channel = {
  chainId: '0x1',
  channelNonce: '0x5',
  participants: [asAddress, bsAddress],
};

export function appState(params: AppCommitmentParams): SignedState {
  const turnNum = params.turnNum;
  const outcome = params.outcome || twoThree;
  const isFinal = params.isFinal || false;
  const appData = params.appData || EMPTY_APP_DATA;

  const state: State = {
    turnNum,
    outcome,
    isFinal,
    appData,
    appDefinition: ethers.Wallet.createRandom().address,
    channel: APP_CHANNEL,
    challengeDuration: '0x1',
  };
  const privateKey = turnNum % 2 === 0 ? asPrivateKey : bsPrivateKey;

  return signState(state, privateKey);
}

interface LedgerStateParams {
  turnNum: number;
  isFinal?: boolean;
  outcome?: Outcome;
  proposedOutcome?: Outcome;
}

interface ThreeWayLedgerStateParams extends LedgerStateParams {
  furtherVotesRequired?: number;
}

const LEDGER_CHANNEL_NONCE = 800;

export const TWO_PARTICIPANT_LEDGER_CHANNEL: Channel = {
  participants,
  chainId: '0x1',
  channelNonce: bigNumberify(LEDGER_CHANNEL_NONCE).toHexString(),
};
export const TWO_PARTICIPANT_LEDGER_CHANNEL_ID = getChannelId(TWO_PARTICIPANT_LEDGER_CHANNEL);
export const THREE_PARTICIPANT_LEDGER_CHANNEL: Channel = {
  participants: threeParticipants,
  chainId: '0x1',
  channelNonce: bigNumberify(LEDGER_CHANNEL_NONCE).toHexString(),
};
export const THREE_PARTICIPANT_LEDGER_CHANNEL_ID = getChannelId(THREE_PARTICIPANT_LEDGER_CHANNEL);

export function threeWayLedgerState(params: ThreeWayLedgerStateParams): SignedState {
  const turnNum = params.turnNum;
  const isFinal = params.isFinal || false;
  const outcome = params.outcome || twoThreeTwo;
  const proposedOutcome = params.proposedOutcome || blankOutcome;
  const furtherVotesRequired: number = params.furtherVotesRequired || 0;
  const appData = encodeConsensusData({ proposedOutcome, furtherVotesRequired });
  const state: State = {
    turnNum,
    challengeDuration: '0x1',
    isFinal,
    outcome,
    appDefinition: TEST_CONSENSUS_LIBRARY_ADDRESS,
    appData,
    channel: THREE_PARTICIPANT_LEDGER_CHANNEL,
  };
  const idx: ThreePartyPlayerIndex = turnNum % 3;
  switch (idx) {
    case ThreePartyPlayerIndex.A:
      return signState(state, asPrivateKey);
    case ThreePartyPlayerIndex.B:
      return signState(state, bsPrivateKey);
    case ThreePartyPlayerIndex.Hub:
      return signState(state, hubPrivateKey);
    default:
      return unreachable(idx);
  }
}

export function ledgerState(params: LedgerStateParams): SignedState {
  const turnNum = params.turnNum;
  const isFinal = params.isFinal || false;
  const outcome = params.outcome || twoThree;
  const proposedOutcome = params.proposedOutcome || blankOutcome;
  let furtherVotesRequired = 0;
  if (params.proposedOutcome) {
    furtherVotesRequired = 1;
  }
  const appData = encodeConsensusData({ proposedOutcome, furtherVotesRequired });
  const state: State = {
    turnNum,
    challengeDuration: '0x1',
    isFinal,
    outcome,
    appDefinition: TEST_CONSENSUS_LIBRARY_ADDRESS,
    appData,
    channel: TWO_PARTICIPANT_LEDGER_CHANNEL,
  };

  const privateKey = turnNum % 2 === 0 ? asPrivateKey : bsPrivateKey;

  return signState(state, privateKey);
}

export function channelStateFromStates(signedStates: SignedState[]): ChannelState {
  const lastState = signedStates[signedStates.length - 1].state;
  return {
    type: 'Channel.WaitForState',
    signedStates,
    turnNumRecord: lastState.turnNum,
    channel: lastState.channel,
  };
}

export function setChannels(sharedData: SharedData, channelStates: ChannelState[]): SharedData {
  const channelStore = {};
  channelStates.forEach(s => {
    const cId = getChannelId(s.channel);
    channelStore[cId] = s;
  });
  return { ...sharedData, channelStore };
}

export function convertBalanceToOutcome(
  balances: Array<{ wei: string; address: string }>,
): AllocationAssetOutcome[] {
  const allocation = balances.map(b => {
    return { destination: convertAddressToBytes32(b.address), amount: b.wei };
  });
  return [
    {
      assetHolderAddress: ETH_ASSET_HOLDER,
      allocation,
    },
  ];
}

export const testEmptySharedData = (address = asAddress, privateKey = asPrivateKey): SharedData => {
  return emptySharedData(address, privateKey);
};

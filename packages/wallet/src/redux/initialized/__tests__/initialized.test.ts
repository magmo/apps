import { initializedReducer } from '../reducer';

import * as states from '../../state';
import * as fundingStates from '../../fundingState/state';
import * as actions from '../../actions';
import * as outgoing from 'magmo-wallet-client/lib/wallet-events';
import * as channelStates from '../../channelState/state';
import * as scenarios from '../../__tests__/test-scenarios';
import { itSendsThisMessage } from '../../__tests__/helpers';
import { waitForUpdate } from '../../channelState/state';

const { channelId } = scenarios;

const defaults = {
  ...states.emptyState,
  uid: 'uid',
  adjudicator: 'adjudicator',
  networkId: 1,
};

describe('when in WALLET_INITIALIED', () => {
  const state = states.initialized({ ...defaults });

  describe('when the player initializes a channel', () => {
    const action = actions.channelInitialized();
    const updatedState = initializedReducer(state, action);

    it('applies the channel reducer', async () => {
      expect(updatedState.channelState[channelId].type).toEqual(channelStates.WAIT_FOR_CHANNEL);
    });
  });

  describe('when a funding related action arrives', () => {
    const action = actions.fundingReceivedEvent('0xf00', '0x', '0x');
    const updatedState = initializedReducer(state, action);

    it('applies the funding state reducer', async () => {
      expect(updatedState.fundingState![channelId]).toEqual(fundingStates.WAIT_FOR_FUNDING_REQUEST);
    });
  });
});

describe('When the channel reducer declares a side effect', () => {
  const {
    bsAddress,
    bsPrivateKey,
    gameCommitment1,
    gameCommitment2,
    channelNonce,
    channel,
  } = scenarios;
  const walletParams = {
    ...states.emptyState,
    uid: 'uid',
    adjudicator: 'adj-address',
    networkId: 2132,
  };

  const channelParams = {
    participants: channel.participants as [string, string],
    libraryAddress: channel.channelType,
    channelId,
    channelNonce,
    lastCommitment: { commitment: gameCommitment1, signature: 'sig' },
    penultimateCommitment: { commitment: gameCommitment2, signature: 'sig' },
    turnNum: gameCommitment2.turnNum,
    challengeExpiry: new Date(),
    funded: false,
  };

  const bParams = { address: bsAddress, ourIndex: 1, privateKey: bsPrivateKey };
  const bDefaults = { ...channelParams, ...bParams };

  const state = states.initialized({
    ...walletParams,
    channelState: { [channelId]: waitForUpdate(bDefaults) },
    outboxState: {},
  });

  const action = actions.challengeRequested();
  const updatedState = initializedReducer(state, action);

  expect(state.outboxState).toEqual({});
  itSendsThisMessage(updatedState, outgoing.CHALLENGE_REJECTED);
});

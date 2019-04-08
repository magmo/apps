import * as states from '../state';
import * as actions from '../../../actions';
import { playerAReducer } from '../reducer';
import * as walletStates from '../../../state';
import * as channelStates from '../../../channel-state/state';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import { Commitment, CommitmentType } from 'fmg-core/lib/commitment';
import { itTransitionsProcedureToStateType } from '../../../__tests__/helpers';
import { ethers } from 'ethers';
import { MESSAGE_RELAY_REQUESTED } from 'magmo-wallet-client';
import { WalletProcedure } from '../../../types';
import * as selectors from '../../../selectors';
import { Channel } from 'magmo-wallet-client/node_modules/fmg-core';
import { channelID } from 'magmo-wallet-client/node_modules/fmg-core/lib/channel';
import * as SigningUtil from '../../../../utils/signing-utils';

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;
function itTransitionToStateType(state, type) {
  itTransitionsProcedureToStateType('indirectFunding', state, type);
}

const playerAWallet = ethers.Wallet.createRandom();
const playerBWallet = ethers.Wallet.createRandom();

const defaults = {
  uid: '1',
  networkId: 1,
  address: playerAWallet.address,
  adjudicator: ethers.Wallet.createRandom().address,
  consensusLibrary: ethers.Wallet.createRandom().address,
  channelId: ethers.Wallet.createRandom().address,
  ourIndex: PlayerIndex.A,
  nonce: 4,
  libraryAddress: ethers.Wallet.createRandom().address,
  participants: [playerAWallet.address, playerBWallet.address] as [string, string],
  privateKey: playerAWallet.privateKey,
};

const dummyCommitment: Commitment = {
  channel: {
    nonce: defaults.nonce,
    channelType: defaults.libraryAddress,
    participants: defaults.participants,
  },
  allocation: [],
  destination: [],
  appAttributes: '0x0',
  commitmentCount: 0,
  turnNum: 0,
  commitmentType: CommitmentType.App,
};

const channelDefaults = {
  ...defaults,
  channelNonce: defaults.nonce,
  turnNum: 5,
  lastCommitment: { commitment: dummyCommitment, signature: '0x0' },
  penultimateCommitment: { commitment: dummyCommitment, signature: '0x0' },
  funded: false,
  address: defaults.participants[0],
};

const defaultAppChannelState = channelStates.waitForFundingAndPostFundSetup(channelDefaults);
const defaultChannelState: channelStates.ChannelState = {
  initializedChannels: {
    [defaultAppChannelState.channelId]: defaultAppChannelState,
  },
  initializingChannels: {},
};

const defaultWalletState = walletStates.initialized({
  ...defaults,
  channelState: defaultChannelState,
  fundingState: { directFunding: {}, indirectFunding: {} },
  outboxState: { displayOutbox: [], messageOutbox: [], transactionOutbox: [] },
  directFundingStore: {},
});

describe(startingIn(states.WAIT_FOR_APPROVAL), () => {
  const { channelId } = defaults;
  const walletState = { ...defaultWalletState };
  walletState.indirectFunding = states.waitForApproval({ channelId });

  describe(whenActionArrives(actions.indirectFunding.playerA.FUNDING_APPROVED), () => {
    const action = actions.indirectFunding.playerA.fundingApproved(channelId);
    const updatedState = playerAReducer(walletState, action);
    itTransitionToStateType(updatedState, states.WAIT_FOR_PRE_FUND_SETUP_1);
    it('creates a ledger channel in the correct state', () => {
      const newLedgerId = (updatedState.indirectFunding as states.WaitForPreFundSetup1).ledgerId;
      const ledgerChannel = updatedState.channelState.initializedChannels[newLedgerId];
      expect(ledgerChannel).toBeDefined();
      expect(ledgerChannel.type).toEqual(channelStates.WAIT_FOR_PRE_FUND_SETUP);
    });
    it('sends the commitment to the opponent', () => {
      // TODO: Add this to test helpers
      expect(updatedState.outboxState.messageOutbox[0]).toBeDefined();
      expect(updatedState.outboxState.messageOutbox[0].type).toEqual(MESSAGE_RELAY_REQUESTED);
    });
  });
});

describe(startingIn(states.WAIT_FOR_PRE_FUND_SETUP_1), () => {
  const { channelId } = defaults;
  const { nonce, consensusLibrary, participants } = channelDefaults;
  const ledgerChannel: Channel = { nonce, participants, channelType: consensusLibrary };
  const ledgerId = channelID(ledgerChannel);
  const walletState = { ...defaultWalletState };

  walletState.indirectFunding = states.waitForPreFundSetup1({ channelId, ledgerId });
  // Add the ledger channel to state
  const ledgerChannelState = channelStates.waitForPreFundSetup({
    ...channelDefaults,
    channelId: ledgerId,
  });
  walletState.channelState.initializedChannels[ledgerId] = ledgerChannelState;

  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const ledgerPrefundCommitment: Commitment = {
      channel: ledgerChannel,
      allocation: ['0x01', '0x01'],
      destination: participants,
      appAttributes: '0x0',
      commitmentCount: 1,
      turnNum: 1,
      commitmentType: CommitmentType.PreFundSetup,
    };
    const action = actions.commitmentReceived(
      ledgerId,
      WalletProcedure.IndirectFunding,
      ledgerPrefundCommitment,
      '0x0',
    );
    const updatedState = playerAReducer(walletState, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_DIRECT_FUNDING);
    it('updates the ledger state', () => {
      const updatedLedgerState = selectors.getChannelState(updatedState, ledgerId);
      expect(updatedLedgerState.type).toEqual(channelStates.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP);
    });
    it('updates the direct funding status ', () => {
      const directFundingState = selectors.getDirectFundingState(updatedState, ledgerId);
      expect(directFundingState.channelFundingStatus).toBeDefined();
    });
  });
});

describe(startingIn(states.WAIT_FOR_DIRECT_FUNDING), () => {
  const { channelId } = defaults;
  const ledgerId = ethers.Wallet.createRandom().address;
  const walletState = { ...defaultWalletState };

  walletState.indirectFunding = states.waitForPreFundSetup1({ channelId, ledgerId });
  // Add the ledger channel to state
  const ledgerChannelState = channelStates.waitForPreFundSetup({
    ...channelDefaults,
    channelId: ledgerId,
  });
  walletState.channelState.initializedChannels[ledgerId] = ledgerChannelState;
});

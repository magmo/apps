import * as states from '../state';
import * as actions from '../../../actions';
import { playerAReducer } from '../reducer';
import * as walletStates from '../../../state';
import * as channelStates from '../../../channel-state/state';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import {
  itTransitionsProcedureToStateType,
  itSendsThisMessage,
  itTransitionsToChannelStateType,
} from '../../../__tests__/helpers';
import { ethers } from 'ethers';
import { MESSAGE_RELAY_REQUESTED } from 'magmo-wallet-client';
import { WalletProcedure } from '../../../types';
import * as selectors from '../../../selectors';
import * as SigningUtil from '../../../../utils/signing-utils';
import {} from '../../../__tests__/test-scenarios';
import * as testScenarios from '../../../__tests__/test-scenarios';

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;
function itTransitionToStateType(state, type) {
  itTransitionsProcedureToStateType('indirectFunding', state, type);
}
function itTransitionsChannelToStateType(channelId: string, state: walletStates.Initialized, type) {
  const channelState = state.channelState.initializedChannels[channelId];
  itTransitionsToChannelStateType(type, { state: channelState });
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
  ledgerId: testScenarios.ledgerId,
};

const channelDefaults = {
  ...defaults,
  channelNonce: defaults.nonce,
  turnNum: 5,
  lastCommitment: {
    commitment: testScenarios.ledgerCommitments.preFundCommitment1,
    signature: '0x0',
  },
  penultimateCommitment: {
    commitment: testScenarios.ledgerCommitments.preFundCommitment0,
    signature: '0x0',
  },
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
    itSendsThisMessage(updatedState, MESSAGE_RELAY_REQUESTED);
    const newLedgerId = (updatedState.indirectFunding as states.WaitForPreFundSetup1).ledgerId;
    itTransitionsChannelToStateType(
      newLedgerId,
      updatedState,
      channelStates.WAIT_FOR_PRE_FUND_SETUP,
    );
  });
});

describe(startingIn(states.WAIT_FOR_PRE_FUND_SETUP_1), () => {
  const { channelId, ledgerId } = defaults;
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

    const action = actions.commitmentReceived(
      ledgerId,
      WalletProcedure.IndirectFunding,
      testScenarios.ledgerCommitments.preFundCommitment1,
      '0x0',
    );
    const updatedState = playerAReducer(walletState, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_DIRECT_FUNDING);
    itTransitionsChannelToStateType(
      ledgerId,
      updatedState,
      channelStates.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP,
    );
    it('updates the direct funding status ', () => {
      const directFundingState = selectors.getDirectFundingState(updatedState, ledgerId);
      expect(directFundingState.channelFundingStatus).toBeDefined();
    });
  });
});

describe(startingIn(states.WAIT_FOR_DIRECT_FUNDING), () => {
  const { channelId, ledgerId } = defaults;
  const walletState = { ...defaultWalletState };

  walletState.indirectFunding = states.waitForPreFundSetup1({ channelId, ledgerId });
  // Add the ledger channel to state
  const ledgerChannelState = channelStates.waitForPreFundSetup({
    ...channelDefaults,
    channelId: ledgerId,
  });
  walletState.channelState.initializedChannels[ledgerId] = ledgerChannelState;
});

import * as states from '../state';
import * as walletStates from '../../../state';
import * as channelStates from '../../../channel-state/state';
import * as actions from '../../../actions';

import * as scenarios from '../../../__tests__/test-scenarios';
import { playerBReducer } from '../reducer';
import {
  itTransitionsProcedureToStateType,
  itSendsNoMessage,
  itSendsNoTransaction,
} from '../../../__tests__/helpers';
import { WalletProcedure } from '../../../types';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';

const startingIn = type => `starting in ${type}`;
const whenActionArrives = type => `when ${type} arrives`;

function itTransitionToStateType(state, type) {
  itTransitionsProcedureToStateType('indirectFunding', state, type);
}

const {
  initializedState,
  ledgerCommitments,
  bsAddress,
  bsPrivateKey,
  channelNonce,
  libraryAddress,
  participants,
  preFundCommitment1,
  preFundCommitment2,
  channelId,
} = scenarios;

const { preFundCommitment0 } = ledgerCommitments;

const MOCK_SIGNATURE = 'signature';
const channelStateDefaults = {
  address: bsAddress,
  privateKey: bsPrivateKey,
  adjudicator: 'adj-address',
  channelId,
  channelNonce,
  libraryAddress,
  networkId: 3,
  participants,
  uid: 'uid',
  transactionHash: '0x0',
  funded: false,
  penultimateCommitment: { commitment: preFundCommitment1, signature: MOCK_SIGNATURE },
  lastCommitment: { commitment: preFundCommitment2, signature: MOCK_SIGNATURE },
  turnNum: 1,
  ourIndex: PlayerIndex.B,
};

const defaultState = { ...initializedState };
const startingState = (
  state: states.PlayerBState,
  channelState?: channelStates.OpenedState,
): walletStates.IndirectFundingOngoing => ({
  ...defaultState,
  indirectFunding: state,
  channelState: {
    ...channelStates.EMPTY_CHANNEL_STATE,
    initializedChannels: channelState ? { [channelState.channelId]: channelState } : {},
  },
});

describe(startingIn(states.WAIT_FOR_APPROVAL), () => {
  describe(whenActionArrives(actions.indirectFunding.playerB.STRATEGY_PROPOSED), () => {
    const state = startingState(states.waitForApproval({ channelId }));
    const action = actions.indirectFunding.playerB.strategyProposed(channelId);
    const updatedState = playerBReducer(state, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_PRE_FUND_SETUP_0);
  });
});

describe(startingIn(states.WAIT_FOR_PRE_FUND_SETUP_0), () => {
  describe.only(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const state = startingState(
      states.waitForPreFundSetup0({ channelId }),
      channelStates.waitForFundingAndPostFundSetup(channelStateDefaults),
    );

    const action = actions.commitmentReceived(
      channelId,
      WalletProcedure.IndirectFunding,
      preFundCommitment0,
      'signature',
    );
    const updatedState = playerBReducer(state, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_DIRECT_FUNDING);
    itSendsNoMessage(updatedState);
    itSendsNoTransaction(updatedState);
  });
});

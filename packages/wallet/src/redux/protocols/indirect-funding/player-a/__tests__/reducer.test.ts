import { MESSAGE_RELAY_REQUESTED } from 'magmo-wallet-client';
import { PlayerIndex } from 'magmo-wallet-client/lib/wallet-instructions';
import { addHex } from '../../../../../utils/hex-utils';
import * as SigningUtil from '../../../../../utils/signing-utils';
import * as actions from '../../../../actions';
import * as channelStates from '../../../../channel-state/state';
import { ProtocolStateWithSharedData } from '../../../../protocols';
import { itSendsThisMessage, itTransitionsToChannelStateType } from '../../../../__tests__/helpers';
import * as testScenarios from '../../../../__tests__/test-scenarios';
import {} from '../../../../__tests__/test-scenarios';
import { playerAReducer } from '../reducer';
import * as states from '../state';
import * as scenarios from './scenarios';

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

function itTransitionToStateType(state, type) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}
function itTransitionsChannelToStateType(
  state: ProtocolStateWithSharedData<states.PlayerAState>,
  channelId: string,
  type,
) {
  const channelState = state.sharedData.channelState.initializedChannels[channelId];
  itTransitionsToChannelStateType(type, { state: channelState });
}

const defaults = {
  ...testScenarios,
  ourIndex: PlayerIndex.A,
  privateKey: testScenarios.asPrivateKey,
  directFundingState: testScenarios.ledgerDirectFundingStates.playerA,
};

const ledgerChannelDefaults = {
  ...defaults,
  turnNum: 5,
  lastCommitment: {
    commitment: testScenarios.ledgerCommitments.preFundCommitment0,
    signature: '0x0',
  },
  penultimateCommitment: {
    commitment: testScenarios.ledgerCommitments.preFundCommitment1,
    signature: '0x0',
  },
  funded: false,
  address: testScenarios.ledgerChannel.participants[0],
  channelNonce: testScenarios.ledgerChannel.nonce,
  libraryAddress: testScenarios.ledgerChannel.channelType,
  participants: testScenarios.ledgerChannel.participants as [string, string],
};

const validateMock = jest.fn().mockReturnValue(true);
Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

describe(startingIn(states.WAIT_FOR_APPROVAL), () => {
  const { channelId } = defaults;
  const state = scenarios.happyPath.states.waitForApproval;

  describe(whenActionArrives(actions.indirectFunding.playerA.STRATEGY_APPROVED), () => {
    const action = actions.indirectFunding.playerA.strategyApproved(
      channelId,
      ledgerChannelDefaults.libraryAddress,
    );
    const updatedState = playerAReducer(state.protocolState, state.sharedData, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_PRE_FUND_SETUP_1);
    itSendsThisMessage(updatedState.sharedData, MESSAGE_RELAY_REQUESTED);
    const newLedgerId = (updatedState.protocolState as states.WaitForDirectFunding).ledgerId;
    itTransitionsChannelToStateType(
      updatedState,
      newLedgerId,
      channelStates.WAIT_FOR_PRE_FUND_SETUP,
    );
  });
});

describe(startingIn(states.WAIT_FOR_PRE_FUND_SETUP_1), () => {
  const { ledgerId } = defaults;
  const state = scenarios.happyPath.states.waitForPreFundSetup1;

  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const action = actions.commitmentReceived(
      ledgerId,
      testScenarios.ledgerCommitments.preFundCommitment1,
      '0x0',
    );
    const updatedState = playerAReducer(state.protocolState, state.sharedData, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_DIRECT_FUNDING);
    itTransitionsChannelToStateType(
      updatedState,
      ledgerId,
      channelStates.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP,
    );
  });
});

describe(startingIn(states.WAIT_FOR_DIRECT_FUNDING), () => {
  const { ledgerId } = defaults;
  const total = testScenarios.twoThree.reduce(addHex);

  const state = scenarios.happyPath.states.waitForDirectFunding;
  // Add the ledger channel to state

  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    const action = actions.fundingReceivedEvent('processId', defaults.ledgerId, total, total);
    const updatedState = playerAReducer(state.protocolState, state.sharedData, action);

    itTransitionToStateType(updatedState, states.WAIT_FOR_POST_FUND_SETUP_1);
    itTransitionsChannelToStateType(
      updatedState,
      ledgerId,
      channelStates.A_WAIT_FOR_POST_FUND_SETUP,
    );
  });
});

describe(startingIn(states.WAIT_FOR_POST_FUND_SETUP_1), () => {
  const { ledgerId } = defaults;

  const state = scenarios.happyPath.states.waitForPostFundSetup1;
  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const action = actions.commitmentReceived(
      ledgerId,
      testScenarios.ledgerCommitments.postFundCommitment1,
      '0x0',
    );
    const updatedState = playerAReducer(state.protocolState, state.sharedData, action);
    itTransitionToStateType(updatedState, states.WAIT_FOR_LEDGER_UPDATE_1);
    itTransitionsChannelToStateType(
      updatedState,
      ledgerId,

      channelStates.WAIT_FOR_UPDATE,
    );
  });
});

describe(startingIn(states.WAIT_FOR_LEDGER_UPDATE_1), () => {
  const { ledgerId } = defaults;

  const state = scenarios.happyPath.states.waitForLedgerUpdate1;
  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const action = actions.commitmentReceived(
      ledgerId,
      testScenarios.ledgerCommitments.ledgerUpdate1,
      '0x0',
    );
    playerAReducer(state.protocolState, state.sharedData, action);
    // TODO: We need a "finished" state to test against
  });
});

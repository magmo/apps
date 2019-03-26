import * as states from '../../state';
import * as actions from '../../../../actions';
import * as SigningUtil from '../../../../../utils/signing-utils';
import {
  itTransitionsToChannelStateType,
  itSendsThisMessage,
  itDispatchesThisAction,
} from '../../../../__tests__/helpers';
import * as scenarios from '../../../../__tests__/test-scenarios';

import { openingReducer } from '../reducer';
import { commitmentRelayRequested, COMMITMENT_RELAY_REQUESTED } from 'magmo-wallet-client';
import { channelID } from 'fmg-core/lib/channel';
import * as internalActions from '../../../../internal/actions';
import { WaitForPreFundSetup } from '../../state';
import { WaitForFundingAndPostFundSetup } from '../../funding/state';
import { addHex } from '../../../../../utils/hex-utils';
const {
  bsAddress,
  bsPrivateKey,
  asAddress,
  consensusPreFundCommitment1,
  consensusPreFundCommitment2,
  channelId,
  channelNonce,
  libraryAddress,
  participants,
  asPrivateKey,
  twoThree,
} = scenarios;
const aDefaults = {
  address: asAddress,
  adjudicator: 'adj-address',
  channelId,
  channelNonce,
  libraryAddress,
  networkId: 3,
  participants,
  uid: 'uid',
  transactionHash: '0x0',
  ourIndex: 0,
  privateKey: asPrivateKey,
  allocation: twoThree as [string, string],
  turnNum: 0,
  funded: false,
  appChannelId: '0x0123',
};
const bDefaults = {
  address: bsAddress,
  privateKey: bsPrivateKey,
  appChannelId: '0x0123',
};

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

describe(startingIn(states.SEND_INITIAL_PRE_FUND_SETUP), () => {
  const state = states.sendInitialPreFundSetup(aDefaults);
  describe(whenActionArrives(internalActions.OPEN_LEDGER_CHANNEL), () => {
    const action = internalActions.openLedgerChannel('0x0');

    const expectedSignature = 'PFSB Signature';
    const signMock = jest.fn().mockReturnValue(expectedSignature);
    Object.defineProperty(SigningUtil, 'signCommitment', { value: signMock });

    const updatedState = openingReducer(state, action);
    itTransitionsToChannelStateType(states.WAIT_FOR_PRE_FUND_SETUP, updatedState);
    itSendsThisMessage(updatedState, COMMITMENT_RELAY_REQUESTED);
    it('sends a correct prefund setup', () => {
      const prefundSetupASendAction = commitmentRelayRequested(
        bsAddress,
        consensusPreFundCommitment1,
        expectedSignature,
      );
      expect(updatedState.sideEffects!.messageOutbox).toEqual(prefundSetupASendAction);
    });

    it('updates the last commitment', () => {
      expect((updatedState.state as WaitForPreFundSetup).lastCommitment.commitment).toEqual(
        consensusPreFundCommitment1,
      );
    });
  });
});
describe(startingIn(states.WAIT_FOR_PRE_FUND_SETUP), () => {
  const stateDefaults = {
    ...aDefaults,
    lastCommitment: { commitment: consensusPreFundCommitment1, signature: 'fake-sig' },
  };
  const state = states.waitForPreFundSetup(stateDefaults);
  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const action = actions.commitmentReceived(consensusPreFundCommitment2, 'fake-sig');
    const validateMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });

    const updatedState = openingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
    itDispatchesThisAction(
      internalActions.ledgerChannelOpen(aDefaults.appChannelId, aDefaults.channelId),
      updatedState,
    );
    itDispatchesThisAction(
      internalActions.directFundingRequested(
        channelId,
        '0x00',
        twoThree.reduce(addHex),
        twoThree[0],
        0,
      ),
      updatedState,
    );
  });
});
describe(startingIn(states.WAIT_FOR_INITIAL_PRE_FUND_SETUP), () => {
  const state = states.waitForInitialPreFundSetup(bDefaults);
  describe(whenActionArrives(actions.COMMITMENT_RECEIVED), () => {
    const action = actions.commitmentReceived(consensusPreFundCommitment1, 'fake-sig');

    const expectedSignature = 'PFSB Signature';
    const validateMock = jest.fn().mockReturnValue(true);
    const signMock = jest.fn().mockReturnValue(expectedSignature);
    Object.defineProperty(SigningUtil, 'validCommitmentSignature', { value: validateMock });
    Object.defineProperty(SigningUtil, 'signCommitment', { value: signMock });
    const updatedState = openingReducer(state, action);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_AND_POST_FUND_SETUP, updatedState);
    itSendsThisMessage(updatedState, COMMITMENT_RELAY_REQUESTED);
    itDispatchesThisAction(
      internalActions.ledgerChannelOpen(aDefaults.appChannelId, aDefaults.channelId),
      updatedState,
    );
    itDispatchesThisAction(
      internalActions.directFundingRequested(
        channelId,
        twoThree[0],
        twoThree.reduce(addHex),
        twoThree[1],
        1,
      ),
      updatedState,
    );

    it('sends a correct prefund setup', () => {
      const prefundSetupBSendAction = commitmentRelayRequested(
        asAddress,
        consensusPreFundCommitment2,
        expectedSignature,
      );
      expect(updatedState.sideEffects!.messageOutbox).toEqual(prefundSetupBSendAction);
    });

    it('stores the channel Id in state', () => {
      const commitmentChannelId = channelID(consensusPreFundCommitment1.channel);
      expect((updatedState.state as WaitForFundingAndPostFundSetup).channelId).toEqual(
        commitmentChannelId,
      );
    });
  });
});

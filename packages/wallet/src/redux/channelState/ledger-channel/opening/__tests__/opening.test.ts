import * as states from '../../state';
import * as actions from '../../../../actions';
import * as SigningUtil from '../../../../../utils/signing-utils';
import {
  itTransitionsToChannelStateType,
  itSendsThisMessage,
  itSendsThisDisplayEvent,
} from '../../../../__tests__/helpers';
import * as scenarios from '../../../../__tests__/test-scenarios';

import { openingReducer } from '../reducer';
import {
  commitmentRelayRequested,
  COMMITMENT_RELAY_REQUESTED,
  SHOW_WALLET,
} from 'magmo-wallet-client';
import { channelID } from 'fmg-core/lib/channel';
import { WaitForFundingApproval } from '../../funding/state';
import * as internalActions from '../../../../internal/actions';
import { WaitForPreFundSetup } from '../../state';
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
};
const bDefaults = {
  address: bsAddress,
  privateKey: bsPrivateKey,
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
      expect(updatedState.outboxState!.messageOutbox).toEqual(prefundSetupASendAction);
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

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
    itSendsThisDisplayEvent(updatedState, SHOW_WALLET);
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

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);

    itTransitionsToChannelStateType(states.WAIT_FOR_FUNDING_APPROVAL, updatedState);
    itSendsThisMessage(updatedState, COMMITMENT_RELAY_REQUESTED);
    itSendsThisDisplayEvent(updatedState, SHOW_WALLET);
    it('sends a correct prefund setup', () => {
      const prefundSetupBSendAction = commitmentRelayRequested(
        asAddress,
        consensusPreFundCommitment2,
        expectedSignature,
      );
      expect(updatedState.outboxState!.messageOutbox).toEqual(prefundSetupBSendAction);
    });

    it('stores the channel Id in state', () => {
      const commitmentChannelId = channelID(consensusPreFundCommitment1.channel);
      expect((updatedState.state as WaitForFundingApproval).channelId).toEqual(commitmentChannelId);
    });
  });
});

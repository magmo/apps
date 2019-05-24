import * as scenarios from './scenarios';
import { initialize, existingChannelFundingReducer } from '../reducer';
import * as states from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { getLastMessage } from '../../../state';
import { SignedCommitment } from '../../../../domain';

describe('player A happy path', () => {
  const scenario = scenarios.playerAFullyFundedHappyPath;

  describe('when initializing', () => {
    const { processId, channelId, ledgerId, sharedData, proposedAmount } = scenario.initialize;

    const result = initialize(processId, channelId, ledgerId, proposedAmount, sharedData);
    itTransitionsTo(result, 'ExistingChannelFunding.WaitForLedgerUpdate');
    itSendsMessage(result, scenario.initialize.reply);
  });

  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingChannelFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingChannelFunding.Success');
  });
});

describe('player B happy path', () => {
  const scenario = scenarios.playerBFullyFundedHappyPath;

  describe('when initializing', () => {
    const { processId, channelId, ledgerId, sharedData, proposedAmount } = scenario.initialize;

    const result = initialize(processId, channelId, ledgerId, proposedAmount, sharedData);
    itTransitionsTo(result, 'ExistingChannelFunding.WaitForLedgerUpdate');
  });

  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData, reply } = scenario.waitForLedgerUpdate;
    const updatedState = existingChannelFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingChannelFunding.Success');
    itSendsMessage(updatedState, reply);
  });
});

describe('player A invalid commitment', () => {
  const scenario = scenarios.playerAInvalidCommitment;
  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingChannelFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingChannelFunding.Failure');
  });
});

describe('player B invalid commitment', () => {
  const scenario = scenarios.playerBInvalidCommitment;
  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingChannelFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingChannelFunding.Failure');
  });
});

type ReturnVal = ProtocolStateWithSharedData<states.ExistingChannelFundingState>;
function itTransitionsTo(state: ReturnVal, type: states.ExistingChannelFundingState['type']) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}

function itSendsMessage(state: ReturnVal, message: SignedCommitment) {
  it('sends a message', () => {
    const lastMessage = getLastMessage(state.sharedData);
    if (lastMessage && 'messagePayload' in lastMessage) {
      const dataPayload = lastMessage.messagePayload;
      // This is yuk. The data in a message is currently of 'any' type..
      if (!('signedCommitment' in dataPayload)) {
        fail('No signedCommitment in the last message.');
      }
      const { commitment, signature } = dataPayload.signedCommitment;
      expect({ commitment, signature }).toEqual(message);
    } else {
      fail('No messages in the outbox.');
    }
  });
}

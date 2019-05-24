import * as scenarios from './scenarios';
import { initialize, existingChannelFundingReducer } from '../reducer';
import * as states from '../states';
import { ProtocolStateWithSharedData } from '../..';
import { getLastMessage } from '../../../state';
import { SignedCommitment } from '../../../../domain';

describe('player A happy path', () => {
  const scenario = scenarios.playerAFullyFundedHappyPath;
  const {
    processId,
    channelId,
    ledgerId,
    sharedData,
    proposedAllocation,
    proposedDestination,
  } = scenario.initialize;

  describe('when initializing', () => {
    const result = initialize(
      processId,
      channelId,
      ledgerId,
      proposedAllocation,
      proposedDestination,
      sharedData,
    );
    itTransitionsTo(result, 'ExistingChannelFunding.WaitForLedgerUpdate');
    itSendsMessage(result, scenario.initialize.reply);
  });

  describe('when in WaitForLedgerUpdate', () => {
    const { state, action, sharedData } = scenario.waitForLedgerUpdate;
    const updatedState = existingChannelFundingReducer(state, sharedData, action);
    itTransitionsTo(updatedState, 'ExistingChannelFunding.Success');
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

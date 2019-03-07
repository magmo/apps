import { ChannelState } from '../../states';
import { NextChannelState } from '../../states/shared';

export const itSendsAMessage = (state: NextChannelState<ChannelState>) => {
  it(`sends a message`, () => {
    expect(state.messageOutbox).toEqual(expect.anything());
  });
};

export const itSendsATransaction = (state: NextChannelState<ChannelState>) => {
  it(`sends a transaction`, () => {
    expect(state.transactionOutbox).toEqual(expect.anything());
  });
};

export const itTransitionsToStateType = (type, state: NextChannelState<ChannelState>) => {
  it(`transitions to ${type}`, () => {
    expect(state.channelState.type).toEqual(type);
  });
};

export const itDoesntTransition = (
  oldState: ChannelState,
  newState: NextChannelState<ChannelState>,
) => {
  it(`doesn't transition`, () => {
    expect(newState.channelState.type).toEqual(oldState.type);
  });
};

export const itIncreasesTurnNumBy = (
  increase: number,
  oldState: ChannelState,
  newState: NextChannelState<ChannelState>,
) => {
  it(`increases the turnNum by ${increase}`, () => {
    if (!('turnNum' in newState.channelState) || !('turnNum' in oldState)) {
      fail('turnNum does not exist on one of the states');
    } else {
      expect(newState.channelState.turnNum).toEqual(oldState.turnNum + increase);
    }
  });
};

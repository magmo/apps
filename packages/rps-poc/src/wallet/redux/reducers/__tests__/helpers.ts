import { WalletState } from '../../../states';

export const itSendsAMessage = (state: WalletState) => {
  it(`sends a message`, () => {
    expect(state.messageOutbox).toEqual(expect.anything());
  });
};

export const itTransitionsToStateType = (type, state: WalletState) => {
  it(`transitions to ${type}`, () => {
    expect(state.type).toEqual(type);
  });
};

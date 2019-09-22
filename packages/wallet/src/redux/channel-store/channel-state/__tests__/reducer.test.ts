import { SignedState } from 'nitro-protocol';
import { channelStateReducer } from '../reducer';
import { splitSignature } from 'ethers/utils';
import { WaitForState, waitForValidation, WaitForValidation } from '../state';

describe('channelState Reducer', () => {
  const channel = { participants: [], chainId: '0x1', channelNonce: '0x1' };
  const createTestState = (turnNum: number): SignedState => {
    return {
      state: {
        turnNum,
        channel,
        outcome: [],
        appData: '0x0',
        appDefinition: '0x0',
        isFinal: false,
        challengeDuration: '0x0',
      },
      signature: splitSignature(
        // TODO: Find a better way to create a dummy signature
        '0x30755ed65396facf86c53e6217c52b4daebe72aa4941d89635409de4c9c7f9466d4e9aaec7977f05e923889b33c0d0dd27d7226b6e6f56ce737465c5cfd04be400',
      ),
    };
  };
  describe('when no state exists', () => {
    it('initializes the state', () => {
      const incomingState = createTestState(0);
      const result = channelStateReducer(undefined, {
        type: 'WALLET.COMMON.STATES_RECEIVED',
        signedStates: [incomingState],
        protocolLocator: [],
        processId: '',
      });
      expect(result.state).toMatchObject({
        channel,
        turnNumRecord: 0,
      });
      expect(result.sideEffects).toEqual({
        validationOutbox: {
          statesToValidate: [incomingState],
          previousState: undefined,
        },
      });
    });

    it('throws an exception if no state exists for a state with turnNum > 0', () => {
      expect(() =>
        channelStateReducer(undefined, {
          type: 'WALLET.COMMON.STATES_RECEIVED',
          signedStates: [createTestState(5)],
          protocolLocator: [],
          processId: '',
        }),
      ).toThrowError();
    });
  });

  describe('when in WaitForState', () => {
    const initialChannelState: WaitForState = {
      type: 'Channel.WaitForState',
      channel,
      turnNumRecord: 1,
      signedStates: [createTestState(0), createTestState(1)],
    };
    it('requests validation when receiving a state', () => {
      const incomingState = createTestState(2);
      const result = channelStateReducer(initialChannelState, {
        type: 'WALLET.COMMON.STATES_RECEIVED',
        signedStates: [incomingState],
        protocolLocator: [],
        processId: '',
      });

      expect(result.state).toEqual(
        waitForValidation({ ...initialChannelState, statesBeingValidated: [incomingState] }),
      );
    });

    it('throws an exception when it receives a validation complete action', () => {
      expect(() => {
        channelStateReducer(initialChannelState, {
          type: 'WALLET.CHANNEL.VALIDATION_COMPLETE',
          signedStates: [createTestState(0)],
          valid: true,
        });
      }).toThrowError();
    });
  });

  describe('when it WaitForValidation', () => {
    const validatedState = createTestState(2);
    const initialChannelState: WaitForValidation = {
      type: 'Channel.WaitForValidation',
      channel,
      turnNumRecord: 1,
      signedStates: [createTestState(0), createTestState(1)],
      statesBeingValidated: [validatedState],
    };

    it('stores a state when validated successfully', () => {
      const result = channelStateReducer(initialChannelState, {
        type: 'WALLET.CHANNEL.VALIDATION_COMPLETE',
        valid: true,
        signedStates: [validatedState],
      });

      expect(result.state).toMatchObject({
        ...initialChannelState,
        type: 'Channel.WaitForState',
        turnNumRecord: 2,
        signedStates: [...initialChannelState.signedStates, validatedState],
      });
    });
    it('throws an error when receiving a state received action', () => {
      expect(() => {
        channelStateReducer(initialChannelState, {
          type: 'WALLET.COMMON.STATES_RECEIVED',
          signedStates: [validatedState],
          protocolLocator: [],
          processId: '',
        });
      }).toThrowError();
    });

    it('throws an error when receiving a non valid validation result', () => {
      expect(() => {
        channelStateReducer(initialChannelState, {
          type: 'WALLET.CHANNEL.VALIDATION_COMPLETE',
          valid: false,
          signedStates: [validatedState],
        });
      }).toThrowError();
    });
  });
});

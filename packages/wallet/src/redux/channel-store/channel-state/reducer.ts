import * as channelActions from '../actions';
import { ChannelState, waitForValidation, waitForState } from './state';
import { StateWithSideEffects } from '../../utils';

export const channelStateReducer = (
  state: ChannelState | undefined,
  action: channelActions.ChannelAction,
): StateWithSideEffects<ChannelState> => {
  if (action.signedStates.length === 0) {
    // TODO: This should probably not be an error
    throw new Error('Expected at least one state');
  }
  if (!state) {
    if (action.type === 'WALLET.COMMON.STATES_RECEIVED') {
      const { turnNum } = action.signedStates[0].state;

      if (turnNum !== 0) {
        throw new Error(
          `Received state with turnNum ${turnNum} but no previous channel state exists.`,
        );
      }
    }
    const { channel } = action.signedStates[0].state;
    state = waitForState({
      turnNumRecord: 0,
      signedStates: [],
      channel,
    });
  }
  switch (state.type) {
    case 'Channel.WaitForState':
      if (action.type !== 'WALLET.COMMON.STATES_RECEIVED') {
        // This should never actually happen
        // If it does we want things to blow up right away
        throw new Error('Received validation complete when waiting for a state');
      }
      const previousState =
        state.signedStates.length > 0
          ? state.signedStates[state.signedStates.length - 1]
          : undefined;
      return {
        state: waitForValidation({ ...state, statesBeingValidated: action.signedStates }),
        sideEffects: {
          validationOutbox: {
            statesToValidate: action.signedStates,
            previousState,
          },
        },
      };
    case 'Channel.WaitForValidation':
      if (action.type !== 'WALLET.CHANNEL.VALIDATION_COMPLETE') {
        // This should never actually happen
        // If it does we want things to blow up right away
        throw new Error('Received validation complete when waiting for a state');
      }
      if (!action.valid) {
        // TODO: This should probably by handled by placing a warning message in some kind of outbox
        // for messages to display to the user
        throw new Error(`Validation failed for states ${action.signedStates}`);
      }
      return {
        state: waitForState({
          ...state,
          signedStates: state.signedStates.concat(action.signedStates),
          turnNumRecord: Math.max(...action.signedStates.map(s => s.state.turnNum)),
        }),
      };
  }
};

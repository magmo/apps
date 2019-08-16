import { ActionConstructor } from '../../utils';
import { AdvanceChannelAction, isAdvanceChannelAction } from '../advance-channel';
import { DefundingAction, isDefundingAction } from '../defunding/actions';
import { WalletAction } from '../../actions';

// -------
// Actions
// -------
export interface CloseChannelSelected {
  type: 'WALLET.CONCLUDING.CLOSE_CHANNEL_SELECTED';
  processId: string;
}

// -------
// Constructors
// -------

export const closeChannelSelected: ActionConstructor<CloseChannelSelected> = p => ({
  ...p,
  type: 'WALLET.CONCLUDING.CLOSE_CHANNEL_SELECTED',
});

// -------
// Unions and Guards
// -------

export type ConcludingAction = CloseChannelSelected | AdvanceChannelAction | DefundingAction;

export const isConcludingAction = (action: WalletAction): action is ConcludingAction => {
  return (
    action.type === 'WALLET.CONCLUDING.CLOSE_CHANNEL_SELECTED' ||
    isAdvanceChannelAction(action) ||
    isDefundingAction(action)
  );
};

import { CommitmentReceived, COMMITMENT_RECEIVED, WalletAction } from '../../actions';
// -------
// Actions
// -------

// --------
// Constructors
// --------

// --------
// Unions and Guards
// --------

export type IndirectDefundingAction = CommitmentReceived;

export function isIndirectDefundingAction(action: WalletAction): action is IndirectDefundingAction {
  return action.type === COMMITMENT_RECEIVED;
}

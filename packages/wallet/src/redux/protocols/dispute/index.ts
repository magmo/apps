import { WalletAction } from '../../../redux/actions';
import { ChallengerAction, isChallengerAction } from './challenger/actions';
import { isResponderAction, ResponderAction } from './responder/actions';

export { initialize as initializeResponder } from './responder/reducer';
export { initialize as initializeChallenger } from './challenger/reducer';

export type DisputeAction = ChallengerAction | ResponderAction;

export function isDisputeAction(action: WalletAction): action is DisputeAction {
  return isChallengerAction(action) || isResponderAction(action);
}

import { ChallengerAction, isChallengerAction } from './challenger/actions';
import { ResponderAction, isResponderAction } from './responder/actions';
import { WalletAction } from '../../../redux/actions';

export { initialize as initializeResponder } from './responder/reducer';
export { initialize as initializeChallenger } from './challenger/reducer';

export type DisputeAction = ChallengerAction | ResponderAction;

export function isDisputeAction(action: WalletAction): action is DisputeAction {
  return isChallengerAction(action) || isResponderAction(action);
}

export {
  acknowledgeResponse as challengerPreSuccessOpenState,
  acknowledgeTimeout as challengerPreSuccessClosedState,
  acknowledged as terminatingAction,
} from './challenger/__tests__/scenarios';

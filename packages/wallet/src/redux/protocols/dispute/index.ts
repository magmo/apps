import { ChallengerAction } from './challenger/actions';
import { ResponderAction } from './responder/actions';

export type DisputeAction = ChallengerAction | ResponderAction;

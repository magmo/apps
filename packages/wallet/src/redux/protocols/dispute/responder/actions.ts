import { BaseProcessAction } from '../../actions';
import { Commitment } from '../../../../domain';
import { TransactionAction } from '../../transaction-submission/actions';
import {
  ProtocolAction,
  isTransactionAction,
  ChallengeExpiredEvent,
  ChallengeExpirySetEvent,
  CHALLENGE_EXPIRY_SET_EVENT,
  CHALLENGE_EXPIRED_EVENT,
} from '../../../actions';
import { isDefundingAction } from '../../defunding/actions';
import { ActionConstructor } from '../../../utils';

// -------
// Actions
// -------

export interface RespondApproved extends BaseProcessAction {
  type: 'WALLET.CHALLENGING.RESPONDER.RESPOND_APPROVED';
  processId: string;
}

export interface ResponseProvided extends BaseProcessAction {
  type: 'WALLET.CHALLENGING.RESPONDER.RESPONSE_PROVIDED';
  processId: string;
  commitment: Commitment;
}

export interface RespondSuccessAcknowledged extends BaseProcessAction {
  type: 'WALLET.CHALLENGING.RESPONDER.RESPOND_SUCCESS_ACKNOWLEDGED';
  processId: string;
}

export interface DefundChosen extends BaseProcessAction {
  type: 'WALLET.CHALLENGING.RESPONDER.DEFUND_CHOSEN';
  processId: string;
}
export interface Acknowledged extends BaseProcessAction {
  type: 'WALLET.CHALLENGING.RESPONDER.ACKNOWLEDGED';
  processId: string;
}

// --------
// Constructors
// --------

export const respondApproved: ActionConstructor<RespondApproved> = p => ({
  type: 'WALLET.CHALLENGING.RESPONDER.RESPOND_APPROVED',
  processId: p.processId,
});

export const respondSuccessAcknowledged: ActionConstructor<RespondSuccessAcknowledged> = p => ({
  type: 'WALLET.CHALLENGING.RESPONDER.RESPOND_SUCCESS_ACKNOWLEDGED',
  processId: p.processId,
});

export const responseProvided: ActionConstructor<ResponseProvided> = p => ({
  type: 'WALLET.CHALLENGING.RESPONDER.RESPONSE_PROVIDED',
  processId: p.processId,
  commitment: p.commitment,
});

export const defundChosen: ActionConstructor<DefundChosen> = p => ({
  type: 'WALLET.CHALLENGING.RESPONDER.DEFUND_CHOSEN',
  processId: p.processId,
});

export const acknowledged: ActionConstructor<Acknowledged> = p => ({
  type: 'WALLET.CHALLENGING.RESPONDER.ACKNOWLEDGED',
  processId: p.processId,
});

// -------
// Unions and Guards
// -------

export type ResponderAction =
  | RespondApproved
  | ResponseProvided
  | RespondSuccessAcknowledged
  | TransactionAction
  | ChallengeExpiredEvent
  | ChallengeExpirySetEvent
  | DefundChosen
  | Acknowledged;

export function isResponderAction(action: ProtocolAction): action is ResponderAction {
  return (
    isTransactionAction(action) ||
    isDefundingAction(action) ||
    action.type === 'WALLET.CHALLENGING.RESPONDER.RESPOND_APPROVED' ||
    action.type === 'WALLET.CHALLENGING.RESPONDER.RESPONSE_PROVIDED' ||
    action.type === 'WALLET.CHALLENGING.RESPONDER.RESPOND_SUCCESS_ACKNOWLEDGED' ||
    action.type === CHALLENGE_EXPIRY_SET_EVENT ||
    action.type === CHALLENGE_EXPIRED_EVENT ||
    action.type === 'WALLET.CHALLENGING.RESPONDER.DEFUND_CHOSEN' ||
    action.type === 'WALLET.CHALLENGING.RESPONDER.ACKNOWLEDGED'
  );
}

import { ProtocolState } from '..';
import {
  ChallengerState,
  isChallengerState,
  isTerminal as isChallengerTerminal,
  NonTerminalChallengerState,
  TerminalChallengerState,
} from './challenger/states';
import {
  isResponderState,
  isTerminal as isResponderTerminal,
  NonTerminalResponderState,
  ResponderState,
  TerminalResponderState,
} from './responder/states';

export type DisputeState = ResponderState | ChallengerState;

export function isTerminal(
  state: DisputeState,
): state is TerminalChallengerState | TerminalResponderState {
  return (
    (isChallengerState(state) && isChallengerTerminal(state)) ||
    (isResponderState(state) && isResponderTerminal(state))
  );
}

export function isDisputeState(state: ProtocolState): state is ChallengerState {
  return isChallengerState(state) || isResponderState(state);
}

export function isNonTerminalDisputeState(
  state: ProtocolState,
): state is NonTerminalChallengerState | NonTerminalResponderState {
  return isDisputeState(state) && !isTerminal(state);
}

import { WalletProtocol } from '../types';
import { WalletAction } from '../actions';

export interface ProtocolAction {
  protocol: WalletProtocol;
}

export function isProtocolAction(action: WalletAction) {
  return 'protocol' in action;
}

export interface ProcessAction {
  processId: string;
  protocol: WalletProtocol;
}

export function isProcessAction(action: WalletAction) {
  return 'processId' in action && 'protocol' in action;
}

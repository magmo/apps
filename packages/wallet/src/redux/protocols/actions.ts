import { WalletProtocol } from '../types';
import { WalletAction } from '../actions';

export interface NewProcessAction {
  protocol: WalletProtocol;
}

export function createsNewProcess(action: WalletAction) {
  return 'protocol' in action;
}

export interface ProcessAction {
  processId: string;
}

export function routesToProcess(action: WalletAction) {
  return 'processId' in action;
}

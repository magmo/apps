import { WalletProtocol } from '../types';
import { WalletAction } from '../actions';

export interface NewProcessAction {
  protocol: WalletProtocol;
}

export function createsNewProcess(action: WalletAction) {
  if ('protocol' in action) {
    if ('processId in action') {
      throw new Error('Action cannot have both protocol and processId');
    }

    return true;
  }
  return false;
}

export interface ProcessAction {
  processId: string;
}

export function routesToProcess(action: WalletAction) {
  return 'processId' in action;
}

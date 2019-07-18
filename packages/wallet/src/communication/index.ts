import { Commitment, SignedCommitment } from '../domain';
import { messageRelayRequested } from 'magmo-wallet-client';
import {
  RelayableAction,
  strategyProposed,
  strategyApproved,
  commitmentReceived,
  concludeInstigated,
  ConcludeInstigated,
  commitmentsReceived,
} from './actions';
export * from './actions';

// These protocols are precisely those that run at the top-level
export const enum ProcessProtocol {
  Application = 'Application',
  Funding = 'Funding',
  Defunding = 'Defunding',
  Concluding = 'Concluding',
}

export const enum EmbeddedProtocol {
  AdvanceChannel = 'AdvanceChannel',
  ConsensusUpdate = 'ConsensusUpdate',
  DirectFunding = 'DirectFunding', // TODO: Post-fund-setup exchange will be removed from direct funding, so this should be removed
  ExistingLedgerFunding = 'ExistingLedgerFunding',
  IndirectDefunding = 'IndirectDefunding',
  IndirectFunding = 'IndirectFunding',
  LedgerTopUp = 'LedgerTopUp',
  NewLedgerFunding = 'NewLedgerFunding',
  VirtualFunding = 'VirtualFunding',
  ChannelSync = 'ChannelSync',
}

export type ProtocolLocator = EmbeddedProtocol[];
export type FundingStrategy = 'IndirectFundingStrategy';

function sendMessage(to: string, message: RelayableAction) {
  return messageRelayRequested(to, message);
}

export function sendStrategyProposed(to: string, processId: string, strategy: FundingStrategy) {
  return sendMessage(to, strategyProposed({ processId, strategy }));
}

export function sendStrategyApproved(to: string, processId: string) {
  return sendMessage(to, strategyApproved({ processId }));
}

export function sendConcludeInstigated(to: string, channelId, signedCommitment: SignedCommitment) {
  return sendMessage(to, concludeInstigated({ signedCommitment, channelId }));
}

export const sendCommitmentReceived = (
  to: string,
  processId: string,
  commitment: Commitment,
  signature: string,
  protocolLocator: ProtocolLocator = [],
) => {
  const payload = commitmentReceived({
    processId,
    signedCommitment: { commitment, signature },
    protocolLocator,
  });
  return messageRelayRequested(to, payload);
};

export const sendCommitmentsReceived = (
  to: string,
  processId: string,
  signedCommitments: SignedCommitment[],
  protocolLocator: ProtocolLocator,
) => {
  const payload = commitmentsReceived({ processId, signedCommitments, protocolLocator });
  return messageRelayRequested(to, payload);
};

export type StartProcessAction = ConcludeInstigated;
export function isStartProcessAction(a: { type: string }): a is StartProcessAction {
  return a.type === 'WALLET.NEW_PROCESS.CONCLUDE_INSTIGATED';
}

export function getProcessId(action: StartProcessAction) {
  return `${action.protocol}-${action.channelId}`;
}

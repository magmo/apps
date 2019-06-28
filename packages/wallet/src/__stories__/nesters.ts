import { waitForLedgerDefunding, waitForWithdrawal } from '../redux/protocols/defunding/states';
import {
  isTerminal as DFIsTerminal,
  NonTerminalDirectFundingState,
} from '../redux/protocols/direct-funding/states';
import {
  isTerminal as iddfIsTerminal,
  NonTerminalIndirectDefundingState,
} from '../redux/protocols/indirect-defunding/states';
import {
  aWaitForDirectFunding,
  isTerminal as idFIsTerminal,
  NonTerminalNewLedgerFundingState,
} from '../redux/protocols/new-ledger-funding/states';
import {
  isTerminal as tsIsTerminal,
  NonTerminalTransactionSubmissionState,
} from '../redux/protocols/transaction-submission/states';
import {
  isTerminal as wIsTerminal,
  NonTerminalWithdrawalState,
} from '../redux/protocols/withdrawing/states';

import { isIndirectDefundingState } from '../redux/protocols/indirect-defunding/states';
import { isNewLedgerFundingState } from '../redux/protocols/new-ledger-funding/states';
import { isTransactionSubmissionState } from '../redux/protocols/transaction-submission/states';
import { isWithdrawalState } from '../redux/protocols/withdrawing/states';

import { ProtocolState } from '../redux/protocols';
import { isDirectFundingState } from '../redux/protocols/direct-funding/states';
import { waitForTransaction } from '../redux/protocols/dispute/challenger/states';
import { waitForFunding } from '../redux/protocols/funding/player-b/states';

// -------
// Nester
// -------

export function nestProtocolState(protocolState: ProtocolState): ProtocolState {
  if (isTransactionSubmissionState(protocolState) && !tsIsTerminal(protocolState)) {
    return nestInDispute(protocolState);
  }

  if (
    (isIndirectDefundingState(protocolState) && !iddfIsTerminal(protocolState)) ||
    (isWithdrawalState(protocolState) && !wIsTerminal(protocolState))
  ) {
    return nestInDefunding(protocolState);
  }

  if (isNewLedgerFundingState(protocolState) && !idFIsTerminal(protocolState)) {
    return nestInFunding(protocolState);
  }

  if (isDirectFundingState(protocolState) && !DFIsTerminal(protocolState)) {
    return nestInFunding(nestInNewLedgerFunding(protocolState));
  }
  return protocolState;
}

function nestInDispute(transactionSubmissionState: NonTerminalTransactionSubmissionState) {
  return waitForTransaction({
    ...transactionSubmissionState,
    transactionSubmission: transactionSubmissionState,
  });
}

function nestInNewLedgerFunding(directFundingState: NonTerminalDirectFundingState) {
  return aWaitForDirectFunding({
    ...directFundingState,
    directFundingState,
    targetChannelId: 'dummy',
    opponentAddress: 'dummy',
    ledgerId: 'dummy',
  });
}

function nestInFunding(protocolState: NonTerminalNewLedgerFundingState) {
  return waitForFunding({
    ...protocolState,
    fundingState: protocolState,
    targetChannelId: 'dummy',
    opponentAddress: 'dummy',
    ourAddress: 'dummy',
  });
}

function nestInDefunding(
  protocolState: NonTerminalWithdrawalState | NonTerminalIndirectDefundingState,
) {
  if (isWithdrawalState(protocolState)) {
    return waitForWithdrawal({ ...protocolState, withdrawalState: protocolState });
  }
  return waitForLedgerDefunding({ ...protocolState, indirectDefundingState: protocolState });
}

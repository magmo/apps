import { put } from 'redux-saga/effects';
import { CommitmentReceived, WalletProtocol } from '../../communication';
import { responseProvided } from '../protocols/dispute/responder/actions';
import { getChannelId } from '../../domain';
import { internalMessageSent } from '../actions';

export function* internalMessageSender(message) {
  if (message.messagePayload.type === 'WALLET.COMMON.COMMITMENT_RECEIVED') {
    // dispatch internal action (e.g. for a ledger channel)
    const payload = message.messagePayload as CommitmentReceived; // TODO avoid casting
    const channelId = getChannelId(payload.signedCommitment.commitment);
    const processId = `${WalletProtocol.Dispute}-${channelId}`;
    yield put(responseProvided({ processId, commitment: payload.signedCommitment.commitment }));
  }
  yield put(message);
  yield put(internalMessageSent({}));
}

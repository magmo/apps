import { messageRelayRequested } from 'magmo-wallet-client';
import { strategyProposed, strategyApproved } from '..';
import { commitmentReceived } from '../../redux/actions';
import {
  signedCommitment0,
  signedCommitment1,
  signedCommitment2,
  signedCommitment3,
  signedCommitment51,
  signedCommitment52,
  signedLedgerCommitments,
} from './commitments';
const {
  signedLedgerCommitment0,
  signedLedgerCommitment1,
  signedLedgerCommitment2,
  signedLedgerCommitment3,
  signedLedgerCommitment4,
  signedLedgerCommitment5,
} = signedLedgerCommitments;

export const asAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
export const bsAddress = '0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb';

const applicationProcessId = 'Application';
const fundingProcessId = 'Funding';
const concludeProcessId = 'Conclude';

const sendAppPrefundSetup = messageRelayRequested(bsAddress, {
  processId: applicationProcessId,
  data: commitmentReceived(fundingProcessId, signedCommitment0),
});

const respondToAppPreFundSetup = messageRelayRequested(asAddress, {
  processId: applicationProcessId,
  data: commitmentReceived(fundingProcessId, signedCommitment1),
});

const indirectStrategyChosen = messageRelayRequested(bsAddress, {
  processId: fundingProcessId,
  data: strategyProposed(fundingProcessId, 'IndirectFundingStrategy'),
});

const indirectStrategyApproved = messageRelayRequested(asAddress, {
  processId: fundingProcessId,
  data: strategyApproved(fundingProcessId),
});

const sendLedgerPrefundSetup = messageRelayRequested(bsAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedLedgerCommitment0),
});

const respondToLedgerPreFundSetup = messageRelayRequested(asAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedLedgerCommitment1),
});

const sendLedgerPostfundSetup = messageRelayRequested(bsAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedLedgerCommitment2),
});

const respondToLedgerPostFundSetup = messageRelayRequested(asAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedLedgerCommitment3),
});

const sendLedgerUpdate = messageRelayRequested(bsAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedLedgerCommitment4),
});

const respondToLedgerUpdate = messageRelayRequested(asAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedLedgerCommitment5),
});

const sendAppPostFundSetup = messageRelayRequested(bsAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedCommitment2),
});

const respondToAppPostFundSetup = messageRelayRequested(asAddress, {
  processId: fundingProcessId,
  data: commitmentReceived(fundingProcessId, signedCommitment3),
});

const concludeGame = messageRelayRequested(bsAddress, {
  processId: concludeProcessId,
  data: commitmentReceived(fundingProcessId, signedCommitment51),
});

const respondToConclude = messageRelayRequested(asAddress, {
  processId: concludeProcessId,
  data: commitmentReceived(fundingProcessId, signedCommitment52),
});

export default {
  sendAppPrefundSetup,
  respondToAppPreFundSetup,
  indirectStrategyChosen,
  indirectStrategyApproved,
  sendLedgerPrefundSetup,
  respondToLedgerPreFundSetup,
  sendLedgerPostfundSetup,
  respondToLedgerPostFundSetup,
  sendLedgerUpdate,
  respondToLedgerUpdate,
  sendAppPostFundSetup,
  respondToAppPostFundSetup,
  concludeGame,
  respondToConclude,
};

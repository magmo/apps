import { ethers } from 'ethers';
import { Signature } from 'fmg-core';
import { channelID } from 'fmg-core/lib/channel';
import * as communication from 'magmo-wallet/lib/src/communication';
import {
  CommitmentReceived,
  RelayableAction,
  StrategyProposed,
} from 'magmo-wallet/lib/src/communication';
import { errors } from '../../wallet';
import { getCurrentCommitment } from '../../wallet/db/queries/getCurrentCommitment';
import { getProcess } from '../../wallet/db/queries/walletProcess';
import { updateLedgerChannel } from '../../wallet/services';
import { asConsensusCommitment } from '../../wallet/services/ledger-commitment';
import { updateRPSChannel } from '../services/rpsChannelManager';

export async function handleOngoingProcessAction(ctx) {
  const action: RelayableAction = ctx.request.body;
  switch (action.type) {
    case 'WALLET.NEW_PROCESS.CONCLUDE_INSTIGATED':
    case 'WALLET.FUNDING.STRATEGY_APPROVED':
      return ctx;
    case 'WALLET.COMMON.COMMITMENT_RECEIVED':
      return handleCommitmentReceived(ctx, action);
    case 'WALLET.FUNDING.STRATEGY_PROPOSED':
      return handleStrategyProposed(ctx, action);
  }
}

async function handleStrategyProposed(ctx, action: StrategyProposed) {
  const { processId } = action;
  const process = await getProcess(processId);
  if (!process) {
    throw errors.processMissing(processId);
  }

  const { theirAddress } = process;
  ctx.body = communication.sendStrategyApproved(theirAddress, processId);
  ctx.status = 200;

  return ctx;
}

async function handleCommitmentReceived(ctx, action: CommitmentReceived) {
  {
    const { processId } = action;
    const walletProcess = await getProcess(processId);
    if (!walletProcess) {
      throw errors.processMissing(processId);
    }
    const { theirAddress } = walletProcess;
    const { commitment: theirCommitment, signature: theirSignature } = action.signedCommitment;
    const splitSignature = (ethers.utils.splitSignature(theirSignature) as unknown) as Signature;

    const channelId = channelID(theirCommitment.channel);

    if (channelId === walletProcess.appChannelId) {
      const { commitment: ourCommitment, signature: ourSignature } = await updateRPSChannel(
        theirCommitment,
        splitSignature,
      );
      ctx.body = communication.sendCommitmentReceived(
        theirAddress,
        processId,
        ourCommitment,
        (ourSignature as unknown) as string,
      );
      return ctx;
    }

    const currentCommitment = await getCurrentCommitment(theirCommitment);
    const { commitment, signature } = await updateLedgerChannel(
      asConsensusCommitment(theirCommitment),
      splitSignature,
      currentCommitment && asConsensusCommitment(currentCommitment),
    );
    ctx.status = 201;
    ctx.body = communication.sendCommitmentReceived(
      theirAddress,
      processId,
      commitment,
      (signature as unknown) as string,
    );

    return ctx;
  }
}

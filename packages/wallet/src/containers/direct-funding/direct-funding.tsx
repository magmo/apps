import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { DirectFundingState } from 'src/redux/direct-funding-store/direct-funding-state/state';
import EtherscanLink from '../../components/etherscan-link';
import { FundingStep, fundingStepByState } from '../../components/funding/funding-step';
import TransactionFailed from '../../components/transaction-failed';
import * as actions from '../../redux/actions';
import * as fundingStore from '../../redux/direct-funding-store/state';
import { WalletProcedure } from '../../redux/types';
import { unreachable } from '../../utils/reducer-utils';

interface Props {
  state: DirectFundingState;
  channelId: string;
  fundingSuccessAcknowledged: () => void;
  fundingDeclinedAcknowledged: () => void;
  retryTransactionAction: (channelId: string, procedure: WalletProcedure) => void;
}

class DirectFundingContainer extends PureComponent<Props> {
  render() {
    const { state, retryTransactionAction } = this.props;
    const step = fundingStepByState(state);
    if (
      fundingStore.states.stateIsNotSafeToDeposit(state) ||
      fundingStore.states.stateIsWaitForFundingConfirmation(state)
    ) {
      return <FundingStep step={step} />;
    }
    if (fundingStore.states.stateIsDepositing(state)) {
      switch (state.depositStatus) {
        case fundingStore.states.depositing.WAIT_FOR_TRANSACTION_SENT:
          return <FundingStep step={step} />;
        case fundingStore.states.depositing.WAIT_FOR_DEPOSIT_APPROVAL:
          return <FundingStep step={step}>Please confirm the transaction in MetaMask!</FundingStep>;
        case fundingStore.states.depositing.WAIT_FOR_DEPOSIT_CONFIRMATION:
          return (
            <FundingStep step={step}>
              Check the progress on&nbsp;
              <EtherscanLink
                transactionID={state.transactionHash}
                networkId={-1} // TODO: Fix network id
                title="Etherscan"
              />
              !
            </FundingStep>
          );
        case fundingStore.states.depositing.DEPOSIT_TRANSACTION_FAILED:
          return (
            <TransactionFailed
              name="deposit"
              retryAction={() =>
                retryTransactionAction(state.channelId, WalletProcedure.DirectFunding)
              }
            />
          );

        default:
          return unreachable(state);
      }
    }
    if (fundingStore.states.stateIsChannelFunded(state)) {
      return null;
    }

    return unreachable(state);
  }
}

const mapDispatchToProps = {
  fundingApproved: actions.channel.fundingApproved,
  fundingRejected: actions.channel.fundingRejected,
  fundingSuccessAcknowledged: actions.channel.fundingSuccessAcknowledged,
  fundingDeclinedAcknowledged: actions.channel.fundingDeclinedAcknowledged,
  retryTransactionAction: actions.retryTransaction,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  () => ({}),
  mapDispatchToProps,
)(DirectFundingContainer);

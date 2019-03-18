import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import * as fundingStates from '../redux/fundingState/state';
import * as actions from '../redux/actions';

import { unreachable } from '../utils/reducer-utils';
import ApproveFunding from '../components/funding/ApproveFunding';
import { FundingStep } from '../components/funding/FundingStep';
import EtherscanLink from '../components/EtherscanLink';
import TransactionFailed from '../components/TransactionFailed';

interface Props {
  state: fundingStates.DirectFundingState;
  fundingApproved: () => void;
  fundingRejected: () => void;
  fundingSuccessAcknowledged: () => void;
  fundingDeclinedAcknowledged: () => void;
  retryTransactionAction: () => void;
}

class DirectFundingContainer extends PureComponent<Props> {
  render() {
    const { state, fundingApproved, fundingRejected, retryTransactionAction } = this.props;
    if (fundingStates.stateIsWaitForFundingApproval(state)) {
      return (
        <ApproveFunding
          fundingApproved={fundingApproved}
          fundingRejected={fundingRejected}
          requestedTotalFunds={state.requestedTotalFunds}
          requestedYourContribution={state.requestedYourContribution}
        />
      );
    }
    if (
      fundingStates.stateIsNotSafeToDeposit(state) ||
      fundingStates.stateIsWaitForFundingConfirmation(state)
    ) {
      return <FundingStep state={state} />;
    }
    if (fundingStates.stateIsDepositing(state)) {
      switch (state.depositStatus) {
        case fundingStates.depositing.WAIT_FOR_TRANSACTION_SENT:
          return <FundingStep state={state} />;
        case fundingStates.depositing.WAIT_FOR_DEPOSIT_APPROVAL:
          return (
            <FundingStep state={state}>Please confirm the transaction in MetaMask!</FundingStep>
          );
        case fundingStates.depositing.WAIT_FOR_DEPOSIT_CONFIRMATION:
          return (
            <FundingStep state={state}>
              Check the progress on&nbsp;
              <EtherscanLink
                transactionID={state.transactionHash}
                networkId={-1} // TODO: Fix network id
                title="Etherscan"
              />
              !
            </FundingStep>
          );
        case fundingStates.depositing.DEPOSIT_TRANSACTION_FAILED:
          return <TransactionFailed name="deposit" retryAction={retryTransactionAction} />;
      }
    }
    if (fundingStates.stateIsChannelFunded(state)) {
      return null;
    }

    return unreachable(state);
  }
}

const mapDispatchToProps = {
  fundingApproved: actions.fundingApproved,
  fundingRejected: actions.fundingRejected,
  fundingSuccessAcknowledged: actions.fundingSuccessAcknowledged,
  fundingDeclinedAcknowledged: actions.fundingDeclinedAcknowledged,
  retryTransactionAction: actions.retryTransaction,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  () => ({}),
  mapDispatchToProps,
)(DirectFundingContainer);

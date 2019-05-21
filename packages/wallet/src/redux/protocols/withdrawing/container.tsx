import * as states from './states';
import { PureComponent } from 'react';
import { TransactionSubmission } from '../transaction-submission/container';
import React from 'react';
import { unreachable } from '../../../utils/reducer-utils';
import { connect } from 'react-redux';
import * as actions from './actions';
import WaitForApproval from './components/wait-for-approval';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import Acknowledge from '../shared-components/acknowledge';

interface Props {
  state: states.WithdrawalState;
  withdrawalApproved: (processId: string, withdrawalAddress: string) => void;
  withdrawalRejected: (processId: string) => void;
  withdrawalSuccessAcknowledged: (processId: string) => void;
}

class WithdrawalContainer extends PureComponent<Props> {
  render() {
    const {
      state,
      withdrawalApproved,
      withdrawalRejected,
      withdrawalSuccessAcknowledged,
    } = this.props;
    switch (state.type) {
      case 'Withdrawing.WaitforApproval':
        return (
          <WaitForApproval
            withdrawalAmount={state.withdrawalAmount}
            approve={address => withdrawalApproved(state.processId, address)}
            deny={() => withdrawalRejected(state.processId)}
          />
        );
      case 'Withdrawing.WaitForTransaction':
        return (
          <TransactionSubmission
            state={state.transactionSubmissionState}
            transactionName="Withdraw"
          />
        );
      case 'Withdrawing.WaitForAcknowledgement':
        return (
          <Acknowledge
            title="Withdraw Complete"
            description="You have successfully withdrawn your funds."
            acknowledge={() => withdrawalSuccessAcknowledged(state.processId)}
          />
        );
      case 'Withdrawing.Failure':
        return <Failure name="withdraw" reason={state.reason} />;
      case 'Withdrawing.Success':
        return <Success name="withdraw" />;
      default:
        return unreachable(state);
    }
  }
}
const mapDispatchToProps = {
  withdrawalApproved: actions.withdrawalApproved,
  withdrawalRejected: actions.withdrawalRejected,
  withdrawalSuccessAcknowledged: actions.withdrawalSuccessAcknowledged,
};

export const Withdrawal = connect(
  () => ({}),
  mapDispatchToProps,
)(WithdrawalContainer);

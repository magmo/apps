import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { unreachable } from '../../../utils/reducer-utils';
import { ActionConstructor } from '../../utils';
import Acknowledge from '../shared-components/acknowledge';
import Failure from '../shared-components/failure';
import Success from '../shared-components/success';
import { TransactionSubmission } from '../transaction-submission/container';
import * as actions from './actions';
import WaitForApproval from './components/wait-for-approval';
import * as states from './states';

interface Props {
  state: states.WithdrawalState;
  withdrawalApproved: ActionConstructor<actions.WithdrawalApproved>;
  withdrawalRejected: ActionConstructor<actions.WithdrawalRejected>;
  withdrawalSuccessAcknowledged: ActionConstructor<actions.WithdrawalSuccessAcknowledged>;
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
            approve={withdrawalAddress =>
              withdrawalApproved({ processId: state.processId, withdrawalAddress })
            }
            deny={() => withdrawalRejected({ processId: state.processId })}
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
            acknowledge={() => withdrawalSuccessAcknowledged({ processId: state.processId })}
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

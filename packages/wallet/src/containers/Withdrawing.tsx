import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import * as states from '../states';
import * as actions from '../redux/actions';

import AcknowledgeX from '../components/AcknowledgeX';
import WaitForXConfirmation from '../components/WaitForXConfirmation';
import WaitForXInitiation from '../components/WaitForXInitiation';
import { unreachable } from '../utils/reducer-utils';
import TransactionFailed from '../components/TransactionFailed';
import SelectAddress from '../components/withdrawing/SelectAddress';

interface Props {
  state: states.WithdrawingState;
  withdrawalApproved: (destinationAddress: string) => void;
  withdrawalRejected: () => void;
  withdrawalSuccessAcknowledged: () => void;
  retryTransaction: () => void;
}

class WithdrawingContainer extends PureComponent<Props> {
  render() {
    const {
      state,
      withdrawalApproved,
      withdrawalSuccessAcknowledged,
      withdrawalRejected,
      retryTransaction,
    } = this.props;

    switch (state.type) {
      case states.APPROVE_WITHDRAWAL:
        return (
          <SelectAddress
            approveWithdrawal={withdrawalApproved}
            declineWithdrawal={withdrawalRejected} />
        );
      case states.WAIT_FOR_WITHDRAWAL_INITIATION:
        return <WaitForXInitiation name="withdrawal" />;
      case states.WAIT_FOR_WITHDRAWAL_CONFIRMATION:
        return <WaitForXConfirmation name="withdrawal" transactionID={state.transactionHash} networkId={state.networkId} />;
      case states.ACKNOWLEDGE_WITHDRAWAL_SUCCESS:
        return (
          <AcknowledgeX
            title="Withdrawal successful!"
            description="You have successfully withdrawn your funds."
            action={withdrawalSuccessAcknowledged}
            actionTitle="Return to app"
          />
        );
      case states.WITHDRAW_TRANSACTION_FAILED:
        return <TransactionFailed name='withdraw' retryAction={retryTransaction} />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  withdrawalApproved: actions.withdrawalApproved,
  withdrawalRejected: actions.withdrawalRejected,
  withdrawalSuccessAcknowledged: actions.withdrawalSuccessAcknowledged,
  retryTransaction: actions.retryTransaction,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  () => ({}),
  mapDispatchToProps,
)(WithdrawingContainer);

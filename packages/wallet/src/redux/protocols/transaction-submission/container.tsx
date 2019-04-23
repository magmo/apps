import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { NonTerminalTransactionSubmissionState } from './states';
import { unreachable } from '../../../utils/reducer-utils';
import * as states from './states';
import WaitForConfirmation from './components/wait-for-confirmation';
import WaitForSubmission from './components/wait-for-submission';
import { NETWORK_ID } from '../../../constants';
import ApproveRetry from './components/approve-retry';
import * as actions from './actions';

interface Props {
  state: NonTerminalTransactionSubmissionState;
  transactionName: string;
  transactionRetryApproved: (processId: string) => void;
  transactionRetryDenied: (processId: string) => void;
}

class TransactionSubmissionContainer extends PureComponent<Props> {
  render() {
    const { state, transactionName, transactionRetryApproved, transactionRetryDenied } = this.props;
    switch (state.type) {
      case states.WAIT_FOR_SEND:
      case states.WAIT_FOR_SUBMISSION:
        return <WaitForSubmission name={transactionName} />;
      case states.WAIT_FOR_CONFIRMATION:
        return (
          <WaitForConfirmation
            name={transactionName}
            transactionId={state.transactionHash}
            networkId={NETWORK_ID}
          />
        );
      case states.APPROVE_RETRY:
        return (
          <ApproveRetry
            name={transactionName}
            approve={() => transactionRetryApproved(state.processId)}
            deny={() => transactionRetryDenied(state.processId)}
          />
        );
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  transactionRetryApproved: actions.transactionRetryApproved,
  transactionRetryDenied: actions.transactionRetryDenied,
};

export const TransactionSubmission = connect(
  () => ({}),
  mapDispatchToProps,
)(TransactionSubmissionContainer);

import * as states from './states';
import * as actions from './actions';
import { PureComponent } from 'react';
import { Commitment } from '../../../../domain';
import React from 'react';
import { unreachable } from '../../../../utils/reducer-utils';
import Acknowledge from '../../shared-components/acknowledge';
import WaitForApproval from './components/wait-for-approval';
import { TransactionSubmission } from '../../transaction-submission/container';
import { Defunding } from '../../defunding/container';

import { connect } from 'react-redux';

interface Props {
  state: states.NonTerminalResponderState;
  respondApproved: (processId: string) => void;
  respondSuccessAcknowledged: (processId: string) => void;
  responseProvided: (processId: string, commitment: Commitment) => void;
  acknowledged: (processId: string) => void;
  defundChosen: (processId: string) => void;
}
class ResponderContainer extends PureComponent<Props> {
  render() {
    const {
      state,
      respondSuccessAcknowledged,
      respondApproved,
      acknowledged,
      defundChosen,
    } = this.props;
    switch (state.type) {
      case 'Responding.WaitForAcknowledgement':
        return (
          <Acknowledge
            title="Response Complete"
            description="You have successfully responded to the challenge."
            acknowledge={() => respondSuccessAcknowledged(state.processId)}
          />
        );
      case 'Responding.WaitForApproval':
        return <WaitForApproval approve={() => respondApproved(state.processId)} />;
      case 'Responding.WaitForResponse':
        // TODO: Should this ever been seen? We expect protocol above this to figure out getting the response
        return <div>Waiting for response</div>;
      case 'Responding.WaitForTransaction':
        return (
          <TransactionSubmission
            state={state.transactionSubmissionState}
            transactionName="Respond"
          />
        );
      case 'Responding.AcknowledgeClosedButNotDefunded':
        return (
          <Acknowledge
            title="Defunding failed!"
            description="The channel was closed but not defunded."
            acknowledge={() => acknowledged(state.processId)}
          />
        );
      case 'Responding.AcknowledgeDefundingSuccess':
        return (
          <Acknowledge
            title="Defunding success!"
            description="The channel was closed and defunded."
            acknowledge={() => acknowledged(state.processId)}
          />
        );
      case 'Responding.AcknowledgeTimeout':
        return (
          <Acknowledge
            title="Challenge timeout!"
            description="You failed to respond to a challenge in time. Defund the channel now?"
            acknowledge={() => defundChosen(state.processId)}
          />
        );
      case 'Responding.WaitForDefund':
        return <Defunding state={state.defundingState} />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  respondApproved: actions.respondApproved,
  responseProvided: actions.responseProvided,
  respondSuccessAcknowledged: actions.respondSuccessAcknowledged,
  acknowledged: actions.acknowledged,
  defundChosen: actions.defundChosen,
};

export const Responder = connect(
  () => ({}),
  mapDispatchToProps,
)(ResponderContainer);

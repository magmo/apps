import * as states from './states';
import * as actions from './actions';
import { PureComponent } from 'react';
import React from 'react';
import { unreachable } from '../../../../utils/reducer-utils';
import Acknowledge from '../../shared-components/acknowledge';
import WaitForApproval from './components/wait-for-approval';
import { TransactionSubmission } from '../../transaction-submission/container';
import { Defunding } from '../../defunding/container';

import { connect } from 'react-redux';
import { ActionDispatcher } from '../../../utils';
import { ledgerDisputeDetected } from '../../../../redux/actions';

interface Props {
  state: states.NonTerminalResponderState;
  respondApproved: typeof actions.respondApproved;
  respondSuccessAcknowledged: ActionDispatcher<actions.RespondSuccessAcknowledged>;
  acknowledged: ActionDispatcher<actions.Acknowledged>;
  defundChosen: ActionDispatcher<actions.DefundChosen>;
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
    const { processId } = state;
    switch (state.type) {
      case 'Responding.WaitForAcknowledgement':
        return (
          <Acknowledge
            title="Response Complete"
            description="You have successfully responded to the challenge."
            acknowledge={() => respondSuccessAcknowledged({ processId })}
          />
        );
      case 'Responding.WaitForApproval':
        let embeddedProtocolAction;
        if (state.yieldingProcessId) {
          // TODO more robust check here ^
          embeddedProtocolAction = ledgerDisputeDetected({
            processId: state.yieldingProcessId,
            channelId: state.channelId,
          });
        } else {
          embeddedProtocolAction = undefined;
        }
        return (
          <WaitForApproval approve={() => respondApproved({ processId, embeddedProtocolAction })} />
        );
      case 'Responding.WaitForResponse':
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
            acknowledge={() => acknowledged({ processId })}
          />
        );
      case 'Responding.AcknowledgeDefundingSuccess':
        return (
          <Acknowledge
            title="Defunding success!"
            description="The channel was closed and defunded."
            acknowledge={() => acknowledged({ processId })}
          />
        );
      case 'Responding.AcknowledgeTimeout':
        return (
          <Acknowledge
            title="Challenge timeout!"
            description="You failed to respond to a challenge in time. Defund the channel now?"
            acknowledge={() => defundChosen({ processId })}
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
  respondSuccessAcknowledged: actions.respondSuccessAcknowledged,
  acknowledged: actions.acknowledged,
  defundChosen: actions.defundChosen,
};

export const Responder = connect(
  () => ({}),
  mapDispatchToProps,
)(ResponderContainer);

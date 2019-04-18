import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { NonTerminalState as NonTerminalChallengingState } from './states';
import { unreachable } from '../../../utils/reducer-utils';
import * as actions from './actions';

interface Props {
  state: NonTerminalChallengingState;
}

class ChallengingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case 'ApproveChallenge':
      case 'WaitForTransaction':
      case 'WaitForResponseOrTimeout':
      case 'AcknowledgeResponse':
      case 'AcknowledgeTimeout':
      case 'AcknowledgeFailure':
        return <div>Hello</div>;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  approved: actions.challengeApproved,
  denied: actions.challengeDenied,
  failureAcknowledged: actions.challengeFailureAcknowledged,
  responseAcknowledged: actions.challengeResponseAcknowledged,
  timeoutAcknowledged: actions.challengeTimeoutAcknowledged,
};

export const Challenging = connect(
  () => ({}),
  mapDispatchToProps,
)(ChallengingContainer);

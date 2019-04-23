import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { NonTerminalState as NonTerminalResigningState } from './states';
import { unreachable } from '../../../utils/reducer-utils';
import ApproveResigning from './components/approve-resigning';
import * as actions from './actions';

interface Props {
  state: NonTerminalResigningState;
  approve: (processId: string) => void;
  deny: (processId: string) => void;
}

class ResigningContainer extends PureComponent<Props> {
  render() {
    const { state, deny, approve } = this.props;
    const processId = state.processId;
    switch (state.type) {
      case 'AcknowledgeResignationImpossible':
      case 'ApproveResignation':
      case 'WaitForOpponentConclude':
      case 'AcknowledgeChannelClosed':
      case 'WaitForDefund':
        return <ApproveResigning deny={() => deny(processId)} approve={() => approve(processId)} />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  approve: actions.concludeSent,
  deny: actions.cancelled,
};

export const Resigning = connect(
  () => ({}),
  mapDispatchToProps,
)(ResigningContainer);

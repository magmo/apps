import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { NonTerminalState as NonTerminalResigningState } from './states';
import { unreachable } from '../../../utils/reducer-utils';
import ApproveResigning from './components/approve-resigning';
import ApproveDefunding from './components/approve-defunding';
import WaitForOpponentConclude from './components/wait-for-opponent-conclude';
import WaitForDefunding from './components/wait-for-defunding';
import * as actions from './actions';
import Acknowledge from '../shared-components/acknowledge';

interface Props {
  state: NonTerminalResigningState;
  approve: (processId: string) => void;
  deny: (processId: string) => void;
  acknowledgeResignationImpossible: (processId: string) => void;
  defund: (processId: string) => void;
}

class ResigningContainer extends PureComponent<Props> {
  render() {
    const { state, deny, approve, acknowledgeResignationImpossible, defund } = this.props;
    const processId = state.processId;
    switch (state.type) {
      case 'AcknowledgeResignationImpossible':
        return (
          <Acknowledge
            title="Resigning Not Possible"
            description="You must wait until it is your turn, or else challenge the other player if they are unresponsive."
            acknowledge={() => acknowledgeResignationImpossible(state.processId)}
          />
        );
      case 'WaitForOpponentConclude':
        return <WaitForOpponentConclude />;
      case 'AcknowledgeChannelClosed':
        return <ApproveDefunding approve={() => defund(processId)} />;
      case 'WaitForDefund':
        return <WaitForDefunding />;
      case 'ApproveResignation':
        return <ApproveResigning deny={() => deny(processId)} approve={() => approve(processId)} />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  approve: actions.concludeSent,
  deny: actions.cancelled,
  acknowledgeResignationImpossible: actions.resignationImpossibleAcknowledged,
  defund: actions.defundChosen,
};

export const Resigning = connect(
  () => ({}),
  mapDispatchToProps,
)(ResigningContainer);

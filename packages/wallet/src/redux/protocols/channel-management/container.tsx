import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import * as actions from './actions';
import * as states from './states';
import { ActionDispatcher } from '../../utils';
import { unreachable } from '../../../utils/reducer-utils';
import DisplayChannels from './components/display-channels';
import * as globalActions from '../actions';

interface Props {
  state: states.NonTerminalChannelManagementState;
  closeLedgerChannel: ActionDispatcher<globalActions.CloseLedgerChannel>;
  closeChannelManagement: ActionDispatcher<actions.CloseChannelManagement>;
}

class ChannelManagementContainer extends PureComponent<Props> {
  render() {
    const { state, closeChannelManagement, closeLedgerChannel } = this.props;
    const { processId } = state;

    switch (state.type) {
      case 'ChannelManagement.DisplayChannels':
        return (
          <DisplayChannels
            closeAction={() => closeChannelManagement({ processId })}
            closeChannelAction={channelId => closeLedgerChannel({ channelId })}
            ledgerChannels={state.ledgerChannels}
            applicationChannels={state.applicationChannels}
          />
        );

      default:
        return unreachable(state.type);
    }
  }
}

const mapDispatchToProps = {
  closeChannelManagement: actions.closeChannelManagement,
  closeLedgerChannel: globalActions.closeLedgerChannel,
};

export const ChannelManagement = connect(
  () => ({}),
  mapDispatchToProps,
)(ChannelManagementContainer);

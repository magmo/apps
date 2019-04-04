import * as states from '../redux/state';
import React, { PureComponent } from 'react';
import StatusBarLayout from '../components/status-bar-layout';
import ChannelRegistryLayout from '../components/channel-registry-layout';
import { connect } from 'react-redux';
import ChannelContainer from './channel';
interface Props {
  state: states.Initialized;
}

class WalletInitializedContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    if (state.channelState.activeAppChannelId) {
      return (
        <ChannelContainer
          state={state.channelState.initializedChannels[state.channelState.activeAppChannelId]}
        />
      );
    } else {
      return (
        <StatusBarLayout>
          <ChannelRegistryLayout state={state} />
          {/* <span>Wallet initialized</span> */}
        </StatusBarLayout>
      );
    }
  }
}

export default connect(() => ({}))(WalletInitializedContainer);

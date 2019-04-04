import * as states from '../redux/state';
import React, { PureComponent } from 'react';
<<<<<<< HEAD:packages/wallet/src/containers/initialized.tsx
import SidebarLayout from '../components/sidebar-layout';
=======
import StatusBarLayout from '../components/status-bar-layout';
import ChannelRegistryLayout from '../components/channel-registry-layout';
>>>>>>> being work on a single story, including constructing an entire wallet state from basic types; channel registry layout component:packages/wallet/src/containers/Initialized.tsx
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
<<<<<<< HEAD:packages/wallet/src/containers/initialized.tsx
        <SidebarLayout>
          <h1>Wallet initialized</h1>
        </SidebarLayout>
=======
        <StatusBarLayout>
          <ChannelRegistryLayout state={state} />
          {/* <span>Wallet initialized</span> */}
        </StatusBarLayout>
>>>>>>> being work on a single story, including constructing an entire wallet state from basic types; channel registry layout component:packages/wallet/src/containers/Initialized.tsx
      );
    }
  }
}

export default connect(() => ({}))(WalletInitializedContainer);

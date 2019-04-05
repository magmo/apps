import * as states from '../redux/state';
import React, { PureComponent } from 'react';
import StatusBarLayout from '../components/status-bar-layout';
import ChannelRegistryLayout from '../components/channel-registry-layout';
import LandingPage from '../components/landing-page';
import Todo from '../components/todo';
import { connect } from 'react-redux';
import ChannelContainer from './channel';

import {
  WAIT_FOR_APPROVAL,
  WAIT_FOR_PRE_FUND_SETUP_1,
  WAIT_FOR_DIRECT_FUNDING,
  WAIT_FOR_POST_FUND_SETUP_1,
  WAIT_FOR_LEDGER_UPDATE_1,
} from '../redux/indirect-funding/player-a/state';

import {
  WAIT_FOR_PRE_FUND_SETUP_0,
  WAIT_FOR_POST_FUND_SETUP_0,
  WAIT_FOR_LEDGER_UPDATE_0,
} from '../redux/indirect-funding/player-b/state';

import { Button } from 'reactstrap';

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
      if (state.indirectFunding) {
        switch (state.indirectFunding.type) {
          case WAIT_FOR_APPROVAL:
            return (
              <StatusBarLayout>
                <ChannelRegistryLayout state={state} />
                Would you like to fund the application channel indirectly (by opening, funding and
                updating a ledger channel)?
                <br />
                <Button>Approve</Button>
              </StatusBarLayout>
            );
          case WAIT_FOR_PRE_FUND_SETUP_0:
          case WAIT_FOR_PRE_FUND_SETUP_1:
          case WAIT_FOR_DIRECT_FUNDING:
          case WAIT_FOR_POST_FUND_SETUP_0:
          case WAIT_FOR_POST_FUND_SETUP_1:
          case WAIT_FOR_LEDGER_UPDATE_0:
          case WAIT_FOR_LEDGER_UPDATE_1:
          default:
            return <Todo stateType={state.indirectFunding.type} />;
        }
      } else {
        return <LandingPage />;
      } // Wallet is neither handling an active application channel process nor managing an indirect funding process.
    }
  }
}

export default connect(() => ({}))(WalletInitializedContainer);

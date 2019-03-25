import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import * as appChannelStates from '../redux/channelState/app-channel/state';
import * as ledgerChannelStates from '../redux/channelState/ledger-channel/state';
import FundingContainer from './Funding';
import RespondingContainer from './Responding';
import ChallengingContainer from './Challenging';
import WithdrawingContainer from './Withdrawing';
import ClosingContainer from './Closing';
import LandingPage from '../components/LandingPage';

interface ChannelProps {
  state: appChannelStates.AppChannelStatus | ledgerChannelStates.LedgerChannelStatus;
}

class ChannelContainer extends PureComponent<ChannelProps> {
  render() {
    const { state } = this.props;
    switch (state.stage) {
      case appChannelStates.FUNDING:
        return <FundingContainer state={state} />;
      case appChannelStates.CHALLENGING:
        return <ChallengingContainer state={state} />;
      case appChannelStates.WITHDRAWING:
        return <WithdrawingContainer state={state} />;
      case appChannelStates.RESPONDING:
        return <RespondingContainer state={state} />;
      case appChannelStates.CLOSING:
        return <ClosingContainer state={state} />;
      default:
        return <LandingPage />;
    }
  }
}

export default connect(() => ({}))(ChannelContainer);

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import LandingPage from '../components/landing-page';
import { Protocol } from '../redux/protocols/container';
import * as selectors from '../redux/selectors';
import * as states from '../redux/state';

interface Props {
  state: states.Initialized;
}

class WalletInitializedContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    if (!state.currentProcessId) {
      return <LandingPage />;
    } else {
      const protocolState = selectors.getProtocolState(state, state.currentProcessId);
      return <Protocol protocolState={protocolState} />;
    }
    return <LandingPage />;
  }
}

export default connect(() => ({}))(WalletInitializedContainer);

import * as states from '../redux/state';
import React, { PureComponent } from 'react';
import StatusBarLayout from '../components/status-bar-layout';
import LandingPage from '../components/landing-page';
import { connect } from 'react-redux';
interface Props {
  state: states.WalletState;
}

class InitializingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    switch (state.type) {
      case states.METAMASK_ERROR:
        return (
          <StatusBarLayout>
            <h1>A metamask error has occurred.</h1>
            <p>
              Something went wrong loading metamask. Please make sure metamask is installed and has
              permission to access {window.location.href}.
            </p>
          </StatusBarLayout>
        );
      default:
        return <LandingPage />;
    }
  }
}
export default connect(() => ({}))(InitializingContainer);

import * as states from '../redux/state';
import React, { PureComponent } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { connect } from 'react-redux';
interface Props {
  state: states.InitializedState;
}

class WalletInitializedContainer extends PureComponent<Props> {
  render() {
    return (
      <SidebarLayout>
        <h1>Wallet niitialized</h1>
      </SidebarLayout>
    );
  }
}

export default connect(() => ({}))(WalletInitializedContainer);

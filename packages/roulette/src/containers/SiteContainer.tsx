import React from 'react';

import { connect } from 'react-redux';

import { createWalletIFrame } from 'magmo-wallet-client';
import { WALLET_IFRAME_ID, WALLET_URL } from '../constants';


class Site extends React.PureComponent {
  walletDiv: React.RefObject<any>;
  constructor(props) {
    super(props);
    this.walletDiv = React.createRef();
  }
  componentDidMount() {
    const walletIframe = createWalletIFrame(WALLET_IFRAME_ID, WALLET_URL);
    this.walletDiv.current.appendChild(walletIframe);

  }
  render() {

    const component = <div>App goes here</div>;

    return <div className="w-100"><div ref={this.walletDiv} />{component}</div>;
  }
}


export default connect()(Site);

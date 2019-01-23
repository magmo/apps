import React from 'react';
import walletIcon from '../images/wallet_icon.svg';

export default class LandingPage extends React.PureComponent {

  render() {
    return (
      <div>
        <h1>Welcome to the the Magmo Wallet!</h1>
         <img src={walletIcon} />
        <p>The Magmo wallet cannot be directly accessed from here.</p>
        <p>Check out some of the applications that use the Magmo wallet:</p>
        <ul>
        <li><a href="https://demo.magmo.com">Rock Paper Scissors (by Magmo)</a></li>
          </ul>
      </div>
    );
  }
}
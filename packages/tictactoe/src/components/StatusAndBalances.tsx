import React from 'react';
import { YourMarker, TheirMarker } from './Marker';
import web3Utils from 'web3-utils';
import { Player, Marker } from '../core';

interface Props {
  stateType: string;
  balances: [string, string];
  player: Player;
  you: Marker;
}

export default class StatusAndBalances extends React.PureComponent<Props> {
  renderYourBalance(balances: [string, string], player: Player) {
    if (player === Player.PlayerA) {
      // return <span>{hexToBN(balances[0]).toString(10, 0)}</span>;
      return <span>{web3Utils.fromWei(balances[0], 'ether')}</span>;
    }
    if (player === Player.PlayerB) {
      return <span>{web3Utils.fromWei(balances[1], 'ether')} </span>;
    } else { return; }
  }
  renderTheirBalance(balances: [string, string], player: Player) {
    if (player === Player.PlayerA) {
      return <span>{web3Utils.fromWei(balances[1], 'ether')}</span>;
    }
    if (player === Player.PlayerB) {
      return <span>{web3Utils.fromWei(balances[0], 'ether')} </span>;
    } else { return; }
  }

  render() {
    const { balances, player, you } = this.props;
    return (
      <div id="status-container">
        <h1 className="full-width-bar" id="top-bar" >&nbsp;<YourMarker stateType="blah" you={you} />&nbsp;[You]&nbsp;
      <span>
            {this.renderYourBalance(balances, player)} ETH
          </span>&nbsp;|
      <span>
            &nbsp;{this.renderTheirBalance(balances, player)} ETH
          </span>
          &nbsp;[Them]&nbsp;<TheirMarker stateType="blah" you={you} />
        </h1>
      </div>
    );
  }
}
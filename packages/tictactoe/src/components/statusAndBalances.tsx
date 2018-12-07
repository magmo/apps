import React from 'react';
import { YourMarker, TheirMarker } from '../components/marker';

import { Player, Marker } from '../core';

interface Props {
  stateType: string;
  balances: [String, String];
  player: Player;
  you: Marker;
}

export default class statusAndBalances extends React.PureComponent<Props> {
  renderYourBalance(balances: [String, String], player: Player) {
    if (player == Player.PlayerA){
      return <span>{balances[0]}</span>;
    }
    if (player == Player.PlayerB){
      return <span>{balances[1]}</span>;
    } else return;
  }
  renderTheirBalance(balances: [String, String], player: Player) {
    if (player == Player.PlayerA){
      return <span>{balances[1]}</span>;
    }
    if (player == Player.PlayerB){
      return <span>{balances[0]}</span>;
    } else return;
  }

  render() {
    const { balances, player, you } = this.props;
    return (
    <div id="status-container">
    <h1 className="full-width-bar" id="top-bar" ><YourMarker stateType="blah" you={you}/>&nbsp;[You]&nbsp;
      <span>
        {this.renderYourBalance(balances, player)}
      </span>&nbsp;| 
      <span>
      &nbsp;{this.renderTheirBalance(balances, player)}
      </span>
      &nbsp;[Them]&nbsp;<TheirMarker stateType="blah" you={you}/>
      </h1>
      </div>
    );
  }
}
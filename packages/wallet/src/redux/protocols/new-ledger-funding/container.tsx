import { PureComponent } from 'react';
import React from 'react';
import { connect } from 'react-redux';
import { NewLedgerFunding as PlayerANewLedgerFunding } from './player-a';
import { NewLedgerFunding as PlayerBNewLedgerFunding } from './player-b';
import * as states from './states';

interface Props {
  state: states.PlayerAState | states.PlayerBState;
}

class NewLedgerFundingContainer extends PureComponent<Props> {
  render() {
    const { state } = this.props;
    if (states.isPlayerAState(state)) {
      return <PlayerANewLedgerFunding state={state} />;
    } else {
      return <PlayerBNewLedgerFunding state={state} />;
    }
  }
}

export const NewLedgerFunding = connect(() => ({}))(NewLedgerFundingContainer);

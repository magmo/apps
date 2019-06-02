import React, { Fragment } from 'react';
import { Button } from 'reactstrap';
interface Props {
  ledgerId: string;
  isConclude: boolean;
  challenge: () => void;
}

export default class WaitForLedgerUpdate extends React.PureComponent<Props> {
  render() {
    const update = this.props.isConclude ? 'a conclude' : 'an update';
    return (
      <Fragment>
        <h1>Waiting for your opponent to respond!</h1>
        <p>
          ...with {update} to ledger channel {this.props.ledgerId}
        </p>
        <Button onClick={this.props.challenge}>Launch Challenge</Button>
      </Fragment>
    );
  }
}

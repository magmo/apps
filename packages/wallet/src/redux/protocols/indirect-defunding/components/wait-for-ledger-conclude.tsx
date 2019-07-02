import React, { Fragment } from 'react';

interface Props {
  ledgerId: string;
}

export default class WaitForLedgerConclude extends React.PureComponent<Props> {
  render() {
    return (
      <Fragment>
        <h1>Waiting for your opponent to respond!</h1>
        ...with a conclude to ledger channel{' '}
        <div className="channel-address">{this.props.ledgerId}</div>
      </Fragment>
    );
  }
}

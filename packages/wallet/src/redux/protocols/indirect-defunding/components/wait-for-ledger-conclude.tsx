import React, { Fragment } from 'react';

interface Props {
  ledgerId: string;
}

export default class WaitForLedgerConclude extends React.PureComponent<Props> {
  render() {
    return (
      <Fragment>
        <h2>Waiting for your opponent to respond!</h2>
        ...with a conclude to ledger channel{' '}
        <div className="channel-address">{this.props.ledgerId}</div>
      </Fragment>
    );
  }
}

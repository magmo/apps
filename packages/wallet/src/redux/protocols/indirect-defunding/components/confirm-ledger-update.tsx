import React, { Fragment } from 'react';
import { Button } from 'reactstrap';

interface Props {
  ledgerId: string;
  isConclude: boolean;
  confirm: () => void;
}

export default class ConfirmLedgerUpdate extends React.PureComponent<Props> {
  render() {
    const update = this.props.isConclude ? 'a conclude' : 'an update';
    return (
      <Fragment>
        <h1>Confirm ledger update</h1>
        <p>
          ...with {update} to ledger channel {this.props.ledgerId}
          <Button onClick={this.props.confirm}>Confirm</Button>
        </p>
      </Fragment>
    );
  }
}

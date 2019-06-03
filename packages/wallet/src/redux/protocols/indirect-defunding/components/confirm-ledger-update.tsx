import React, { Fragment } from 'react';
import { Button } from 'reactstrap';

interface Props {
  ledgerId: string;
  isConclude: boolean;
  confirm?: () => void;
  respond?: () => void;
}

export default class ConfirmLedgerUpdate extends React.PureComponent<Props> {
  render() {
    const update = this.props.isConclude ? 'a conclude' : 'an update';
    function renderButton(props) {
      if (props.confirm) {
        return <Button onClick={props.confirm}>Confirm</Button>;
      } else {
        return <Button onClick={props.respond}>Respond to Challenge</Button>;
      }
    }
    return (
      <Fragment>
        <h1>Confirm ledger update</h1>
        <p>
          ...with {update} to ledger channel {this.props.ledgerId}
        </p>
        {renderButton(this.props)}
      </Fragment>
    );
  }
}

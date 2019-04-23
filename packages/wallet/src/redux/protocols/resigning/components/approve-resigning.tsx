import React, { Fragment } from 'react';
import { Button } from 'reactstrap';

interface Props {
  approve: () => void;
  deny: () => void;
}

export default class ApproveResigning extends React.PureComponent<Props> {
  render() {
    const { approve, deny } = this.props;
    return (
      <Fragment>
        <h1>Approve Resignation</h1>

        <p>Do you want to resign this channel?</p>

        <p>This action is not reversible</p>

        <Button onClick={deny}>Cancel</Button>
        <Button onClick={approve}>Resign</Button>
      </Fragment>
    );
  }
}

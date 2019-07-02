import React, { Fragment } from 'react';
import { Button } from 'reactstrap';

interface Props {
  approve: () => void;
  deny: () => void;
  channelId: string;
}

export default class DefundOrNot extends React.PureComponent<Props> {
  render() {
    const { approve, deny, channelId } = this.props;
    return (
      <Fragment>
        <h1>Challenge timed out!</h1>
        The challenge timed out. Channel <div className="channel-address">{channelId}</div> is now
        finalized -- would you like to defund it?
        <Button onClick={deny}>No</Button>
        <Button onClick={approve}>Defund</Button>
      </Fragment>
    );
  }
}

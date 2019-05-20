import React, { Fragment } from 'react';

interface Props {
  expirationTime: number;
}

export default class WaitForResponseOrTimeout extends React.PureComponent<Props> {
  render() {
    const expiryDate = new Date(this.props.expirationTime)
      .toLocaleTimeString()
      .replace(/:\d\d /, ' ');
    return (
      <Fragment>
        <h1>Waiting for your opponent to respond!</h1>
        <p>
          If they don't respond by {expiryDate}, the channel will be closed and you can withdraw
          your funds.
        </p>
      </Fragment>
    );
  }
}

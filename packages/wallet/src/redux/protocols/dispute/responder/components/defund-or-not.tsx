import React, { Fragment } from 'react';
import { Button } from 'reactstrap';
import { StyleSheet, css } from 'aphrodite';

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

        <p>The challenge timed out. Channel </p>
        <div className="channel-address">{channelId}</div>
        <p> is now finalized -- would you like to defund it?</p>
        <div className={css(styles.buttonContainer)}>
          <span className={css(styles.button)}>
            <Button onClick={deny}>No</Button>
          </span>
          <span className={css(styles.button)}>
            <Button onClick={approve}>Defund</Button>
          </span>
        </div>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '5px',
  },
  button: {
    margin: '8px',
  },
});

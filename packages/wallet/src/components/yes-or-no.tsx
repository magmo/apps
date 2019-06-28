import { css, StyleSheet } from 'aphrodite';
import React, { Fragment } from 'react';
import { Button } from 'reactstrap';

export interface Props {
  yesMessage: string;
  noMessage: string;
  yesAction: () => void;
  noAction: () => void;
}

export default class YesOrNo extends React.Component<Props> {
  render() {
    const { yesMessage, noMessage, yesAction, noAction } = this.props;
    return (
      <Fragment>
        <div className={css(styles.buttonContainer)}>
          <span className={css(styles.button)}>
            <Button onClick={yesAction}>{yesMessage}</Button>
          </span>
          <span className={css(styles.button)}>
            <Button onClick={noAction} color="link">
              {noMessage}
            </Button>
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

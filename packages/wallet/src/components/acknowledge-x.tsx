import { css, StyleSheet } from 'aphrodite';
import React from 'react';
import { Button } from 'reactstrap';

interface Props {
  title: string;
  action: () => void;
  actionTitle: string;
  description: string;
}

export default class AcknowledgeX extends React.PureComponent<Props> {
  render() {
    const { title, action, actionTitle, description } = this.props;
    return (
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="challenge-expired-button-container">
          <div className={css(styles.buttonContainer)}>
            <span className={css(styles.button)}>
              <Button onClick={action}>{actionTitle}</Button>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    display: 'flex',
    padding: '5px',
  },
  button: {
    margin: '8px',
  },
});

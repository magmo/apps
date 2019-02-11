import React from 'react';
import { Button } from 'reactstrap';
import { StyleSheet, css } from 'aphrodite';
import SidebarLayout from './SidebarLayout';

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
      <SidebarLayout>
          <h2>{title}</h2>
          <p>{description}</p>
        <div className="challenge-expired-button-container" >
          <div className={css(styles.buttonContainer)}>
            <span className={css(styles.button)}>
              <Button onClick={action} >
                {actionTitle}
              </Button>
            </span>
          </div>
        </div>
      </SidebarLayout>
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

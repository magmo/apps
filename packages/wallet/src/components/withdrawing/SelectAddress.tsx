import React from 'react';

import { Button } from 'reactstrap';
import { StyleSheet, css } from 'aphrodite';
import SidebarLayout from '../SidebarLayout';
import magmoFireBall from '../../images/white_fireball.svg';

interface Props {
  approveAction: (address: string) => void;
  approveButtonTitle: string;
  title: string;
  description: string;
}
interface State {
  withdrawAddress: string;
}
export default class SelectAddress extends React.PureComponent<Props, State> {
  interval: any;
  constructor(props) {
    super(props);
    const currentAddress = web3.eth.defaultAccount;
    this.state = { withdrawAddress: currentAddress };

    this.handleSubmitAddress = this.handleSubmitAddress.bind(this);


  }

  componentDidMount() {
    if (typeof ethereum !== 'undefined') {
      ethereum.on('accountsChanged', (accounts) => {
        this.setState({ withdrawAddress: accounts[0] });
      });
    } else {
      this.interval = setInterval(() => {
        if (web3.eth.defaultAccount !== this.state.withdrawAddress) {
          this.setState({ withdrawAddress: web3.eth.defaultAccount });
        }
      }, 100);
    }
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  render() {
    const { approveButtonTitle, title, description } = this.props;
    return (
      <SidebarLayout>
        <h1>{title}</h1>
        <p>
          {description}
        </p>
        <p>
          The funds will be sent to your current metamask account:
        </p>
        <input disabled={true} style={{ width: '95%' }} type="text" readOnly={true} defaultValue={this.state.withdrawAddress} />
        <div className="challenge-expired-button-container" >
          <div className={css(styles.buttonContainer)}>
            <span className={css(styles.button)}>
              <Button onClick={this.handleSubmitAddress} >
                <img src={magmoFireBall} />&nbsp;&nbsp;{approveButtonTitle}
              </Button>
            </span>
          </div>
        </div>
      </SidebarLayout>
    );
  }
  handleSubmitAddress() {
    this.props.approveAction(this.state.withdrawAddress);
  }

}
const styles = StyleSheet.create({
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '5px',
    position: "absolute",
    top: 'auto',
    bottom: '5%',
  },
  button: {
    margin: '8px',
  },
});


import _ from "lodash";
import React from "react";
import MagmoLogoContainer from "../containers/MagmoLogoContainer";
import GameFooterContainer from "../containers/GameFooterContainer";
import { Button, Modal } from "reactstrap";

interface Props {
  conclude: () => void;
  visible: boolean;
}

export default class GameOverPage extends React.PureComponent<Props> {
  render() {
    return (
      <div className="w-100">
        <Modal
          className="game-over-container"
          isOpen={this.props.visible}
          centered={true}
        >
          <div className="game-over-content">
            <h1>The Game is over!</h1>
            <div>You must close the channel and withdraw your funds to exit the game.</div>
            <Button className="game-over-button" onClick={this.props.conclude} block={true}>
              Close & Withdraw
          </Button>
          </div>
        </Modal>
        <MagmoLogoContainer />
        <GameFooterContainer />
      </div>
    );
  }
}

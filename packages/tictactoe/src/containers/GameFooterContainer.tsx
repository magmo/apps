import { connect } from "react-redux";

import GameFooter from "../components/GameFooter";
import * as gameActions from "../redux/game/actions";
import * as walletActions from "../wallet/interface/incoming";
import { SiteState } from "../redux/reducer";
import { PlayingState, StateName } from "../redux/game/state";
import { Player } from "../core/players";

function mapStateToProps(state: SiteState) {
  const gameState = state.game.gameState as PlayingState;
  const { player, turnNum } = gameState;
  const result = gameState.result;
  const isNotOurTurn =
    player === Player.PlayerA ? turnNum % 2 === 0 : turnNum % 2 !== 0;
  const canChallenge =
    gameState.name === StateName.OsWaitForOpponentToPickMove ||
    gameState.name === StateName.XsWaitForOpponentToPickMove;
  const challengeOngoing =
    gameState.name === "OS_PICK_CHALLENGE_MOVE" ||
    gameState.name === "XS_PICK_CHALLENGE_MOVE";
  return {
    isNotOurTurn,
    canChallenge,
    challengeOngoing,
    result,
  };
}
const mapDispatchToProps = {
  resign: gameActions.resign,
  createBlockchainChallenge: walletActions.createChallenge,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameFooter);

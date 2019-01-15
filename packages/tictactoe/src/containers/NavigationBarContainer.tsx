import { connect } from 'react-redux';

import NavigationBar from '../components/NavigationBar';
import * as loginActions from '../redux/login/actions';
import * as globalActions from '../redux/global/actions';
import { PlayingState } from '../redux/game/state';

import { SiteState } from '../redux/reducer';

const mapStateToProps = (state: SiteState) => {
  const name = ('myName' in state.game.gameState) ? state.game.gameState.myName : "";
  const gameState = state.game.gameState as PlayingState;
  return {
    showRules: state.rules.visible,
    loginDisplayName: name,
    you: gameState.you,
  };
};

const mapDispatchToProps = {
  logoutRequest: loginActions.logoutRequest,
  rulesRequest: globalActions.toggleVisibility,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NavigationBar);

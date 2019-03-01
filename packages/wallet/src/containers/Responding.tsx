import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';

import * as states from '../states';
import * as actions from '../redux/actions';

import { RespondingStep } from '../components/responding/RespondingStep';
import AcknowledgeX from '../components/AcknowledgeX';
import { unreachable } from '../utils/reducer-utils';
import ChooseResponse, { ChallengeOptions } from '../components/responding/ChooseResponse';
import TransactionFailed from '../components/TransactionFailed';

interface Props {
  state: states.RespondingState;
  challengeAcknowledged: () => void;
  challengeResponseAcknowledged: () => void;
  selectRespondWithMove: () => void;
  selectRespondWithExistingMove: () => void;
  retryTransaction: () => void;
  timeoutAcknowledged: () => void;
}

class RespondingContainer extends PureComponent<Props> {
  render() {
    const {
      state,
      challengeAcknowledged,
      challengeResponseAcknowledged,
      selectRespondWithMove,
      selectRespondWithExistingMove,
      timeoutAcknowledged,
      retryTransaction,
    } = this.props;

    switch (state.type) {
      case states.ACKNOWLEDGE_CHALLENGE:
        return (
          <AcknowledgeX
            title="Challenge detected!"
            description="Your opponent has challenged you on-chain."
            action={challengeAcknowledged}
            actionTitle="Proceed"
          />
        );
      case states.CHALLENGEE_ACKNOWLEDGE_CHALLENGE_TIMEOUT:
        const parsedExpiryDate = new Date(state.challengeExpiry ? state.challengeExpiry * 1000 : 0).toLocaleTimeString().replace(/:\d\d /, ' ');
        const description = `The challenge expired at ${parsedExpiryDate}. You may now withdraw your funds.`;
        return <AcknowledgeX 
            title="You failed to respond!"
            description={description}
            action={timeoutAcknowledged}
            actionTitle="Withdraw your funds"
            />;
      case states.CHOOSE_RESPONSE:
        const { ourIndex, turnNum } = state;
        const moveSelected = ourIndex === 0 ? turnNum % 2 === 0 : turnNum % 2 !== 0;
        let challengeOptions = [ChallengeOptions.RespondWithMove];
        if (moveSelected) {
          // TODO: We need to update the game to allow the user to choose a move even after they've selected an existing move.
          challengeOptions = [ChallengeOptions.RespondWithExistingMove];
        }
        return <ChooseResponse expiryTime={state.challengeExpiry ? state.challengeExpiry : 0}
          selectRespondWithMove={selectRespondWithMove}
          selectRespondWithExistingMove={selectRespondWithExistingMove}
          challengeOptions={challengeOptions} />;
      case states.TAKE_MOVE_IN_APP:
        // The game knows about the challenge so we don't need the wallet to display anything
        return null;
      case states.WAIT_FOR_RESPONSE_CONFIRMATION:
        return <RespondingStep step={2}/>;
        // return <WaitForXConfirmation name='response' transactionID={state.transactionHash} networkId={state.networkId} />;
      case states.INITIATE_RESPONSE:
      return <RespondingStep step={0}/>;
      case states.WAIT_FOR_RESPONSE_SUBMISSION:
      return <RespondingStep step={1}/>;
        // return <SubmitX name='response' />;
      case states.ACKNOWLEDGE_CHALLENGE_COMPLETE:
      return <RespondingStep step={4}> 
            <Button onClick={challengeResponseAcknowledged} >
              {"Return to game"}
            </Button>
            </RespondingStep>;
      case states.RESPONSE_TRANSACTION_FAILED:
        return <TransactionFailed name='challenge response' retryAction={retryTransaction} />;
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  challengeAcknowledged: actions.challengeAcknowledged,
  challengeResponseAcknowledged: actions.challengeResponseAcknowledged,
  selectRespondWithMove: actions.respondWithMoveChosen,
  selectRespondWithExistingMove: actions.respondWithExistingMoveChosen,
  retryTransaction: actions.retryTransaction,
  timeoutAcknowledged: actions.challengedTimedOutAcknowledged,
};

export default connect(
  () => ({}),
  mapDispatchToProps,
)(RespondingContainer);

import React from 'react';
// import { Marks } from '../core/marks'
import { Result, Imperative } from '../core/results'

interface Props {
  stateType: string;
  result: Result | Imperative ;
}

export default class Outcome extends React.PureComponent<Props> {
  renderResult(result: Result | Imperative ) {
    if (result == Result.YouWin){
      return (<span>You Win!</span>);
    }
    if (result == Result.YouLose){
      return (<span>You Lose!</span>);
    }
    if (result == Result.Tie){
      return (<span>It's a Draw!</span>);
    }
    if (result == Imperative.Choose){
      return (<span>Choose your move</span>);
    }
    if (result == Imperative.Wait){
      return (<span>Wait for Opponent's move!</span>);
    } else return <span>&nbsp;</span>
  }

  render() {
    const { result } = this.props;
    return (
      <div id="outcome-container">
        <h1 className="full-width-bar" id="outcome">
            {this.renderResult(result)}
        </h1>
      </div>

    );
  }
}
import React from 'react';
// import { Marks } from '../core/marks'
import { Result } from '../core/results'

interface Props {
  stateType: string;
  result: Result;
}

export default class Outcome extends React.PureComponent<Props> {
  renderResult(result: Result ) {
    if (result == Result.YouWin){
      return (<span>You Win!</span>);
    }
    if (result == Result.YouLose){
      return (<span>You Lose!</span>);
    }
    if (result == Result.Tie){
      return (<span>It's a Draw!</span>);
    } else return
  }

  render() {
    const { result } = this.props;
    return (<p>
      <span>
        {this.renderResult(result)}
      </span>
      </p>
    );
  }
}
import React from 'react';
import { Marks } from '../core/marks'
import { winningPatterns, isWinningMarks } from '../core/results';

interface Props {
  stateType: string;
  noughts: Marks;
  crosses: Marks; 
}

export default class Board extends React.PureComponent<Props> {
  crucialMark(marks: Marks, position: Marks){
    let pattern: Marks
    for (pattern of winningPatterns) {
      if (marks == pattern && ((position & pattern) == position)){
        return true
      }
    }
    return false;
  };


  winRenderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if ((crosses & position) == position ){
      if (this.crucialMark(crosses, position)){
        return (<div className="crucial-xs">×</div>);
      } else return (<div className="xs">×</div>);
    }
    if ((noughts & position) == position ){
      if (this.crucialMark(noughts, position)){
        return (<div className="crucial-os">○</div>);
      } else return (<div className="os">○</div>);
    } else return (<span>&nbsp;</span>);
  }

  noWinRenderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if ((crosses & position) == position ){
      if (this.crucialMark(crosses, position)){
        return (<div className="crucial-xs">×</div>);
      } else return (<div className="crucial-xs">×</div>);
    }
    if ((noughts & position) == position ){
      if (this.crucialMark(noughts, position)){
        return (<div className="crucial-os">○</div>);
      } else return (<div className="crucial-os">○</div>);
    } else return (<span>&nbsp;</span>);
  }

  renderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if (isWinningMarks(noughts) || isWinningMarks(crosses)){
      return this.winRenderMark(noughts, crosses, position)
    } else return this.noWinRenderMark
  }

  render() {
    const { noughts, crosses } = this.props;
    return (
      <div id="table-containter">
        <table>
            <tr>
                <td id="tl"> 
                  {this.renderMark(noughts, crosses, 0b100000000)}
                </td>
                <td id="tm">
                  {this.renderMark(noughts, crosses, 0b010000000)}
                </td>
                <td id="tr">
                  {this.renderMark(noughts, crosses, 0b001000000)}
                </td>
            </tr>
            <tr>
                <td id="ml"> 
                  {this.renderMark(noughts, crosses, 0b000100000)}
                </td>
                <td id="mm">
                  {this.renderMark(noughts, crosses, 0b000010000)}
                </td>
                <td id="mr">
                  {this.renderMark(noughts, crosses, 0b000001000)}
                </td>
            </tr>
            <tr>
                <td id="bl"> 
                  {this.renderMark(noughts, crosses, 0b000000100)}
                </td>
                <td id="bm">
                  {this.renderMark(noughts, crosses, 0b000000010)}
                </td>
                <td id="br">
                  {this.renderMark(noughts, crosses, 0b000000001)}
                </td>
            </tr>
        </table>
      </div>
    );
  }
}
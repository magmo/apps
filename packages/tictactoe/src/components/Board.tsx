import React from 'react';
import { Marks } from '../core/marks';
import { winningPatterns, isWinningMarks, isDraw } from '../core/results';

interface Props {
  stateType: string;
  noughts: Marks;
  crosses: Marks;
  marksMade: (marks: Marks) => void;
}

export default class Board extends React.PureComponent<Props> {
  crucialMark(marks: Marks, position: Marks) {
    let pattern: Marks;
    for (pattern of winningPatterns) {
      if (((marks & pattern) === pattern) && ((position & pattern) === position)) {
        return true; // does this pattern contain 
      }
    }
    return false;
  }


  winRenderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if ((crosses & position) === position) {
      if (this.crucialMark(crosses, position)) {
        return (<span className="xs tile">×</span>);
      } else { return (<span className="xs tile dim">×</span>); }
    }
    if ((noughts & position) === position) {
      if (this.crucialMark(noughts, position)) {
        return (<span className="os tile">○</span>);
      } else { return (<span className="os tile dim">○</span>); }
    } else { return (<span className="empty tile">○</span>); }
  }

  noWinRenderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if ((crosses & position) === position) {
      if (this.crucialMark(crosses, position)) {
        return (<span className="xs tile">×</span>);
      } else { return (<span className="xs tile">×</span>); }
    }
    if ((noughts & position) === position) {
      if (this.crucialMark(noughts, position)) {
        return (<span className="os tile">○</span>);
      } else { return (<span className="os tile">○</span >); }
    } else { return (<span className="empty tile">○</span>); }
  }

  drawRenderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if ((crosses & position) === position) {
      return (<span className="xs tile dim">×</span >);
    }
    if ((noughts & position) === position) {
      return (<span className="os tile dim">○</span >);
    } else { return (<span className="empty tile">○</span>); }
  }


  renderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if (isWinningMarks(noughts) || isWinningMarks(crosses)) {
      return this.winRenderMark(noughts, crosses, position);
    } else if (isDraw(noughts, crosses)) {
      return this.drawRenderMark(noughts, crosses, position);
    } else {
      return this.noWinRenderMark(noughts, crosses, position); 
    }
  }

  mouseOverHandler() {
    console.log('mouseover detected');
    // this.getElementById("tl").innerHTML = "A";
    // document.getElementById("tl").innerHTML = (<span className="os tile">○</span>);
    // return;
  }


  render() {
    const { noughts, crosses } = this.props;
    return (
      <div id="table-container">
        <table>
          <tbody>
          <tr>
            <td id="tl" onClick={() => this.props.marksMade(Marks.tl)} onMouseOver={this.mouseOverHandler}>
              {this.renderMark(noughts, crosses, Marks.tl)}
            </td>
            <td id="tm" onClick={() => this.props.marksMade(Marks.tm)}>
              {this.renderMark(noughts, crosses, Marks.tm)}
            </td>
            <td id="tr" onClick={() => this.props.marksMade(Marks.tr)}>
              {this.renderMark(noughts, crosses, Marks.tr)}
            </td>
          </tr>
          <tr>
            <td id="ml" onClick={() => this.props.marksMade(Marks.ml)}>
              {this.renderMark(noughts, crosses, Marks.ml)}
            </td>
            <td id="mm" onClick={() => this.props.marksMade(Marks.mm)}>
              {this.renderMark(noughts, crosses, Marks.mm)}
            </td>
            <td id="mr" onClick={() => this.props.marksMade(Marks.mr)}>
              {this.renderMark(noughts, crosses, Marks.mr)}
            </td>
          </tr>
          <tr>
            <td id="bl" onClick={() => this.props.marksMade(Marks.bl)}>
              {this.renderMark(noughts, crosses, Marks.bl)}
            </td>
            <td id="bm" onClick={() => this.props.marksMade(Marks.bm)}>
              {this.renderMark(noughts, crosses, Marks.bm)}
            </td>
            <td id="br" onClick={() => this.props.marksMade(Marks.br)}>
              {this.renderMark(noughts, crosses, Marks.br)}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
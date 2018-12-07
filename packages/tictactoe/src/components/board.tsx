import React from 'react';
import { Marks } from '../core/marks'

interface Props {
  stateType: string;
  noughts: Marks;
  crosses: Marks; 
}

export default class Board extends React.PureComponent<Props> {
  renderMark(noughts: Marks, crosses: Marks, position: Marks) {
    if ((crosses & position) == position){
    return (<div className="xs">×</div>);
    }
    if ((noughts & position) == position){
      return (<div className="os">○</div>);
    } else return (<div className="blank">&nbsp;</div>)
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
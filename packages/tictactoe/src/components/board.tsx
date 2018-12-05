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
    return (<p className="xs">×</p>);
    }
    if ((noughts & position) == position){
      return (<p className="os">○</p>);
    } else return (<p className="os">&nbsp;</p>)
  }

  render() {
    const { noughts, crosses } = this.props;
    return (
      <div>
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
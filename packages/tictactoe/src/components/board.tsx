import React from 'react';
import { SingleMarks } from '../core/marks'

interface Props {
  stateType: string;
  noughts: SingleMarks;
  crosses: SingleMarks; // TODO full marks?
}

export default class Board extends React.PureComponent<Props> {
  render() {
    return (
      <div>
        <table>
            <tr>
                <td id="tl">  </td><td id="tm">  </td><td id="tr">  </td>
            </tr>
            <tr>
                <td id="ml"> </td><td id="mm"> </td><td id="mr"> </td>
            </tr>
            <tr>
                <td id="bl"> </td><td id="bm"> </td><td id="br"> </td>
            </tr>
        </table>
      </div>
    );
  }
}
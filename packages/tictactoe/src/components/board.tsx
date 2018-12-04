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
        <h1>TODO: Screen not implemented!</h1>
        <p>
          Screen has not yet been built for the <strong>{this.props.stateType}</strong>!
        </p>
        <table>
            <tr>
                <td> tl </td><td> </td><td> </td>
            </tr>
            <tr>
                <td> </td><td> mm</td><td> </td>
            </tr>
            <tr>
                <td> </td><td> </td><td> </td>
            </tr>
        </table>
      </div>
    );
  }
}
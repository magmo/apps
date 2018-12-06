import React from 'react';
// import { Marks } from '../core/marks'
import { Marker } from '../core/results'

interface Props {
  stateType: string;
  you: Marker;
}

export default class Status extends React.PureComponent<Props> {
  renderYou(you: Marker) {
    if (you == Marker.crosses){
    return (<span className="xs">×</span>);
    }
    if (you == Marker.noughts){
      return (<span className="os">○</span>);
    } else return (<span className="blank">&nbsp;</span>)
  }


  render() {
    const { you } = this.props;
    return (<p> You are&nbsp;
      <div>
        {this.renderYou(you)}
      </div>
      </p>
    );
  }
}
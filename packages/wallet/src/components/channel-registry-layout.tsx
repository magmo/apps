import * as states from '../redux/state';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

interface Props {
    state: states.Initialized;
  }
  
class ChannelRegistryLayout extends PureComponent<Props> {
  render() {
    const channels = this.props.state.channelState.initializedChannels;
    const channelList: string[] = [];
    for (const key in channels) {
        if (key) {
            channelList.push(key);
            // channelList = channelList.concat(', ');
            // // console.log(key);
            // // console.log(channelList);
        }
    }
    const renderRow = (name) => (<td>{name}</td>);

    // const channelRows = channelList.map((name, index) => {
    //     <td key={index}>{name}</td><td></td><td></td>}};
    // console.log(channelList);
    return (
        <div>
        {/* <div style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <i> Ledger Channels </i>
        </div>
        <div style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <i> Application Channels</i>
        </div> */}
        <div style={{borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <i>Ledger Channels </i>
        </div>
            <table style={{width: '100%'}}>
            <tr>
                <th>Channel</th>
                <th>Counterparties</th> 
                <th>Funded?</th>
            </tr>
            {channelList.map(renderRow)}
            <tr>
                <td>RPS</td>
                <td>Bob</td> 
                <td>✗</td>
            </tr>
            <tr>
                <td>TTT</td>
                <td>Charlie</td> 
                <td>✗</td>
            </tr>
            </table>
        </div>
    );
  }
}
export default connect(() => ({}))(ChannelRegistryLayout);
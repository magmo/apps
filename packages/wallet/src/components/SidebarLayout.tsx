import React from 'react';
import { PureComponent } from 'react';

import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDotCircle } from '@fortawesome/free-solid-svg-icons';

// todo: style to appear from the left as per:
// https://github.com/DimitryDushkin/sliding-pane/blob/master/src/index.styl

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '320px',
    height: '450px',
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

export default class SidebarLayout extends PureComponent {
  render() {
    return (
      <Modal isOpen={true} style={customStyles} ariaHideApp={false}>
        <div className="d-flex flex-column h-100">

          <div style={{borderBottom: "1px solid rgba(0, 0, 0, 0.1)"}}>
            <FontAwesomeIcon icon={faDotCircle} style={{ color: "green" }} />&nbsp;&nbsp;
            Ropsten Test Network
          </div>

          <div
            className="flex-grow-1 d-flex flex-column justify-content-between"
            style={{paddingTop: "1em"}}
          >
            {this.props.children}
          </div>

          <div className="d-flex flex-row justify-content-end" style={{borderTop: "1px solid rgba(0, 0, 0, 0.1)"}}>
            <div style={{color: "rgba(0, 0, 0, 0.3)"}}>Magmo wallet v0.0.1</div>
          </div>
        </div>
      </Modal>
    );
  }
}



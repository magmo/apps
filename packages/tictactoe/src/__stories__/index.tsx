import React from 'react';
import { storiesOf } from '@storybook/react';
// Once it exists import styling here
import '../index.css';
// import { Button } from '@storybook/react/demo';
import Board from '../components/board';


// BOILER PLATE TAKEN FROM RPS-POC WALLET

// const fakeStore = (state) => ({
//   dispatch: action => {
//     alert(`Action ${action.type} triggered`);
//     return action;
//   },
//   getState: () => ({ wallet: state }), 
//   subscribe: () => (() => {/* empty */ }),
//   replaceReducer: () => { /* empty */ },
// });

// const testState = (state) => (
//   () => (
//     <Provider store={fakeStore(state)}>
//       <Wallet children={<div/>} />
//     </Provider>
//   )
// );

// const noughts = 0;
// const crosses = 0;
storiesOf('Board', module)
  .add('Empty', () => <Board stateType="blah" noughts={0} crosses={0} />)
  .add('Draw', () => <Board stateType="blah" noughts={0b010011100} crosses={0b101100011}/>)
  .add('Owin', () => <Board stateType="blah" noughts={0b111000000} crosses={0b000011000}/>)
  .add('Xwin', () => <Board stateType="blah" noughts={0b100010000} crosses={0b001001001}/>);

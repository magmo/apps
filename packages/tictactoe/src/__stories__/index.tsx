import React from 'react';
import { storiesOf } from '@storybook/react';
// Once it exists import styling here
// import '../../index.scss';
import { Button } from '@storybook/react/demo';


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

storiesOf('Test example', module)
  .add('Test Button', () => <Button>Hello world</Button>);

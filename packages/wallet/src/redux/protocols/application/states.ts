import { Constructor } from '../../utils';

// -------
// States
// -------
export interface AddressKnown {
  type: 'Application.AddressKnown';
  address: string;
  privateKey: string;
}

export interface Ongoing {
  type: 'Application.Ongoing';
  channelId: string;
}

export interface Success {
  type: 'Application.Success';
}

// -------
// Constructors
// -------

export const addressKnown: Constructor<AddressKnown> = p => {
  const { address, privateKey } = p;
  return { type: 'Application.AddressKnown', address, privateKey };
};

export const ongoing: Constructor<Ongoing> = p => {
  const { channelId } = p;
  return { type: 'Application.Ongoing', channelId };
};

export const success: Constructor<Success> = p => {
  return { type: 'Application.Success' };
};

// -------
// Unions and Guards
// -------

export type ApplicationState = AddressKnown | Ongoing | Success;
export type NonTerminalApplicationState = AddressKnown | Ongoing;
export type ApplicationStateType = ApplicationState['type'];

export function isTerminal(state: ApplicationState): state is Success {
  return state.type === 'Application.Success';
}

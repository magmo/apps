export const ADDRESS_KNOWN = 'AddressKnown';
export interface AddressKnown {
  type: typeof ADDRESS_KNOWN;
  address: string;
}
export function addressKnown(address: string): AddressKnown {
  return { type: ADDRESS_KNOWN, address };
}

export const ONGOING = 'Ongoing';
export interface Ongoing {
  type: typeof ONGOING;
  channelId: string;
}
export function ongoing(channelId: string): Ongoing {
  return { type: ONGOING, channelId };
}

export type ApplicationState = AddressKnown | Ongoing;

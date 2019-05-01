export enum Strategy {
  IndirectFunding = 'IndirectFunding',
}

export interface BaseProcessAction {
  processId: string;
  type: string;
}

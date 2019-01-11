
import { ResponseActionTypes as WalletEventTypes, ResponseAction as WalletEvent } from './interface/from-wallet';
import { EventEmitter } from 'events';

export type Listener = (eventType: WalletEventTypes, eventData: WalletEvent) => void;
export default class WalletEventListener {
  eventEmitter: EventEmitter;
  iFrameId: string;
  constructor(iFrameId: string) {
    this.iFrameId = iFrameId;
    this.eventEmitter = new EventEmitter();
    window.addEventListener('message', (event: MessageEvent) => {
      // TODO: Better filtering mechanism for wallet events
      if (event.data && event.data.type && event.data.type.startsWith('WALLET.')) {
        this.eventEmitter.emit(event.data.type, event.data);
      }
    });
  }
  on(eventType: WalletEventTypes, listener: Listener) {
    this.eventEmitter.on(eventType, listener);
  }
  removeAllListeners() {
    this.eventEmitter.removeAllListeners();
  }



}
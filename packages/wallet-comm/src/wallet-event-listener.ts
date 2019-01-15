
import { ResponseActionTypes as WalletEventTypes, ResponseAction as WalletEvent } from './interface/from-wallet';
import { EventEmitter } from 'events';

// TODO: Type this so that we can specify the events that will be returned
export class WalletEventListener {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    window.addEventListener('message', (event: MessageEvent) => {
      // TODO: Check where the message came from
      if (event.data && event.data.type && event.data.type.startsWith('WALLET.')) {

        this.eventEmitter.emit(event.data.type, event.data);
      }
    });
  }

  public subscribe(eventType: WalletEventTypes, eventHandler: (event: WalletEvent) => void) {
    this.eventEmitter.on(eventType, eventHandler);
  }

  public unSubscribe(): void {
    this.eventEmitter.removeAllListeners();
  }
}

import { ResponseActionTypes as WalletEventTypes, ResponseAction as WalletEvent } from './interface/from-wallet';
import { EventEmitter } from 'events';

// TODO: Type this so that we can specify the events that will be returned
export class WalletEventListener {
  private eventEmitter: EventEmitter;
  readonly walletEventTypes: WalletEventTypes[];

  constructor(iFrameId: string, walletEventTypes: WalletEventTypes[]) {
    this.eventEmitter = new EventEmitter();
    this.walletEventTypes = walletEventTypes;
    window.addEventListener('message', (event: MessageEvent) => {
      // TODO: Check where the message came from
      if (this.validEvent(event)) {
        this.eventEmitter.emit(event.data.type, event.data);
      }

    });
  }

  public subscribe(eventHandler: (event: WalletEvent) => void) {
    this.walletEventTypes.forEach(eventType => {
      this.eventEmitter.on(eventType, eventHandler);
    });
  }

  public unSubscribe(): void {
    this.eventEmitter.removeAllListeners();
  }

  private validEvent(event) {
    let validEvent = false;
    if (event.data && event.data.type && event.data.type.startsWith('WALLET.')) {
      return this.walletEventTypes.indexOf(event.data.type) > -1;
    }
    return validEvent;
  }




}
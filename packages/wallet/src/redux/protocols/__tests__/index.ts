import { ProtocolLocator, EmbeddedProtocol } from '../../../communication';
import { WalletAction } from '../../actions';
import { prependToLocator } from '..';

export function prependToActionLocator<
  T extends WalletAction & { protocolLocator: ProtocolLocator },
  S extends { action: T }
>(scenario: S, protocol: ProtocolLocator | EmbeddedProtocol): S {
  return {
    ...scenario,
    action: prependToLocator(scenario.action, protocol),
  };
}

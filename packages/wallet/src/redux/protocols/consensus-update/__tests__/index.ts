import {
  twoPlayerAHappyPath,
  twoPlayerBHappyPath,
  threePlayerAHappyPath,
  threePlayerBHappyPath,
  threePlayerHubHappyPath,
} from './scenarios';
import { prependToActionLocator } from '../../__tests__';
import { EmbeddedProtocol } from '../../../../communication';

export const twoPlayerPreSuccessA = prependToActionLocator(
  twoPlayerAHappyPath.commitmentSent,
  EmbeddedProtocol.ConsensusUpdate,
);
export const twoPlayerPreSuccessB = prependToActionLocator(
  twoPlayerBHappyPath.notSafeToSend,
  EmbeddedProtocol.ConsensusUpdate,
);

export const threePlayerPreSuccessA = prependToActionLocator(
  threePlayerAHappyPath.waitForHubUpdate,
  EmbeddedProtocol.ConsensusUpdate,
);
export const threePlayerPreSuccessB = prependToActionLocator(
  threePlayerBHappyPath.waitForHubUpdate,
  EmbeddedProtocol.ConsensusUpdate,
);
export const threePlayerPreSuccessHub = prependToActionLocator(
  threePlayerHubHappyPath.waitForPlayerBUpdate,
  EmbeddedProtocol.ConsensusUpdate,
);

import {
  twoPlayerAHappyPath,
  twoPlayerBHappyPath,
  threePlayerAHappyPath,
  threePlayerBHappyPath,
  threePlayerHubHappyPath,
} from './scenarios';

export const twoPlayerPreSuccessA = twoPlayerAHappyPath.commitmentSent;
export const twoPlayerPreSuccessB = twoPlayerBHappyPath.commitmentSent;

export const threePlayerPreSuccessA = threePlayerAHappyPath.waitForHubUpdate;
export const threePlayerPreSuccessB = threePlayerBHappyPath.waitForHubUpdate;
export const threePlayerPreSuccessHub = threePlayerHubHappyPath.waitForPlayerBUpdate;

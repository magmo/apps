import * as scenarios from './scenarios';
import { addStoriesFromScenario as addStories } from '../../../../__stories__';

function flattenScenario(scenario) {
  Object.keys(scenario).forEach(key => {
    if (scenario[key].state) {
      scenario[key].state = scenario[key].state.state;
    }
  });
  return scenario;
}

addStories(
  flattenScenario(scenarios.playerAHappyPath),
  'Indirect Defunding / PlayerA / Happy Path',
);
addStories(
  flattenScenario(scenarios.playerBHappyPath),
  'Indirect Defunding / PlayerB / Happy Path',
);

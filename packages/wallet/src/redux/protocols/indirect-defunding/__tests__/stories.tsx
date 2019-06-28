import { addStoriesFromScenario as addStories } from '../../../../__stories__';
import * as scenarios from './scenarios';

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

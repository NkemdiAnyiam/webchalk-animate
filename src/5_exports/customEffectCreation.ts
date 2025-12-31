export {
  EffectFrameGeneratorSet,
  PresetEffectDefinition,
  PresetEffectBank,
  EffectNameIn,
  EffectOptions,
  // definePresetEffect,
  definePresetEffectBank
} from "../2_animationEffects/customEffectCreation";

import {
  libPresetEntrances,
  libPresetExits,
  libPresetEmphases,
  libPresetMotions,
  libPresetConnectorEntrances,
  libPresetConnectorExits,
  libPresetScrolls,
  libPresetTransitions
} from "../2_animationEffects/webchalkPresetEffectBanks";

/**
 * @ignore
 */
export const webchalkPresetEffectBanks = {
  entranceBank: libPresetEntrances,
  exitBank: libPresetExits,
  emphasisBank: libPresetEmphases,
  motionBank: libPresetMotions,
  connectorEntranceBank: libPresetConnectorEntrances,
  connectorExitBank: libPresetConnectorExits,
  scrollBank: libPresetScrolls,
  transitionBank: libPresetTransitions
};

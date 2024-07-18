import { WebFlik } from "../src/WebFlik";

const {Motion, Entrance} = WebFlik.createAnimationBanks({
  entrances: {
    hello: {
      generateKeyframes() {
        return [[]]
      },
      config: {
        
      },
    }
  }
});

Entrance(x, '~pinwheel', [])
Motion(new HTMLElement, '~move-to', [], {})

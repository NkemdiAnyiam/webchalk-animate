import { WebFlik } from "webflik";

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

Entrance(new HTMLElement, '~pinwheel', []);
Motion(new HTMLElement, '~move-to', [document.documentElement], {});

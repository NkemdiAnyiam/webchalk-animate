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

const square = document.querySelector('.square');

Entrance(square, '~pinwheel', []);
Motion(square, '~move-to', [document.documentElement], {});

import { AnimTimeline, WebFlik } from "webflik";

const {Motion, Entrance} = WebFlik.createAnimationFactories({
  customEntranceEffects: {
    hello: {
      generateKeyframes() {
        return [[]]
      }
    }
  }
})

const square = document.querySelector('.square');

Entrance(square, '~appear', []);
Motion(square, '~move-to', [document.documentElement], {});

const timeline = new AnimTimeline();
timeline.togglePause(true,)

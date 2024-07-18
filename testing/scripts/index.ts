import { AnimTimeline, WebFlik } from "webflik";

const {Motion, Entrance} = WebFlik.createAnimationFactories({
  customEntranceEffects: {
    hello: {
      generateKeyframes() {
        return [[]]
      },
      config: {
        
      }
    },
  }
})

const square = document.querySelector('.square');

const ent = Entrance(square, '~appear', []);
ent.domElem = new HTMLElement()
Motion(square, '~move-to', [document.documentElement], {});

const timeline = new AnimTimeline();
timeline.togglePause()

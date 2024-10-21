# Webimator

Webimator is a web animation framework that supports the development of interactive algorithm visualizations, providing a library of preset animations and  beginner-friendly API that can be used to animate DOM elements (i.e., the contents on a webpage which are produced by HTML code).

## Installation

```bash
npm install webimator
```

### First Time Installing a Package?

(optional read)
<details>
  <summary>Expand/Collapse Section</summary>
  
A "package" is essentially a downloadable library of code that you can use alongside your _own_ code. For example, the animation framework Webimator is a package that can be downloaded using the command above, and you can use it with your code to help create your own animated visualizations.

Managing packages manually would be tedious since they are constantly being updated with new versions, deprecations, conflicts, etc. That is why it is common to install packages using a "package manager".

#### 1. Install Node.js

To install Webimator, you must use NPM (Node Package Manager). It is the package manager for Node.js, which is a runtime environment for JavaScript. NPM actually comes _with_ Node, so the first step to installing a package is to [install Node.js](https://nodejs.org/en/download/prebuilt-installer). After this, you can check to make sure Node and NPM are installed by opening any command-line interface (CLI) and running the following:

```bash
node --version
```
```bash
npm --version
```

#### 2. Initialize a Project

Now that Node is installed, you need to create a project. Create a folder (named whatever you want) and open it in any coding environment. I highly recommend [installing Visual Studio Code (VS Code)](https://code.visualstudio.com/download), which is a free feature-rich code editor. Next, open the terminal (the CLI for the coding environment) and run the following command:

```bash
npm init --yes
```

This will initialize a new Node project (do not worry about filling out all of the fields—the `--yes` flag tells it to just select default options. If you would actually like to fill them out manually, omit the `--yes` flag). A new file called `package.json` should now exist. This (along with a file you will soon see named `package-lock.json`) records important details about the project, including any dependencies (packages).

#### 3. Install Webimator

Now you can use the command given at the beginning of the [Installation section](#installation) (repeated here for convenience):

```bash
npm install webimator
```

NPM will install the specified package (in this case, `webimator`) as a "dependency". That means that the package is required for your code to work if you were to, say, publish your project online for users to look at.
</details>

## Usage

### Imports

Once Webimator is installed, import it with the following statements in your JavaScript code:
<!--MD-S id="import webimator" code-type="ts"-->
```ts
import { webimator } from 'webimator';
```
<!--MD-E id="import webimator"-->
For convenience (and clarity), the package also exposes a majority of its internal types and objects using other import paths (but none of them are required to make full usage of Webimator's functionalities):
<!--MD-S id="import paths" code-type="ts"-->
```ts
import * as WebimatorTypes from 'webimator/types-and-interfaces';
import * as WebimatorErrors from "webimator/error-handling";
import * as WebimatorEasing from "webimator/easing";
```
<!--MD-E id="import paths"-->

### Creating Animation Clips

#### Background

(optional read)
<details>
  <summary>Expand/Collapse Section</summary>

An "animation effect" is a predefined behavior that can be applied to elements. For example, an entrance animation effect called "fade-in" could be defined to cause an element to transition from 0% opacity to 100% opacity.

In Webimator, effects are grouped into 9 categories:
- Entrance effects
- Exit effects
- Emphasis effects
- Motion effects
- Transition effects
- Scroller effects
- Connector Setter effects
- Connector Entrance effects
- Connector Exit effects

To actually see an effect in action, you must play an **"animation clip"**. In the Webimator framework, a "clip" is the smallest building block of a timeline, represented by the class `AnimClip`. In essence, it is a [DOM element, effect] pair, where a "DOM element" is some HTML element on the page and the effect is the animation effect that will be applied to it. Since there are 9 categories of animation effects, there are 9 subclasses of `AnimClip`.

- `EntranceClip`
- `ExitClip`
- `EmphasisClip`
- `MotionClip`
- `TransitionClip`
- `ScrollerClip`
- `ConnectorSetterClip`
- `ConnectorEntranceClip`
- `ConnectorExitClip`
</details>

#### Creation

Webimator provides several factory functions that you can use to create animation clips (the smallest building block of a timeline, represented by the abstract `AnimClip` class). There is one factory function for each of the categories of clips (e.g., the `Entrance()` factory function returns `EntranceClip`, the `Motion()` factory function returns `MotionClip`, etc.). They are called "factory" functions because they create instances of clips without you having to deal with the more complex details of the constructors and setup.

To access the factory functions, use the `webimator` object's `createAnimationClipFactories()` method:
<!--MD-S id="usage__webimator.createAnimationClipFactories()" code-type="ts"-->
```ts
const clipFactories = webimator.createAnimationClipFactories();
```
<!--MD-E id="usage__webimator.createAnimationClipFactories()"-->
The properties of the object returned by `createAnimationClipFactories()` are the clip factory functions. You can now use them to create animation clips like in the following example.
<!--MD-S id="usage__create-basic-clips" code-type="ts"-->
```ts
const sqrEl = document.querySelector('.square');
const ent = clipFactories.Entrance(sqrEl, '~pinwheel', [2, 'clockwise']);
const ext = clipFactories.Exit(sqrEl, '~fade-out', [], {duration: 1500});
```
<!--MD-E id="usage__create-basic-clips"-->
An element with the CSS class "square" is selected from the page, and it is targeted by two animation clips—an entrance clip and a motion clip. Generally, the effect name will always be followed by a tuple containing effect options. Evidently, the pinwheel effect accepts two effect options—the number spins and the direction of the spin—while the fade out effect takes no effect options. After the effect options, you may specify a configuration object to set things like the duration, delay, end delay, CSS classes, playback rate, and other configuration settings.

These animation clips are fully-fledged playback structures, and they can be played, rewound, paused, and more. However, as with normal JavaScript animations, outright playing multiple animation clips will run everything at the same time, which is likely not what you want.
<!--MD-S id="usage__badly-play-basic-clips" code-type="ts"-->
```ts
ent.play();
ext.play();
ext.rewind();
ent.rewind();
// ↑ AnimClip.prototype.play() and rewind() are asynchronous,
// so these will actually attempt to run all at the same time,
// ultimately causing an error
```
<!--MD-E id="usage__badly-play-basic-clips"-->

One way to manually control the timing of clips yourself is to use Promise-based syntax as in the code below.
<!--MD-S id="usage__play-basic-clips" code-type="ts"-->
```ts
// the entrance clip plays, and THEN the motion clip plays, and THEN the
// motion clip plays, and THEN the motion clip rewinds, and THEN the
// entrance clip rewinds
ent.play().then(() => {
  ext.play().then(() => {
    ext.rewind().then(() => {
      ent.rewind();
    })
  });
});

// exact same thing but using async/await syntax
(async function() {
  await ent.play();
  await ext.play();
  await ext.rewind();
  ent.rewind();
})();
```
<!--MD-E id="usage__play-basic-clips"-->
However, this would become unwieldly if there were dozens of animations, not to mention coordinating pauses, compensating for tiny error's in JavaScript's timing. This is where the next playback structure—`AnimSequence`—comes in.

### Creating Animation Sequences

#### Creating Sequence and Adding Clips

An **"animation sequence"** is a number of animations that occur one after another in a particular order. In Webimator, animation clips can be placed into sequences, which are their _own_ fully-fledged playback structures.

To create an animation sequence, use <!--MD-S id="usage__create-sequence" code-type="inline-code" MD-G-->`webimator.newSequence()`<!--MD-E-->. Without any arguments, the method just creates an empty sequence without any animation clips. You can add clips to the sequence upon its creation by passing a list of clips as arguments, or you can use <!--MD-S id="usage__add-clips" code-type="inline-code" MD-G-->`AnimSequence.prototype.addClips()`<!--MD-E-->:

<!--MD-S id="usage__create-sequence-clips" code-type="ts"-->
```ts
// get clip factory functions
const { Entrance, Exit, Motion } = webimator.createAnimationClipFactories();

// select elements from page
const sqrEl = document.querySelector('.square');
const circEl = document.querySelector('.circle');
const triEl = document.querySelector('.triangle');

// create animation clips
const enterSquare = Entrance(sqrEl, '~pinwheel', [2, 'clockwise']);
const enterCircle = Entrance(circEl, '~fade-in', []);

// create sequence with configuration options and animation clips
const seq = webimator.newSequence(
  // optional configuration object
  {playbackRate: 2, description: 'Enter all the shapes'},
  // 4 animation clips
  enterSquare,
  enterCircle,
  Entrance(triEl, '~fly-in', ['from-bottom-left']),
  Entrance(document.querySelector('.pentagon'), '~appear', [])
);

// add more clips to the sequence
seq.addClips(
  Motion(circEl, '~move-to', [sqrEl]),
  Exit(sqrEl, '~fade-out', [])
);

seq.play().then(() => seq.rewind());
```
<!--MD-E id="usage__create-sequence-clips"-->

In the example above, a new sequence is created with <!--MD-S id="usage__create-sequence" code-type="inline-code" MD-G-->`webimator.newSequence()`<!--MD-E -->. However, the first object passed to it is not an animation clip. You are actually allowed to pass a set of configuration options as the first argument to <!--MD-S id="usage__create-sequence" code-type="inline-code" MD-G-->`webimator.newSequence()`<!--MD-E--> and _then_ a list of clips (but if you do not want to set any configuration, you can just pass the list of clips only). Either way, the sequence contains four animation clips. Afterwards, two more clips are added to the sequence (for a total of six) using <!--MD-S id="usage__add-clips" code-type="inline-code" MD-G-->`AnimSequence.prototype.addClips()`<!--MD-E-->. Finally, the sequence is played and rewound. When playing, the animation clips will be played in order, each one starting _only_ after the previous one has finished. When rewinding, the clips are rewound in reverse order.

#### Changing Sequential Timing of Clips

Oftentimes, we actually _do_ want animation clips to play at the same time. To control this, there are two `AnimClip` configuration options that can be used to tell clips to play in parallel: <!--MD-S id="usage__starts-with-clip" code-type="inline-code" MD-G-->`startsWithPrevious`<!--MD-E--> and <!--MD-S id="usage__starts-next-clip" code-type="inline-code" MD-G-->`startsNextClipToo`<!--MD-E-->.

(Work in progress)

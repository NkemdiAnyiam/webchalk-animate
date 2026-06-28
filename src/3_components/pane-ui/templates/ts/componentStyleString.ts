export const componentStyleString = /*css*/`
@charset "UTF-8";
.timeline {
  line-height: 1;
}
.timeline__inner-wrapper {
  --hem: 10px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

button {
  cursor: pointer;
}

.user-select-none,
&.user-select-none {
  user-select: none !important;
}

.pointer-events-none {
  pointer-events: none !important;
}

.jump-button,
.btn {
  border: none;
  padding: calc(0.4 * var(--hem));
  height: calc(2 * var(--hem));
  background-color: var(--color-gray-darkest);
  box-shadow: 2px 2px 2px 1px rgba(83, 83, 83, 0.6);
  transition: scale 0.1s, box-shadow 0.1s;
  display: grid;
  place-content: center;
}
.jump-button:hover,
.btn:hover {
  box-shadow: 1px 1px 1px 1px rgba(83, 83, 83, 0.6);
  scale: 97%;
}
.jump-button:active,
.btn:active {
  box-shadow: 0.5px 0.5px 1px 1px rgba(68, 68, 68, 0.6);
  scale: 94%;
}

.jump-button {
  aspect-ratio: 1/1;
  border-radius: 25%;
}

.btn {
  border-radius: 2px;
  display: inline-block;
}
.btn span {
  display: block;
}

.jump-button__icon {
  fill: var(--color-gray-lightest);
  width: 100%;
  height: 100%;
}

.timeline__inner-wrapper {
  --clip-height: calc(calc(3.5 * var(--hem)) + 1px);
}

.clip {
  min-height: var(--clip-height);
  --clip-bg: white;
  border-top: 1px solid var(--color-gray-darkest);
  display: flex;
}

:host(:nth-child(even)) .clip {
  --clip-bg: var(--color-gray-lighter);
}

.clip__header {
  position: sticky;
  z-index: 2;
  left: 0;
  flex: 0 0 calc(3.2 * var(--hem));
  box-shadow: 3px 0 2px rgba(83, 83, 83, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--clip-bg);
}

.clip__number {
  color: var(--color-gray-darkest);
}

.clip__body {
  flex: 1 0 auto;
  background-color: var(--clip-bg);
  display: flex;
}
.clip__body:hover:not(:has(> :hover)) {
  cursor: move;
}

:host(.error) .clip__body,
:host(.error) .clip__header {
  background-color: var(--color-error-light);
}

/* CLIP EFFECT */
.clip__effect {
  transition: margin-left 0.1s;
  height: min-content;
}

.clip__effect--entrance {
  --hue-light: var(--color-entrance-light);
  --hue-dark: var(--color-entrance-dark);
  --hue-darkest: var(--color-entrance-darkest);
}

.clip__effect--connector-entrance {
  --hue-light: var(--color-entrance-light);
  --hue-dark: var(--color-entrance-dark);
  --hue-darkest: var(--color-entrance-darkest);
}

.clip__effect--exit {
  --hue-light: var(--color-exit-light);
  --hue-dark: var(--color-exit-dark);
  --hue-darkest: var(--color-exit-darkest);
}

.clip__effect--connector-exit {
  --hue-light: var(--color-exit-light);
  --hue-dark: var(--color-exit-dark);
  --hue-darkest: var(--color-exit-darkest);
}

.clip__effect--motion {
  --hue-light: var(--color-motion-light);
  --hue-dark: var(--color-motion-dark);
  --hue-darkest: var(--color-motion-darkest);
}

.clip__effect--text-editor {
  --hue-light: var(--color-text-editor-light);
  --hue-dark: var(--color-text-editor-dark);
  --hue-darkest: var(--color-text-editor-darkest);
}

.clip__effect--scroller {
  --hue-light: var(--color-text-editor-light);
  --hue-dark: var(--color-text-editor-dark);
  --hue-darkest: var(--color-text-editor-darkest);
}

.clip__effect--connector-setter {
  --hue-light: var(--color-text-editor-light);
  --hue-dark: var(--color-text-editor-dark);
  --hue-darkest: var(--color-text-editor-darkest);
}

.clip__effect--emphasis {
  --hue-light: var(--color-emphasis-light);
  --hue-dark: var(--color-emphasis-dark);
  --hue-darkest: var(--color-emphasis-darkest);
}

.clip__length-bars {
  height: calc(2 * var(--hem));
  position: absolute;
  display: flex;
}

.clip__length-bar--delay {
  width: calc(2 * var(--hem));
  border: 3.5px solid var(--hue-dark);
  border-right: none;
}

.clip__length-bar--duration {
  width: calc(7.8 * var(--hem));
  min-width: calc(0.25 * var(--hem));
  background-color: var(--hue-dark);
  transition: width 0.1s;
}

.clip__length-bar--end-delay {
  width: calc(4 * var(--hem));
  border: 3.5px solid var(--hue-dark);
  border-left: none;
}

/* LABEL */
.clip__label {
  position: relative;
  height: calc(2.2 * var(--hem));
  width: fit-content;
  top: calc(0.8 * var(--hem));
  display: flex;
}

.clip__label > * {
  flex-shrink: 0;
}

.clip__effect-category,
.clip__effect-name-box {
  color: var(--hue-darkest);
  background-color: var(--hue-light);
  border: 1.5px solid var(--hue-dark);
}

/* EFFECT CATEGORY */
.clip__effect-category {
  margin-right: -1.5px;
  padding: 0 calc(0.15 * var(--hem));
  display: flex;
  justify-content: center;
  align-items: center;
}

.clip__effect-category-icon {
  font-weight: 900;
  text-align: center;
}

/* EFFECT NAME */
.clip__effect-name-box {
  margin-right: -1.5px;
  padding: 0 calc(0.4 * var(--hem));
  display: grid;
  place-content: center;
}

.clip__effect-name {
  font-family: var(--font-code-family);
  font-weight: 500;
}

/* EFFECT DESCRIPTION */
.clip__description-box,
.clip__info-button-box {
  background-color: var(--clip-bg);
  border: 1.5px solid var(--color-gray);
  color: var(--color-gray);
}

.clip__description-box {
  margin-right: -1.5px;
  padding: 0 calc(0.4 * var(--hem));
  font-family: var(--font-primary-family);
  display: grid;
  place-content: center;
}

.clip__info-button-box {
  width: calc(2.2 * var(--hem));
  padding: calc(0.2 * var(--hem));
  display: flex;
  justify-content: center;
  align-items: center;
}

.clip__info-button {
  width: 100%;
  height: 100%;
  background-color: var(--clip-bg);
  border: 1.5px solid var(--color-gray);
  border-radius: 50%;
  font-family: Georgia;
  font-size: calc(1.2 * var(--hem));
  font-weight: 900;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* TIMELINE */
.timeline {
  --color-gray-darkest: #121213;
  --color-primary-blue: #04448E;
  --color-glow-blue: #039BE5;
  --color-glow-blue-light: #70efef;
  --color-glow-error: var(--color-error-dark);
  --color-glow-error-light: var(--color-error-light);
  --color-gray: #4E4E4E;
  --color-gray-light: #E0E0E0;
  --color-gray-lighter: #ECECEC;
  --color-gray-lightest: #F7F7F7;
  --color-entrance-light: #9AFF9A;
  --color-entrance-dark: #004900;
  --color-entrance-darkest: #002700;
  --color-exit-light: #FFB5B5;
  --color-exit-dark: #330200;
  --color-exit-darkest: #330200;
  --color-motion-light: #F4BCFF;
  --color-motion-dark: #24002B;
  --color-motion-darkest: #24002B;
  --color-emphasis-light: #eeea99;
  --color-emphasis-dark: #444000;
  --color-emphasis-darkest: #242200;
  --color-text-editor-light: #CDCDCD;
  --color-text-editor-dark: #242424;
  --color-text-editor-darkest: #141414;
  --color-error-dark: #4B2F36;
  --color-error-darkest: #330200;
  --color-error-light: #FFB3D2;
  --font-primary-family: "Verdana";
  --font-code-family: "Cascadia Code", "Fira Code";
  --timeline-opacity: 100%;
  container-name: timeline-ui;
  container-type: size;
  position: fixed;
  z-index: calc(infinity);
  background-color: var(--color-primary-blue);
  border-left: 4px solid var(--color-gray-darkest);
  border-right: 4px solid var(--color-gray-darkest);
  opacity: var(--timeline-opacity);
  font-family: var(--font-primary-family);
  font-weight: 400;
}
.timeline__inner-wrapper {
  --hems-per-second: 15;
  font-size: calc(1.2 * var(--hem));
}

.timeline__inner-wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-areas: "header header" "sequences error";
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr auto;
}

.timeline[dock=bottom] {
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 500px;
  min-height: 15px;
  max-height: calc(100vh - 20px);
}
.timeline[dock=bottom] .timeline__resizer--dock-bottom {
  display: initial;
}
.timeline[dock=left], .timeline[dock=right] {
  top: 0;
  height: 100vh;
  width: 500px;
  min-width: 75px;
  max-width: calc(100vw - 20px);
}
.timeline[dock=left] .timeline__inner-wrapper, .timeline[dock=right] .timeline__inner-wrapper {
  grid-template-areas: "header" "sequences" "error";
  grid-template-rows: auto auto 1fr;
  grid-template-columns: 1fr;
}
.timeline[dock=right] {
  right: 0;
}
.timeline[dock=right] .timeline__resizer--dock-right {
  display: initial;
}
.timeline[dock=left] {
  left: 0;
}
.timeline[dock=left] .timeline__resizer--dock-left {
  display: initial;
}

:host(.error) .timeline {
  background-color: var(--color-error-dark);
}
:host(.error) .timeline__header {
  background-color: var(--color-error-dark);
  border-bottom-color: var(--color-error-darkest);
}
:host(.error) .timeline__error-panel {
  display: block;
}

/* HEADER */
.timeline__header {
  background-color: var(--color-primary-blue);
  color: var(--color-gray-lightest);
  width: 100%;
  padding: calc(1 * var(--hem)) calc(2 * var(--hem));
  overflow-x: auto;
  border: 4px solid var(--color-gray-darkest);
  border-left: none;
  border-right: none;
  grid-area: header;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  column-gap: calc(3 * var(--hem));
  row-gap: calc(2.4 * var(--hem));
}

.timeline__resizer {
  position: absolute;
  display: none;
}
.timeline__resizer--dock-bottom {
  width: 100%;
  height: 8px;
  top: -5px;
  cursor: ns-resize;
}
.timeline__resizer--dock-right, .timeline__resizer--dock-left {
  height: 100%;
  width: 8px;
  cursor: ew-resize;
}
.timeline__resizer--dock-right {
  left: -5px;
}
.timeline__resizer--dock-left {
  right: -5px;
}

.timeline__name {
  font-size: calc(1.6 * var(--hem));
  font-weight: 700;
  display: -webkit-box;
  overflow: auto;
  -webkit-line-clamp: 1; /* number of lines to show */
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.timeline__jump-container {
  display: flex;
  gap: calc(0.6 * var(--hem));
  align-items: baseline;
}

.timeline__jump-wrapper {
  position: relative;
  font-size: inherit;
  background-color: var(--color-gray-lightest);
  border-radius: 2px;
  padding: calc(0.2 * var(--hem)) calc(0.4 * var(--hem));
  color: var(--color-gray-darkest);
  display: flex;
  gap: calc(0.5 * var(--hem));
}

.timeline__jump-input-container {
  display: flex;
}

.timeline__jump-input-container::after {
  content: "▼";
  align-self: center;
  display: block;
  color: currentColor;
  font-size: calc(1 * var(--hem));
  scale: 1 0.7;
  pointer-events: none;
}

.timeline__jump-input {
  appearance: none;
  background-color: transparent;
  border: none;
  min-width: calc(4 * var(--hem));
  padding: 1px 2px;
  field-sizing: content;
}

input::-webkit-calendar-picker-indicator {
  display: none !important;
}

.timeline__jump-button {
  height: calc(2 * var(--hem));
}

.timeline__opacity-container {
  display: flex;
  gap: calc(0.6 * var(--hem));
  align-items: baseline;
}

.timeline__opacity-slider-wrapper {
  position: relative;
  bottom: calc(0.4 * var(--hem));
  background-color: var(--color-gray-lightest);
  border-radius: 2px;
  padding: calc(0.8 * var(--hem)) calc(0.4 * var(--hem));
  display: grid;
  place-content: center;
  align-self: center;
  height: 0;
}

.timeline__opacity-slider {
  accent-color: var(--color-gray-darkest);
  width: calc(8 * var(--hem));
}

.timeline__dock-container {
  display: flex;
  gap: calc(0.6 * var(--hem));
  align-items: baseline;
}

.timeline__dock-wrapper {
  padding: calc(0.2 * var(--hem)) calc(0.4 * var(--hem));
  background-color: var(--color-gray-lightest);
  border-radius: 2px;
}

.timeline__dock-select {
  background-color: transparent;
  color: var(--color-gray-darkest);
  border: none;
  min-width: calc(4 * var(--hem));
  padding: 1px 2px;
  field-sizing: content;
}

/* SEQUENCES CONTAINER */
.timeline__sequences-container {
  flex: 1;
  overflow-y: scroll;
  grid-area: sequences;
  display: flex;
  flex-direction: column;
}

/* ERROR PANEL */
.timeline__error-panel {
  grid-area: error;
  position: sticky;
  z-index: 5;
  background-color: var(--color-error-dark);
  line-height: 1.5;
  color: var(--color-error-light);
  display: none;
}

.timeline__error-panel[dock=bottom] {
  top: 0;
  left: 0;
  width: 800px;
  min-width: 30px;
  max-width: 99vw;
  border-left: 3px solid var(--color-error-darkest);
}
.timeline__error-panel[dock=bottom] .timeline__error-panel-resizer--dock-bottom {
  display: initial;
}

.timeline__error-panel[dock=right],
.timeline__error-panel[dock=left] {
  left: 0;
  bottom: 0;
  height: 400px;
  min-height: 30px;
  max-height: 99vh;
  border-top: 3px solid var(--color-error-darkest);
}
.timeline__error-panel[dock=right] .timeline__error-panel-resizer--dock-side,
.timeline__error-panel[dock=left] .timeline__error-panel-resizer--dock-side {
  display: initial;
}

.timeline__error-panel-inner-wrapper {
  height: 100%;
  overflow: auto;
}

.timeline__error-panel-resizer {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
  z-index: 1;
}
.timeline__error-panel-resizer--dock-bottom {
  height: 100%;
  width: 6px;
  translate: calc(-50% - 1px);
  cursor: ew-resize;
}
.timeline__error-panel-resizer--dock-side {
  width: 100%;
  height: 6px;
  translate: 0 calc(-50% - 1px);
  cursor: ns-resize;
}

.timeline__error-panel-heading-container {
  position: sticky;
  top: 0;
  padding: calc(1 * var(--hem)) calc(2 * var(--hem));
  color: var(--color-error-light);
  background-color: #330200;
}

.timeline__error-panel-heading-text {
  font-family: "Fira Code";
  font-size: calc(1.4 * var(--hem));
  line-break: anywhere;
  display: -webkit-box;
  overflow: auto;
  -webkit-line-clamp: 1; /* number of lines to show */
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.timeline__error-panel-body {
  padding: calc(1 * var(--hem)) calc(2 * var(--hem));
  display: flex;
  flex-direction: column;
  gap: calc(1.5 * var(--hem));
}

.timeline__error-panel-section {
  display: flex;
  flex-direction: column;
  gap: calc(0.5 * var(--hem));
}

.timeline__error-panel-subheading {
  background-color: var(--color-error-darkest);
  color: var(--hue-light);
  font-weight: 600;
  padding: calc(0.5 * var(--hem)) calc(0.8 * var(--hem));
}

.timeline__error-panel ul {
  list-style-position: outside;
  padding-left: calc(2.5 * var(--hem));
  display: flex;
  flex-direction: column;
  gap: calc(0.5 * var(--hem));
}

.timeline__error-panel details {
  padding-left: calc(2 * var(--hem));
}

.timeline__error-panel details summary {
  font-style: italic;
}

.timeline__error-panel details summary > * {
  display: inline-block;
}

.timeline__error-panel .pre--block {
  border: 1px solid white;
}

.timeline__error-panel code {
  background-color: #221212;
}

@container timeline-ui (min-height: 0px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 2 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 220px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 2.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 255px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 3.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 290px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 4.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 325px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 5.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 360px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 6.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 395px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 7.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 430px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 8.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 465px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 9.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (min-height: 500px) {
  .timeline ::part(sequence__schedule) {
    max-height: calc(var(--clip-height) * 10.5 + 4.2 * var(--hem));
  }
}
@container timeline-ui (max-width: 500px) {
  .timeline .timeline__inner-wrapper {
    --hem: 9px;
    --hems-per-second: 10;
  }
}
@container timeline-ui (max-width: 350px) {
  .timeline .timeline__inner-wrapper {
    --hem: 8px;
  }
}
@container timeline-ui (max-width: 300px) {}
@container timeline-ui (max-width: 200px) {
  .timeline .timeline__inner-wrapper {
    --hem: 7px;
    --hems-per-second: 8;
  }
  .timeline .timeline__control {
    flex-direction: column;
  }
  .timeline .timeline__error-panel-body {
    word-break: break-all;
  }
}
@container timeline-ui (max-width: 100px) {
  .timeline .timeline__error-panel details,
  .timeline .timeline__error-panel ul {
    padding-left: 0;
  }
}
/*!
  Theme: Material Darker
  Author: Nate Peterson
  License: ~ MIT (or more permissive) [via base16-schemes-source]
  Maintainer: @highlightjs/core-team
  Version: 2021.09.0
*/
/*
  WARNING: DO NOT EDIT THIS FILE DIRECTLY.

  This theme file was auto-generated from the Base16 scheme material-darker
  by the Highlight.js Base16 template builder.

  - https://github.com/highlightjs/base16-highlightjs
*/
/*
base00  #212121  Default Background
base01  #303030  Lighter Background (Used for status bars, line number and folding marks)
base02  #353535  Selection Background
base03  #4A4A4A  Comments, Invisibles, Line Highlighting
base04  #B2CCD6  Dark Foreground (Used for status bars)
base05  #EEFFFF  Default Foreground, Caret, Delimiters, Operators
base06  #EEFFFF  Light Foreground (Not often used)
base07  #FFFFFF  Light Background (Not often used)
base08  #F07178  Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
base09  #F78C6C  Integers, Boolean, Constants, XML Attributes, Markup Link Url
base0A  #FFCB6B  Classes, Markup Bold, Search Text Background
base0B  #C3E88D  Strings, Inherited Class, Markup Code, Diff Inserted
base0C  #89DDFF  Support, Regular Expressions, Escape Characters, Markup Quotes
base0D  #82AAFF  Functions, Methods, Attribute IDs, Headings
base0E  #C792EA  Keywords, Storage, Selector, Markup Italic, Diff Changed
base0F  #FF5370  Deprecated, Opening/Closing Embedded Language Tags, e.g. <?php ?>
*/
pre code.hljs {
  display: block;
  overflow-x: auto;
  /*   padding: 1em; */
}

code.hljs {
  /*   padding: 3px 5px; */
}

.hljs {
  color: #EEFFFF;
  background: #212121;
}

.hljs::selection,
.hljs ::selection {
  background-color: #353535;
  color: #EEFFFF;
}

/* purposely do not highlight these things */
/* base03 - #4A4A4A -  Comments, Invisibles, Line Highlighting */
.hljs-comment {
  color: #4A4A4A;
}

/* base04 - #B2CCD6 -  Dark Foreground (Used for status bars) */
.hljs-tag {
  color: #B2CCD6;
}

/* base05 - #EEFFFF -  Default Foreground, Caret, Delimiters, Operators */
.hljs-subst,
.hljs-punctuation,
.hljs-operator {
  color: #EEFFFF;
}

.hljs-operator {
  opacity: 0.7;
}

/* base08 - Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted */
.hljs-bullet,
.hljs-variable,
.hljs-template-variable,
.hljs-selector-tag,
.hljs-name,
.hljs-deletion {
  color: #F07178;
}

/* base09 - Integers, Boolean, Constants, XML Attributes, Markup Link Url */
.hljs-symbol,
.hljs-number,
.hljs-link,
.hljs-attr,
.hljs-variable.constant_,
.hljs-literal {
  color: #F78C6C;
}

/* base0A - Classes, Markup Bold, Search Text Background */
.hljs-title,
.hljs-class .hljs-title,
.hljs-title.class_ {
  color: #FFCB6B;
}

.hljs-strong {
  font-weight: bold;
  color: #FFCB6B;
}

/* base0B - Strings, Inherited Class, Markup Code, Diff Inserted */
.hljs-code,
.hljs-addition,
.hljs-title.class_.inherited__,
.hljs-string {
  color: #C3E88D;
}

/* base0C - Support, Regular Expressions, Escape Characters, Markup Quotes */
.hljs-built_in,
.hljs-doctag,
.hljs-quote,
.hljs-keyword.hljs-atrule,
.hljs-regexp {
  color: #89DDFF;
}

/* base0D - Functions, Methods, Attribute IDs, Headings */
.hljs-function .hljs-title,
.hljs-attribute,
.ruby .hljs-property,
.hljs-title.function_,
.hljs-section {
  color: #82AAFF;
}

/* base0E - Keywords, Storage, Selector, Markup Italic, Diff Changed */
.hljs-type,
.hljs-template-tag,
.diff .hljs-meta,
.hljs-keyword {
  color: #C792EA;
}

.hljs-emphasis {
  color: #C792EA;
  font-style: italic;
}

/* base0F - Deprecated, Opening/Closing Embedded Language Tags, e.g. <?php ?> */
.hljs-meta,
.hljs-meta .hljs-keyword,
.hljs-meta .hljs-string {
  color: #FF5370;
}

.hljs-meta .hljs-keyword,
.hljs-meta-keyword {
  font-weight: bold;
}

.pre {
  display: inline-block;
  white-space: break-spaces;
  /*   font-size: hem(1.4); */
}

.pre--block {
  display: block;
}

.pre--block .code {
  padding: calc(1 * var(--hem));
}

.pre:not(.pre--block) .code {
  overflow: initial;
  padding: 0 calc(0.4 * var(--hem));
  border-radius: 5px;
  /*   background-color: transparent; */
}

code {
  font-family: "Fira Code";
}

/* SEQUENCE */
.sequence {
  width: 100%;
  background-color: var(--color-gray-darkest);
  --color-glow-light: var(--color-glow-blue-light);
  --color-glow: var(--color-glow-blue);
}

:host(.error) .sequence {
  background-color: var(--color-error-dark);
  --color-glow-light: var(--color-glow-error-light);
  --color-glow: var(--color-glow-error);
}

.sequence__header {
  background-color: inherit;
  padding: calc(1 * var(--hem)) calc(2 * var(--hem));
  color: var(--color-gray-lightest);
  display: flex;
  align-items: baseline;
  gap: calc(1.6 * var(--hem));
}

.sequence__number {
  font-size: calc(1.4 * var(--hem));
  font-weight: 700;
}

.sequence__description {
  font-weight: normal;
  display: -webkit-box;
  overflow: auto;
  -webkit-line-clamp: 2; /* number of lines to show */
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* SEQUENCE CONTROLS */
.sequence__controls-container {
  background-color: inherit;
  padding-left: calc(3.2 * var(--hem));
}

.sequence__controls {
  background-color: var(--color-gray-light);
  height: 100%;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  padding: calc(0.4 * var(--hem)) calc(1 * var(--hem));
  display: flex;
  align-items: center;
  gap: calc(1 * var(--hem));
}

.sequence__control {
  height: calc(2 * var(--hem));
}

.sequence__control--play-light {
  border-radius: 50%;
  display: flex;
  justify-content: start;
  flex-direction: row-reverse;
}
.sequence__control--play-light.sequence__control--active .sequence__control-light-svg--on {
  visibility: visible;
}
.sequence__control-lights-container {
  padding: calc(0.2 * var(--hem));
  aspect-ratio: 1/1;
  background-color: var(--color-primary-blue);
  border-radius: 50%;
  display: flex;
}

.sequence__control-light-svg {
  border-radius: 50%;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
}
.sequence__control-light-svg--on {
  box-shadow: 0 0 4px calc(0.3 * var(--hem)) var(--color-glow-blue-light);
  visibility: hidden;
}
.sequence__control-light-svg--off {
  mix-blend-mode: multiply;
  margin-left: -100%;
}

.sequence__control-auto-tag,
.sequence__control--auto-next-tag {
  height: calc(2 * var(--hem));
  padding: 0 calc(0.4 * var(--hem));
  background-color: var(--color-primary-blue);
  color: var(--color-gray-lightest);
  font-family: var(--font-code-family);
  white-space: nowrap;
  display: none;
}

.sequence__control--auto-next-tag {
  padding: 0 calc(0.4 * var(--hem));
  width: max-content;
}

:host(.autoplays) .sequence__control-lights-container {
  border-top-right-radius: initial;
  border-bottom-right-radius: initial;
}
:host(.autoplays) .sequence__control-auto-tag {
  display: grid;
  place-content: center;
}

:host(.auto-next) .sequence__control--auto-next-tag {
  display: grid;
  place-content: center;
}

/* SCHEDULE */
.sequence__schedule {
  overflow: scroll;
  max-height: calc(var(--clip-height) * 12.5 + 4.2 * var(--hem));
  transition: max-height 0.1s;
  background-color: inherit;
  display: flex;
}

.sequence__schedule:has(.info-box-shown) {
  max-height: unset !important;
}

.sequence__schedule-inner-wrapper {
  position: relative;
  min-width: 100%;
  height: 100%;
  flex: 1 0 auto;
  padding-bottom: 17.5px;
  background-color: inherit;
  display: inline-block;
}

/* SCHEDULE HEADER */
.sequence__schedule-header {
  position: sticky;
  top: 0;
  z-index: 3;
  grid-area: header;
  background-color: inherit;
  display: grid;
  grid-template-areas: "pad times" "pad ticks";
  grid-template-columns: auto 1fr;
}

.sequence__schedule-header-pad {
  grid-area: pad;
  width: calc(3.2 * var(--hem));
  background-color: inherit;
  position: sticky;
  left: 0;
  z-index: 3;
}

.sequence__schedule-times {
  grid-area: times;
  background-color: inherit;
  color: var(--color-gray-lightest);
  font-family: var(--font-code-family);
  padding: calc(0.5 * var(--hem)) 0;
  display: flex;
}

.sequence__schedule-time-wrapper {
  flex-shrink: 0;
  flex-grow: 0;
  width: calc(1 * var(--hem) * var(--hems-per-second));
}

.sequence__playhead-trail {
  position: absolute;
  background-color: var(--color-glow-light);
  box-shadow: inset 0 0 5px var(--color-glow);
  height: calc(2 * var(--hem) - 1px);
}

.sequence__playhead {
  pointer-events: none;
  width: 0;
  border-left: calc(0.2 * var(--hem)) dashed var(--color-glow-light);
  position: sticky;
  top: calc(0 * var(--hem));
  transform: translateX(calc(50% + 3.2 * var(--hem)));
  z-index: 1;
}
.sequence__playhead::before {
  content: "";
  display: block;
  position: absolute;
  left: calc(-0.2 * var(--hem));
  top: 0;
  width: calc(0.2 * var(--hem));
  background-color: var(--color-glow-light);
  opacity: 0.5;
  box-shadow: inset 0 0 1px var(--color-glow), 0 0 1px 1px var(--color-glow-light);
  height: 100%;
}

.sequence__ticks {
  grid-area: ticks;
  z-index: 1;
  background-color: var(--color-gray-light);
  height: calc(2 * var(--hem));
  border: 1px solid var(--color-gray-darkest);
  border-left: 0;
  box-shadow: 0 3px 2px rgba(83, 83, 83, 0.6);
  display: flex;
  align-items: end;
  gap: calc(0.1 * var(--hem) * var(--hems-per-second));
}

.sequence__tick {
  background-color: var(--color-gray-darkest);
  flex-shrink: 0;
  flex-grow: 0;
  /* lines up the center of the ticks with their numbers */
  transform: translateX(-50%);
}

.sequence__tick--whole {
  height: 80%;
  width: calc(0.3 * var(--hem));
  margin-right: calc(-0.3 * var(--hem));
}

.sequence__tick--half {
  height: 60%;
  width: calc(0.2 * var(--hem));
  margin-right: calc(-0.2 * var(--hem));
  background-color: color-mix(in srgb, var(--color-gray-darkest) 70%, white);
}

.sequence__tick--tenth {
  height: 40%;
  width: calc(0.1 * var(--hem));
  margin-right: calc(-0.1 * var(--hem));
  background-color: color-mix(in srgb, var(--color-gray-darkest) 50%, white);
}

/* CLIPS */
.sequence__clips {
  width: 100%;
}

.sequence__dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: gray;
  z-index: 4;
  pointer-events: none;
  mix-blend-mode: multiply;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.1s;
}
.sequence__dark-overlay--shown {
  visibility: visible;
  opacity: 0.7;
}

.clip-info-box--entrance {
  --hue-light: var(--color-entrance-light);
  --hue-dark: var(--color-entrance-dark);
  --hue-darkest: var(--color-entrance-darkest);
}

.clip-info-box--connector-entrance {
  --hue-light: var(--color-entrance-light);
  --hue-dark: var(--color-entrance-dark);
  --hue-darkest: var(--color-entrance-darkest);
}

.clip-info-box--exit {
  --hue-light: var(--color-exit-light);
  --hue-dark: var(--color-exit-dark);
  --hue-darkest: var(--color-exit-darkest);
}

.clip-info-box--connector-exit {
  --hue-light: var(--color-exit-light);
  --hue-dark: var(--color-exit-dark);
  --hue-darkest: var(--color-exit-darkest);
}

.clip-info-box--motion {
  --hue-light: var(--color-motion-light);
  --hue-dark: var(--color-motion-dark);
  --hue-darkest: var(--color-motion-darkest);
}

.clip-info-box--text-editor {
  --hue-light: var(--color-text-editor-light);
  --hue-dark: var(--color-text-editor-dark);
  --hue-darkest: var(--color-text-editor-darkest);
}

.clip-info-box--scroller {
  --hue-light: var(--color-text-editor-light);
  --hue-dark: var(--color-text-editor-dark);
  --hue-darkest: var(--color-text-editor-darkest);
}

.clip-info-box--connector-setter {
  --hue-light: var(--color-text-editor-light);
  --hue-dark: var(--color-text-editor-dark);
  --hue-darkest: var(--color-text-editor-darkest);
}

.clip-info-box--emphasis {
  --hue-light: var(--color-emphasis-light);
  --hue-dark: var(--color-emphasis-dark);
  --hue-darkest: var(--color-emphasis-darkest);
}

.clip-info-box {
  position: relative;
  background-color: var(--hue-light);
  border: 2px solid var(--hue-dark);
  color: var(--hue-darkest);
  font-size: calc(1.2 * var(--hem));
  line-height: 1.2;
  margin-bottom: calc(3 * var(--hem));
  margin-left: -1.5px;
}

.clip-info-box__resizer {
  --resizer-thickness: 6px;
  position: absolute;
  --offset: calc(50% + (2px / 2));
}

.clip-info-box__resizer--width {
  height: 100%;
  width: var(--resizer-thickness);
  translate: var(--offset);
  top: 0;
  right: 0;
  cursor: ew-resize;
}

.clip-info-box__resizer--height {
  width: 100%;
  height: var(--resizer-thickness);
  translate: 0 var(--offset);
  bottom: 0;
  left: 0;
  cursor: ns-resize;
}

.clip-info-box__inner-wrapper {
  display: flex;
  flex-direction: column;
}

.clip-info-box__nav {
  background-color: var(--hue-dark);
  overflow-x: auto;
  flex-shrink: 0;
  width: auto;
  display: flex;
  justify-content: space-between;
  gap: 1px;
}

.clip-info-box__tabs {
  list-style: none;
  display: flex;
}

.clip-info-box__tab-button {
  padding: calc(0.2 * var(--hem)) calc(0.4 * var(--hem));
  border: 1.5px solid var(--hue-dark);
  border-top: none;
  height: 100%;
  white-space: nowrap;
  background-color: var(--hue-light);
  transition: background-color 0.1s, color 0.1s;
}
.clip-info-box__tab-button:hover {
  background-color: color-mix(in srgb, var(--hue-light) 60%, white);
}
.clip-info-box__tab-button:active {
  color: var(--hue-light);
  background-color: color-mix(in srgb, var(--hue-dark) 80%, white);
}
.clip-info-box__tab-button.clip-info-box__tab-button--current {
  cursor: default;
  background-color: var(--hue-dark);
  color: var(--hue-light);
}

.clip-info-box__tab:first-child .clip-info-box__tab-button {
  border-left: none;
}
.clip-info-box__tab:not(:last-child) .clip-info-box__tab-button {
  border-right: none;
}
.clip-info-box__tab:last-child .clip-info-box__tab-button {
  border-right-color: var(--hue-light);
}

.clip-info-box__close-button {
  background-color: var(--hue-light);
  border: none;
  border-bottom: 1.5px solid var(--hue-dark);
  width: calc(1.8 * var(--hem));
  font-size: calc(1.2 * var(--hem));
  font-weight: 900;
  transition: background-color 0.1s, color 0.1s;
}
.clip-info-box__close-button:hover {
  background-color: color-mix(in srgb, var(--hue-light) 60%, white);
}
.clip-info-box__close-button:active {
  color: var(--hue-light);
  background-color: color-mix(in srgb, var(--hue-dark) 80%, white);
}

.clip-info-box__body {
  padding: calc(1 * var(--hem)) calc(1 * var(--hem)) 17.5px;
  height: calc(11 * var(--clip-height));
  min-height: calc(6 * var(--hem));
  max-height: calc(12 * var(--clip-height));
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: calc(1.5 * var(--hem));
}

.clip-info-box__section {
  display: flex;
  flex-direction: column;
  gap: calc(0.5 * var(--hem));
}

.clip-info-box__section-name {
  background-color: var(--hue-dark);
  color: var(--hue-light);
  font-weight: 600;
  padding: calc(0.5 * var(--hem)) calc(0.8 * var(--hem));
}

.clip-info-box__section-body {
  line-height: 1.3;
  padding: 0 calc(0.8 * var(--hem));
  display: flex;
  flex-direction: column;
  gap: calc(0.6 * var(--hem));
}
.clip-info-box__section-body .rows {
  display: flex;
  flex-direction: column;
  gap: calc(0.5 * var(--hem));
}
.clip-info-box__section-body .row:not(:last-child) {
  border-bottom: 1px solid currentColor;
  padding-bottom: calc(0.5 * var(--hem));
}
.clip-info-box__section-body .row {
  display: flex;
  flex-wrap: wrap;
  column-gap: calc(1 * var(--hem));
  row-gap: calc(0.5 * var(--hem));
}
.clip-info-box__section-body .col--head {
  font-style: italic;
  font-weight: 600;
  flex: 20;
  white-space: nowrap;
}
.clip-info-box__section-body .col--body {
  flex: 80;
  min-width: 200px;
}

@container clip-info-box (max-width: 200px) {}

/*# sourceMappingURL=main.css.map */
`;

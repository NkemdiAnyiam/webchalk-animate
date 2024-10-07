"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = load;
const typedoc_1 = require("typedoc");
const hider = function hider() {
    const signature = document.querySelector(".tsd-signature");
    while (true) {
        const prop = signature.querySelector("a.tsd-kind-property");
        if (!prop) {
            break;
        }
        let firstBr = prop.previousElementSibling;
        let secondBr = prop.nextElementSibling;
        while (!(firstBr instanceof HTMLBRElement)) {
            firstBr = firstBr?.previousElementSibling;
        }
        while (!(secondBr instanceof HTMLBRElement)) {
            secondBr = secondBr?.nextElementSibling;
        }
        let curr = firstBr.nextElementSibling;
        while (curr !== secondBr) {
            curr = curr?.nextElementSibling;
            curr.previousElementSibling?.remove();
        }
        secondBr.remove();
    }
}.toString();
function load(app) {
    // todo: Add event listeners to app, app.converter, etc.
    // this function may be async
    app.renderer.hooks.on("body.end", () => {
        return typedoc_1.JSX.createElement(typedoc_1.JSX.Raw, {
            html: /* html */ `
        <script>
          const regex = new RegExp('\.(Keyframes(Generator|GeneratorsGenerator)|RafMutators(Generator|GeneratorsGenerator))\.html');
          if (regex.test(window.location.pathname)) {
            ${hider}
            window.addEventListener('load', hider);
          }
        </script>
        `,
        });
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = load;
const typedoc_1 = require("typedoc");
const handleSpecialCategories = (function handleSpecialCategories() {
    // remove "hidden" list from index section
    const hiddenCategorySection = [...document.querySelectorAll(`.tsd-index-heading`)]
        .find(h3 => h3.textContent?.toLowerCase() === 'hidden')
        ?.closest('.tsd-index-section');
    hiddenCategorySection?.remove();
    // this part seems to run too soon
    // // remove any navigation associated with hidden categories
    // [...document.querySelectorAll(`li:has(> details > summary[data-key$="$hidden"])`)]
    //   .forEach(item => item.remove());
    // replace "none" index heading with "Uncategorized" and move it to the top
    const noneCategorySection = [...document.querySelectorAll(`.tsd-index-heading`)]
        .find(h3 => h3.textContent?.toLowerCase() === 'none')
        ?.closest('.tsd-index-section');
    if (noneCategorySection) {
        const h3 = noneCategorySection.querySelector('h3');
        h3.textContent = 'Uncategorized';
        // h3.style.display = 'none';
        const tsdIndexHeading = noneCategorySection.parentElement?.querySelector('.tsd-index-heading');
        noneCategorySection.remove();
        tsdIndexHeading?.insertAdjacentElement('afterend', noneCategorySection);
    }
}).toString();
function load(app) {
    // todo: Add event listeners to app, app.converter, etc.
    // this function may be async
    app.renderer.hooks.on('body.end', () => {
        return typedoc_1.JSX.createElement(typedoc_1.JSX.Raw, { html: /* html */ `
        <script>
          ${handleSpecialCategories}
          window.addEventListener('load', handleSpecialCategories);
        </script>
        ` });
    });
}

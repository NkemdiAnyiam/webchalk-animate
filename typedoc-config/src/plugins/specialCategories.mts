import { JSX, Application } from "typedoc";

const handleSpecialCategories = (function handleSpecialCategories() {
  // remove "hidden" list from index section
  const hiddenCategorySection = [...document.querySelectorAll(`h2`)]
    .find(h2 => h2.textContent?.toLowerCase() === 'hidden')
    ?.closest('details');
  hiddenCategorySection?.remove();

  // this part seems to run too soon
  // // remove any navigation associated with hidden categories
  // [...document.querySelectorAll(`li:has(> details > summary[data-key$="$hidden"])`)]
  //   .forEach(item => item.remove());

  // // replace "none" index heading with "Uncategorized" and move it to the top
  // const noneCategorySection = [...document.querySelectorAll(`.tsd-index-heading`)]
  //   .find(h3 => h3.textContent?.toLowerCase() === 'none')
  //   ?.closest('.tsd-index-section');
  // if (noneCategorySection) {
  //   const h3 = noneCategorySection.querySelector('h3')!;
  //   h3.textContent = 'Uncategorized';
  //   // h3.style.display = 'none';
  //   const tsdIndexHeading = noneCategorySection.parentElement?.querySelector('.tsd-index-heading');
  //   noneCategorySection.remove();
  //   tsdIndexHeading?.insertAdjacentElement('afterend', noneCategorySection);
  // }
}).toString();

export function load(app: Application) {
    app.renderer.hooks.on('body.end', () => {
      return JSX.createElement(JSX.Raw, {html: /* html */`
        <script type="module" defer>
          ${handleSpecialCategories}
          window.addEventListener('load', handleSpecialCategories);
        </script>
        `});
    })
}

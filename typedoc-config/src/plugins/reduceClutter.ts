import td, { JSX, Application } from "typedoc";

const reduceClutter = function reduceClutter() {
  const members = [...document.querySelectorAll('.tsd-panel.tsd-member')];
  for (const member of members) {
    // wrap code portion of return statement(s) (plural if overloads present) in a scrollable div
    const h4s = [...member.querySelectorAll('.tsd-returns-title')];
    for (const h4 of h4s) {
      const returnTextNode = h4.firstChild!; // text node that literally says "Returns "
      returnTextNode.textContent = (returnTextNode.textContent ?? '').trim();
      returnTextNode.remove();
      h4.innerHTML = /* html */ `<pre class="tsd-returns-content">${h4.innerHTML}</pre>`;
      h4.insertBefore(returnTextNode, h4.firstChild);
    }

    // remove duplicated code portion of return statement that appears after the return description
    // (it can be used to display TSDoc, but it can take up too much space and looks unappealing, so it
    // is being removed)
    member.querySelector(':scope > .tsd-signatures > .tsd-description > h4.tsd-returns-title ~ ul.tsd-parameters')?.remove();

    // address strange output from wrapping examples in <div>s
    const exampleDiv = member.querySelector('[id^="example--"]');
    if (exampleDiv) {
      // remove duplicated portion
      exampleDiv.querySelector('ul.tsd-parameters')?.remove();
      // place actual example-related elements at the root of the example div
      const unnecessaryWrapper = exampleDiv.querySelector('.tsd-comment.tsd-typography');
      if (unnecessaryWrapper) {
        for (const exampleComponent of [...unnecessaryWrapper.children]) {
          exampleDiv.insertAdjacentElement('beforeend', exampleComponent);
        }
        unnecessaryWrapper.remove();
      }

      // move the nested example divs outside of this example div
      for (const weirdlyNestedExample of [...exampleDiv.querySelectorAll('[id^="example--"]')]) {
        exampleDiv.insertAdjacentElement('afterend', weirdlyNestedExample);
      }
    }  
  }

  const h3 = document.querySelector(`h3:has(> a[href="#createAnimationClipFactories"])`);
  if (!h3) { return; }
  const section = h3.closest('.tsd-panel.tsd-member');
  if (!section) { throw new Error() }
  section.querySelector('.tsd-type-parameter-list')?.closest('.tsd-panel')?.remove();
}.toString();

export function load(app: Application) {
  // todo: Add event listeners to app, app.converter, etc.
  // this function may be async
  app.renderer.hooks.on("body.end", () => {
    return JSX.createElement(JSX.Raw, {
      html: /* html */ `
        <script type="module" defer>
          ${reduceClutter}
          window.addEventListener('load', reduceClutter);
        </script>
        `,
    });
  });
}

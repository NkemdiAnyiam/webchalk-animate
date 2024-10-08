import td, { JSX, Application } from "typedoc";

const hider = function hider() {
  // remove Properties section from Index section since it will only contain the never-typed generator functions
  const indexHeadings = [...document.querySelectorAll('.tsd-index-heading')];
  for (const heading of indexHeadings) {
    if (heading.textContent === 'Properties') {
      heading.closest('.tsd-index-section')?.remove();
    }
  }

  // remove all Properties <details>
  document.querySelector('summary[data-key="section-Properties"]')?.closest('.tsd-accordion')?.remove();
  document.querySelector('summary[data-key="tsd-otp-Properties"]')?.closest('.tsd-accordion')?.remove();

  // remove never-typed generator properties from signature
  const signature = document.querySelector(".tsd-signature")!;
  while (true) {
    const prop = signature.querySelector("a.tsd-kind-property");
    if (!prop) { break; }
    let firstBr = prop.previousElementSibling;
    let secondBr = prop.nextElementSibling;
    while (!(firstBr instanceof HTMLBRElement)) {
      firstBr = firstBr?.previousElementSibling!;
    }
    while (!(secondBr instanceof HTMLBRElement)) {
      secondBr = secondBr?.nextElementSibling!;
    }
    let curr = firstBr.nextElementSibling;
    while (curr !== secondBr) {
      curr = curr?.nextElementSibling!;
      curr.previousElementSibling?.remove();
    }
    secondBr.remove();
  }
}.toString();

export function load(app: Application) {
  // todo: Add event listeners to app, app.converter, etc.
  // this function may be async
  app.renderer.hooks.on("body.end", () => {
    return JSX.createElement(JSX.Raw, {
      html: /* html */ `
        <script type="module" defer>
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

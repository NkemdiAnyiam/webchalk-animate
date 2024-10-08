import td, { JSX, Application } from "typedoc";

const hider = (function hider() {
  // remove property sections and navigation links associated with doscScriptRunner
  // document.querySelector('a#______')?.closest('.tsd-panel.tsd-member')?.remove();
  // [...document.querySelectorAll('a[href$="#______"]')].forEach((elem) => elem.remove());

  if (window.location.pathname.includes(`2_animationEffects_libraryPresetBanks`)) {
    // remove interface signature and GitHub source
    document.querySelector('.col-content > .tsd-signature')?.remove();
    document.querySelector('.col-content > .tsd-sources')?.remove();

    // for each member
    const members = [...document.querySelectorAll('.tsd-panel.tsd-member')];
    for (const member of members) {
      // remove member signature
      member.querySelector(':scope > .tsd-signature')?.remove();
      // remove signatures of objects returned by generator functions
      member.querySelector('h5 + ul.tsd-parameters')?.remove();
      const h5List = [...member.querySelectorAll('h5')];
      for (const h5 of h5List) { h5.classList.add('custom-color'); }
      // remove return title for objects returned by generator functions
      member.querySelector('.tsd-returns-title')?.remove();
      // remove duplicate list of config objects' properties
      member.querySelector('li.tsd-parameter ul.tsd-parameters:has(> li.tsd-parameter > h5')?.remove();
    }
  }
}).toString();

export function load(app: Application) {
    // todo: Add event listeners to app, app.converter, etc.
    // this function may be async
    app.renderer.hooks.on('body.end', () => {
      return JSX.createElement(JSX.Raw, {html: /* html */`
        <script type="module" defer>
          ${hider}
          window.addEventListener('load', hider);
        </script>
        `});
    })
}

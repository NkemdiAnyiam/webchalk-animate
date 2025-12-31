window.addEventListener('DOMContentLoaded', () => {
  const arr15 = [
    '.tsd-signatures .tsd-description .tsd-returns-content',
    '.tsd-signature',
    'h3.tsd-anchor-link + .tsd-signatures .tsd-signature',
    'h3.tsd-anchor-link + .tsd-signature'
  ];
  const arr30 = [
    '.tsd-tag-example pre',
  ];

  setTimeout(() => {
    for (const selector of arr15) {
      const elems = [...document.querySelectorAll(selector)];
      for (const elem of elems) {
        if (elem.getBoundingClientRect().height > 240) {
          elem.style.maxHeight = "15rem";
        }
      }
    }
    for (const selector of arr30) {
      const elems = [...document.querySelectorAll(selector)];
      for (const elem of elems) {
        if (elem.getBoundingClientRect().height > 240) {
          elem.style.maxHeight = "30rem";
        }
      }
    }

    // while (true) {
    //   const startElems = [...document.querySelectorAll('.tsd-signature-type')]
    //     .filter(elem =>
    //         (elem.textContent === 'TPresetEffectDefinition' || elem.textContent === 'TPresetEffectBank')
    //         && (elem.nextSibling?.nextSibling?.textContent?.trim() === '&')
    //     );
    //   if (startElems.length === 0) { break; }
    //   for (const elem of startElems) {
    //     let counter = 1;
    //     let currNode = elem.nextSibling?.nextSibling?.nextSibling?.nextSibling;
    //     currNode?.previousSibling?.previousSibling?.previousSibling?.remove();
    //     currNode?.previousSibling?.previousSibling?.remove();
    //     currNode?.previousSibling?.remove();
    //     while (counter > 0) {
    //       if (!currNode) { break; }
    //       const prev = currNode;
    //       currNode = currNode.nextSibling;
    //       // if (
    //       //   currNode.textContent.startsWith(`"`) && currNode.textContent.endsWith(`"`)
    //       //   || currNode.textContent.startsWith(`'`) && currNode.textContent.endsWith(`'`)
    //       //   || currNode.textContent.startsWith('`') && currNode.textContent.endsWith('`')
    //       // ) {console.log(currNode.textContent); continue; }
    //       if (currNode?.textContent?.includes('{')) { ++counter; }
    //       if (currNode?.textContent?.includes('}')) { --counter; }
    //       prev.remove();
    //       if (!currNode?.nextSibling) { break; }
    //     }
    //     currNode?.remove();
    //   }
    // }

    const bloatList = ['ValidationBloat', 'ClipTypeToHiddenBankCategorizer'];
    const tmiList = ['AnimClip'];

    while (true) {
      const startElems = [...document.querySelectorAll('.tsd-signature-type')]
        .filter(elem =>
          ([bloatList, tmiList].some(list => list.some(entry => elem.textContent === entry)))
          && (!elem.dataset.shouldRetain)
        );

      if (startElems.length === 0) { break; }

      for (const elem of startElems) {
        let currNode = elem.nextSibling;
        let counter = 1;

        if (tmiList.some(entry => elem.textContent === entry)) {
          elem.dataset.shouldRetain = true;
          // remove type parameters
          do {
            if (!currNode) { break; }
            const prev = currNode;
            currNode = currNode.nextSibling;
            // if (
            //   currNode.textContent.startsWith(`"`) && currNode.textContent.endsWith(`"`)
            //   || currNode.textContent.startsWith(`'`) && currNode.textContent.endsWith(`'`)
            //   || currNode.textContent.startsWith('`') && currNode.textContent.endsWith('`')
            // ) {console.log(currNode.textContent); continue; }
            if (currNode?.textContent?.includes('<')) { ++counter; }
            if (currNode?.textContent?.includes('>')) { --counter; }
            prev.remove();
            if (!currNode?.nextSibling) { break; }
          } while (counter > 0);
        }
        else if (bloatList.some(entry => elem.textContent === entry)) {
          // remove preceding spaces and '&'
          for (let i = 0; i < 3; ++i) { currNode?.previousSibling?.remove(); }
          // remove entire type
          do {
            if (!currNode) { break; }
            const prev = currNode;
            currNode = currNode.nextSibling;
            // if (
            //   currNode.textContent.startsWith(`"`) && currNode.textContent.endsWith(`"`)
            //   || currNode.textContent.startsWith(`'`) && currNode.textContent.endsWith(`'`)
            //   || currNode.textContent.startsWith('`') && currNode.textContent.endsWith('`')
            // ) {console.log(currNode.textContent); continue; }
            if (currNode?.textContent?.includes('<')) { ++counter; }
            if (currNode?.textContent?.includes('>')) { --counter; }
            prev.remove();
            if (!currNode?.nextSibling) { break; }
          } while (counter > 0);
        }
        currNode?.remove();
      }
    }
  }, 50)

});

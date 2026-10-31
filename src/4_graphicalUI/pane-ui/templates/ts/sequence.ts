export const htmlComponentStr = /*html*/`
<div class="sequence">
  <!-- <div class="sequence__headings">
    <div class="sequence__heading-container">
    </div>
  </div> -->

  <div class="sequence__content">
    <header class="sequence__header">
      <div class="sequence__header-row">
        <!-- TODO: probably not going to be h2 anymore with inclusion of optional headings -->
        <h2 class="sequence__number"></h2>
        <p class="sequence__description"></p>
      </div>
    </header>

    <div class="sequence__controls-container">
      <div class="sequence__controls">
        <div class="sequence__control sequence__control--play-light">
          <div class="sequence__control-auto-tag">Auto</div>
          <div class="sequence__control-lights-container">
            <svg class="sequence__control-light-svg sequence__control-light-svg--on" viewBox="0 0 52 52" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                <g transform="matrix(1,0,0,1,-1906,-1244.98)">
                    <g id="On" transform="matrix(1,-0,-0,1,1906,1244.98)">
                        <use xlink:href="#_Image1" width="100%" height="100%"/>
                    </g>
                </g>
                <defs>
                    <image id="_Image1" width="100%" height="100%" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAACdklEQVQ4jV2TPW9cVRCGn5lz7rl32U0WI8cuKZDcIShWokUUUYyClDJp0lHy0Vgif4BIVCj8AiqnpEBuTBOlXQklJT0FRZCjeH3vPfecGQqvg2GkVzPFzLzzKfxP9n7+86CZzR807yxW7Tys0hzaGevUsW4Sx8/elz+u+8uVsfzxd9XUfhPn8+/jrWWXdpekJbQLaGfQAikzRHgkypPTPbG3CeaPn6uG+KvuLA7D3pJm/13S7g3aHWhvQhu3CYA4gJ5zgvPF6Z6YAvjYf21NObRZxRaGzR2fgy/AIzhgQAVqB7bgcze+ApDu0S8HRH0h+4tO928S95fEW+/R7u6QdoQ2XLI32wrCFvIXg498pJ6HB6ZT5zLiMmKecRuxOmL1GjOQgWmrc6KbMvej52EFhnlAyoBPPZY7bOiwvqUkeTtp20IAcZCBVfQyrigOWfEcsT5hfaKmhtJEJNyAxeUc9Kr8AjKA9KwiZcSzI6NgfUDaiLWBGiISFACvC+pM0AChgpxfQjcQKWVNtrveO1wIlgRplKpXwYZNBR1maGjRIsgG9DXIpq6jW13Tl7s0jiewICCXXbsZVgs1T2gaEG3REtEN6N+OXrCO4n7sffnOo3dEQAQDcMcnw8aKzjLSDKgkZGrQcyWceS/Ep8FenL7SDz/biNkd3AEHdzDw6lAqPlZ8KPh5gbMMrzM+lKNXX35wEgFEwxPP5bZQDt2BAp6BwaltRVJBNSOWICco8YTU/cR2K9jL3zx8fPuY6mcy+acY8epyJDsyOH7hyJvay8QRGr59c/TJv890XZqHPxy4yH3RsCLGFbFFYruW1K0ldU+Hx/f+887/AA+qMazS3oM0AAAAAElFTkSuQmCC"/>
                </defs>
            </svg>
            <svg class="sequence__control-light-svg sequence__control-light-svg--off" viewBox="0 0 42 42" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                <g transform="matrix(1,0,0,1,-1911,-1020)">
                    <g opacity="0.75">
                        <g id="Off" transform="matrix(1,-0,-0,1,1911,1020)">
                            <use xlink:href="#_Image1" width="100%" height="100%"/>
                        </g>
                    </g>
                </g>
                <defs>
                    <image id="_Image1" width="100%" height="100%" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAByklEQVQ4jXWTPY4TQRCFX1V198xJnGJZcwACB4A5wG7qnJ/EFiR2YpFYBmk5hDcHLYmPMJJNyh2QSNCu5K4qAtyjsVlKKunNTNenV2/UhIvabDaDGON1jLFJKTVVVSGl1KaU2hjjdjKZ/OifpyJWqxWLyJsQwoeUUp1SQkoJVVXhBEFK6UFE3jPzzXg8NgBgAFgsFqyqX1X1o5nVZgYzuzQHADURfQLwZbfbcQfIOb/OOT9XVZQukNLu3tcvzOwVANBsNhsQ0XcRqUMIiDF2tuu67nRVVYgxQkTAzADwYGZPQs75mohqd/8bChFEBCKCnHOnT0MwMxARANTufhVyzg0RdTaJCMwMEcHxeAQznw33Ye7eBFVtAHQviaiDFF2GVfUMAKAJOWcUQH+N/nAJsAD634KZte7+sqxwWe4Od4eqIoTQOTi5aDtA//AlwMwQY+wcFAgRtQHA1szenVL9r4OyQs/FPTPfyn6//zkcDn+7+7PHAAXyyPNsPp/f8SnAGwDfLgNTVeSc/2lVvVPVzwAgAHA4HHw0Gm0B/ALwlIhC/0/0+p6ZZwDeLpdLA3q3sdR0Oh0AuGLmhpmb085tCKENIdyu1+uz6/wHgsobI8NMneUAAAAASUVORK5CYII="/>
                </defs>
            </svg>
          </div>
        </div>
        <button class="sequence__control sequence__control--jump-button jump-button">
          <svg class="sequence__control-icon jump-button__icon" viewBox="0 0 12 11" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
              <g transform="matrix(1,0,0,1,-1816,-1259.5)">
                <g transform="matrix(1,0,0,0.983239,-180,15.3245)">
                  <path d="M1996,1265.38C1998.93,1270.29 2001.98,1269.89 2003,1270.04L2003,1267.89L2008,1272.36L2003,1276.57L2003,1274.79C2002.57,1274.71 1996.05,1273.85 1996,1265.38Z"/>
                </g>
              </g>
          </svg>
        </button>
        <div class="sequence__control sequence__control--auto-next-tag">
          Segue →
        </div>
      </div>
    </div>
    
    <div class="sequence__schedule" part="sequence__schedule">
      <div class="sequence__playhead"></div>
      <div class="sequence__schedule-inner-wrapper">
        <div class="sequence__schedule-header">
          <div class="sequence__schedule-header-pad"></div>
          <div class="sequence__schedule-times">
            <div class="sequence__schedule-time-wrapper">
              <span class="sequence__schedule-time">0:00:00</span>
            </div>
          </div>
          <div class="sequence__ticks">
            <div class="sequence__playhead-trail"></div>
            <!-- 0-1 -->
            <div class="sequence__tick sequence__tick--whole"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--half"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
            <div class="sequence__tick sequence__tick--tenth"></div>
          </div>
        </div>
        <div class="sequence__clips"></div>
        <div class="sequence__empty-time-fill pointer-events-none"></div>
        <div class="sequence__dark-overlay"></div>
      </div>
    </div>
  </div>
</div>
`;

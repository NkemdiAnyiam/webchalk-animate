export const htmlComponentStr = /*html*/`
<div class="timeline">
  <div class="timeline__resizer timeline__resizer--dock-bottom" draggable="false"></div>
  <div class="timeline__resizer timeline__resizer--dock-right" draggable="false"></div>
  <div class="timeline__resizer timeline__resizer--dock-left" draggable="false"></div>
  <div class="timeline__inner-wrapper">
    <header class="timeline__header">
      <h1 class="timeline__name"></h1>
      <div class="timeline__control timeline__jump-container timeline__jump-container--step">
        <label for="timeline__jump-input--step">Step</label>
        <div class="timeline__jump-wrapper">
          <div class="timeline__jump-input-container" onclick="this.querySelector('input').focus()">
            <input
              id="timeline__jump-input--step" class="timeline__jump-input timeline__jump-input--step" type="text" list="timeline__jump-datalist--step"
              onclick="this.showPicker()"
            />
            <datalist name="timeline__jump-datalist--step" id="timeline__jump-datalist--step" class="timeline__jump-datalist">
              <!-- <option value="1">1</option> -->
            </datalist>
          </div>
          <button class="timeline__jump-button jump-button">
            <svg class="sequence__control-icon jump-button__icon" viewBox="0 0 12 11" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                <g transform="matrix(1,0,0,1,-1816,-1259.5)">
                  <g transform="matrix(1,0,0,0.983239,-180,15.3245)">
                    <path d="M1996,1265.38C1998.93,1270.29 2001.98,1269.89 2003,1270.04L2003,1267.89L2008,1272.36L2003,1276.57L2003,1274.79C2002.57,1274.71 1996.05,1273.85 1996,1265.38Z"/>
                  </g>
                </g>
            </svg>
          </button>
        </div>
      </div>
      <div class="timeline__control timeline__jump-container timeline__jump-container--tag">
        <label for="timeline__jump-input--tag">Tag</label>
        <div class="timeline__jump-wrapper">
          <div class="timeline__jump-input-container" onclick="this.querySelector('input').focus()">
            <input
              id="timeline__jump-input--tag" class="timeline__jump-input timline__jump-input--tag" type="text" list="timeline__jump-datalist--tag"
              onclick="this.showPicker()"
            />
            <datalist name="timeline__jump-datalist--tag" id="timeline__jump-datalist--tag" class="timeline__jump-datalist">
            </datalist>
          </div>
          <button class="timeline__jump-button jump-button">
            <svg class="sequence__control-icon jump-button__icon" viewBox="0 0 12 11" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                <g transform="matrix(1,0,0,1,-1816,-1259.5)">
                  <g transform="matrix(1,0,0,0.983239,-180,15.3245)">
                    <path d="M1996,1265.38C1998.93,1270.29 2001.98,1269.89 2003,1270.04L2003,1267.89L2008,1272.36L2003,1276.57L2003,1274.79C2002.57,1274.71 1996.05,1273.85 1996,1265.38Z"/>
                  </g>
                </g>
            </svg>
          </button>
        </div>
      </div>
      <div class="timeline__control timeline__opacity-container">
        <label for="timeline__opacity-slider">Opacity</label>
        <div class="timeline__opacity-slider-wrapper">
          <input type="range" class="timeline__opacity-slider" id="timeline__opacity-slider" min="5" />
        </div>
      </div>
      <div class="timeline__control timeline__dock-container">
        <label for="timeline__dock-select">Dock</label>
        <div class="timeline__dock-wrapper">
          <div class="timeline__dock-select-container">
            <select id="timeline__dock-select" class="timeline__dock-select">
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </div>
      <!-- <div class="timeline__clickthrough-button-container">
        <button class="timeline__clickthrough-button btn"><span>Click Through</span></button>
      </div> -->
    </header>
    <div class="timeline__sequences-container">
    </div>
    <div class="timeline__error-panel">
      <div class="timeline__error-panel-resizer timeline__error-panel-resizer--dock-bottom" draggable="false"></div>
      <div class="timeline__error-panel-resizer timeline__error-panel-resizer--dock-side" draggable="false"></div>
      <div class="timeline__error-panel-inner-wrapper">
        <div class="timeline__error-panel-heading-container">
          <h2 class="timeline__error-panel-heading-text">
            <!-- ERROR: Invalid Entrance Attempt -->
          </h2>
        </div>
        <div class="timeline__error-panel-body-wrapper">
          <div class="timeline__error-panel-body">
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

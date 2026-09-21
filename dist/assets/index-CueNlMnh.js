(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.querySelector(`#app`);if(!e)throw Error(`App root was not found`);e.innerHTML=`
  <header class="topbar">
    <div>
      <p class="eyebrow">Arduino canvas</p>
      <h1>Color sketch</h1>
    </div>
    <button class="connect-button" type="button">Connect Arduino</button>
  </header>
  <main>
    <section class="intro">
      <div>
        <p class="eyebrow">Draw with your hardware</p>
        <h2>Make something colorful.</h2>
        <p class="description">Connect your Arduino and draw on the canvas. Every color received from the serial port becomes your brush color.</p>
      </div>
      <div class="status-card">
        <span class="status-dot" aria-hidden="true"></span>
        <div>
          <span class="status-label">Current color</span>
          <strong class="color-name">#111827</strong>
        </div>
        <span class="color-swatch" aria-hidden="true"></span>
      </div>
    </section>
    <section class="canvas-wrap">
      <canvas aria-label="Drawing canvas"></canvas>
      <div class="canvas-hint">Press and drag to draw</div>
    </section>
    <p class="connection-status" role="status">Arduino is not connected</p>
  </main>
`;var t=e.querySelector(`canvas`),n=e.querySelector(`.connect-button`),r=e.querySelector(`.color-name`),i=e.querySelector(`.color-swatch`),a=e.querySelector(`.status-dot`),o=e.querySelector(`.connection-status`);if(!t||!n||!r||!i||!a||!o)throw Error(`Drawing UI could not be initialized`);var s=t.getContext(`2d`);if(!s)throw Error(`Canvas drawing is not supported`);var c=`#111827`,l=c,u=null,d=null,f=!1;function p(){let e=t.getBoundingClientRect(),n=window.devicePixelRatio||1;t.width=Math.max(1,Math.floor(e.width*n)),t.height=Math.max(1,Math.floor(e.height*n)),s.scale(n,n),s.lineCap=`round`,s.lineJoin=`round`}function m(e){let t=e.trim();t&&CSS.supports(`color`,t)&&(l=t,r.textContent=t,i.style.backgroundColor=t)}function h(e){let n=t.getBoundingClientRect();return{x:e.clientX-n.left,y:e.clientY-n.top}}function g(e){s.fillStyle=l,s.beginPath(),s.arc(e.x,e.y,7,0,Math.PI*2),s.fill()}t.addEventListener(`pointerdown`,e=>{f=!0,t.setPointerCapture(e.pointerId);let n=h(e);s.strokeStyle=l,s.lineWidth=14,s.beginPath(),s.moveTo(n.x,n.y),g(n)}),t.addEventListener(`pointermove`,e=>{if(!f)return;let t=h(e);s.lineTo(t.x,t.y),s.stroke(),s.beginPath(),s.moveTo(t.x,t.y)});function _(e){f&&t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),f=!1}t.addEventListener(`pointerup`,_),t.addEventListener(`pointercancel`,_);function v(e,t){n.textContent=e?`Disconnect Arduino`:`Connect Arduino`,n.classList.toggle(`connected`,e),a.classList.toggle(`connected`,e),o.textContent=t}async function y(e){if(!e.readable)throw Error(`The serial port is not readable`);let t=e.readable.getReader();d=t;let n=new TextDecoder,r=``;try{for(;;){let{value:e,done:i}=await t.read();if(i)break;r+=n.decode(e,{stream:!0});let a=r.split(/\r?\n/);r=a.pop()??``,a.forEach(m)}m(r)}finally{t.releaseLock(),d=null}}async function b(){d?.releaseLock(),d=null,u&&=(await u.close(),null),v(!1,`Arduino is not connected`)}async function x(){let e=navigator.serial;if(!e){v(!1,`Web Serial is not supported in this browser`);return}u=await e.requestPort(),await u.open({baudRate:9600}),v(!0,`Listening for colors from Arduino`),y(u).catch(e=>{v(!1,e instanceof Error?e.message:`Serial connection failed`),u=null})}n.addEventListener(`click`,()=>{(u?b():x()).catch(e=>{v(!1,e instanceof Error?e.message:`Unable to connect to Arduino`),u=null})}),p(),m(c),window.addEventListener(`resize`,p);
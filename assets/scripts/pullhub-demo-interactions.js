// Lightweight homepage demos: draggable capture box + editable board picker.
(function () {
  function initCaptureDemo() {
    var canvas = document.querySelector('.pull-canvas');
    var box = document.querySelector('.pull-canvas .marquee');
    var dims = box && box.querySelector('.dims');
    if (!canvas || !box || !dims) return;

    var state = null;
    function px(n) { return Math.round(n) + 'px'; }
    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
    function updateDims() {
      dims.textContent = Math.round(box.offsetWidth * 2.2) + ' × ' + Math.round(box.offsetHeight * 2.2);
    }
    updateDims();

    box.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var resize = e.target.classList.contains('h') ? e.target.classList[1] : '';
      state = {
        resize: resize,
        sx: e.clientX,
        sy: e.clientY,
        left: box.offsetLeft,
        top: box.offsetTop,
        w: box.offsetWidth,
        h: box.offsetHeight,
        maxW: rect.width,
        maxH: rect.height
      };
      box.setPointerCapture(e.pointerId);
    });

    box.addEventListener('pointermove', function (e) {
      if (!state) return;
      var dx = e.clientX - state.sx;
      var dy = e.clientY - state.sy;
      var left = state.left;
      var top = state.top;
      var w = state.w;
      var h = state.h;
      var min = 72;

      if (!state.resize) {
        left = clamp(state.left + dx, 8, state.maxW - state.w - 8);
        top = clamp(state.top + dy, 8, state.maxH - state.h - 8);
      } else {
        if (state.resize.indexOf('r') >= 0) w = clamp(state.w + dx, min, state.maxW - state.left - 8);
        if (state.resize.indexOf('b') >= 0) h = clamp(state.h + dy, min, state.maxH - state.top - 8);
        if (state.resize.indexOf('l') >= 0) {
          left = clamp(state.left + dx, 8, state.left + state.w - min);
          w = state.w + state.left - left;
        }
        if (state.resize.indexOf('t') >= 0) {
          top = clamp(state.top + dy, 8, state.top + state.h - min);
          h = state.h + state.top - top;
        }
      }
      box.style.left = px(left);
      box.style.top = px(top);
      box.style.width = px(w);
      box.style.height = px(h);
      updateDims();
    });

    function end() { state = null; }
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
  }

  function initBoardPickerDemo() {
    var rows = document.querySelectorAll('.board-pick .bp:not(.add)');
    var colors = ['var(--accent)', 'var(--pop-2)', 'var(--pop-1)', 'oklch(0.7 0.16 150)'];
    rows.forEach(function (row) {
      var dot = row.querySelector('.d');
      var name = row.querySelector('.bp-name');
      var count = row.querySelector('em');
      if (!dot || !name || !count) return;

      row.addEventListener('click', function (e) {
        if (e.target === dot || e.target === name) return;
        rows.forEach(function (r) {
          r.classList.remove('is-on');
          var ck = r.querySelector('.ck');
          if (ck) ck.remove();
        });
        row.classList.add('is-on');
        count.textContent = '+1';
        var ck = document.createElement('span');
        ck.className = 'ck';
        ck.textContent = '✓';
        row.appendChild(ck);
      });

      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        var current = dot.dataset.colorIndex ? parseInt(dot.dataset.colorIndex, 10) : 0;
        current = (current + 1) % colors.length;
        dot.dataset.colorIndex = String(current);
        dot.style.background = colors[current];
      });

      name.addEventListener('click', function (e) {
        e.stopPropagation();
        name.contentEditable = 'true';
        name.focus();
        var range = document.createRange();
        range.selectNodeContents(name);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      });
      name.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          name.blur();
        }
      });
      name.addEventListener('blur', function () {
        name.contentEditable = 'false';
        if (!name.textContent.trim()) name.textContent = 'Untitled Board';
      });
    });
  }

  /* PULLHUB_INTERACTION_V2 START: click to push board into Slides */
  function initSlidePushDemo() {
    var mock = document.querySelector('.slide-mock');
    var button = mock && mock.querySelector('.slide-push-btn');
    if (!mock || !button) return;

    button.addEventListener('click', function () {
      var pushed = mock.classList.toggle('is-pushed');
      button.textContent = pushed ? 'PUSHED ✓' : 'PUSH BOARD';
    });
  }
  /* PULLHUB_INTERACTION_V2 END */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initCaptureDemo();
      initBoardPickerDemo();
      initSlidePushDemo();
    });
  } else {
    initCaptureDemo();
    initBoardPickerDemo();
    initSlidePushDemo();
  }
})();

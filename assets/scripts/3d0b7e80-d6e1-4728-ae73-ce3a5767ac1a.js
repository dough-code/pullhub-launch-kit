// problem.js — "the Pullhub way": click any reference to save it to a board, live count.
(function () {
  function init() {
    var win = document.querySelector('.savewin');
    if (!win) return;

    var tiles  = win.querySelectorAll('.ref-tile');
    var dots   = win.querySelectorAll('.sb-dots i');
    var countB = win.querySelector('.sb-count b');
    var preview = win.querySelector('.board-preview');
    var addr = win.querySelector('.tab-cycle');
    var tabs = win.querySelectorAll('.source-tabs span');
    var sources = [
      'pinterest.com/search/branding',
      'behance.net/gallery/identity',
      'are.na/block/moodboard',
      'figma.com/community/file'
    ];
    var saved  = 0;
    var sourceIndex = 0;

    function render() {
      countB.textContent = saved;
      dots.forEach(function (d, i) { d.classList.toggle('on', i < saved); });
      if (preview) preview.classList.toggle('has-items', saved > 0);
    }

    function renderSource() {
      if (!addr || !tabs.length) return;
      win.classList.add('is-switching');
      setTimeout(function () {
        addr.textContent = sources[sourceIndex];
        tabs.forEach(function (tab, i) { tab.classList.toggle('is-active', i === sourceIndex); });
        win.classList.remove('is-switching');
        sourceIndex = (sourceIndex + 1) % sources.length;
      }, 120);
    }

    function addPreview(tile, index) {
      if (!preview || preview.querySelector('[data-ref="' + index + '"]')) return;
      var thumb = document.createElement('span');
      thumb.className = 'board-thumb';
      thumb.dataset.ref = String(index);
      thumb.style.background = tile.style.background;
      preview.appendChild(thumb);
    }

    function removePreview(index) {
      if (!preview) return;
      var thumb = preview.querySelector('[data-ref="' + index + '"]');
      if (thumb) thumb.remove();
    }

    tiles.forEach(function (tile, index) {
      tile.addEventListener('click', function () {
        var on = tile.classList.toggle('is-saved');
        saved += on ? 1 : -1;
        if (saved < 0) saved = 0;
        if (on) addPreview(tile, index);
        else removePreview(index);
        render();
      });
    });

    renderSource();
    setInterval(renderSource, 1900);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

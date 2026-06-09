// boards.js — draggable boards with per-board actions: recolor, copy share link, push to Slides.
(function () {
  var TIDY_TRANSITION =
    'top .5s cubic-bezier(.22,.8,.2,1), left .5s cubic-bezier(.22,.8,.2,1), transform .5s cubic-bezier(.22,.8,.2,1)';

  function init() {
    var stage = document.querySelector('.boards-stage');
    if (!stage) return;
    var hint = stage.querySelector('.drag-hint');
    var tidyBtn = stage.querySelector('.tidy-btn');
    var toast = stage.querySelector('.board-toast');
    var z = 20;
    var cards = stage.querySelectorAll('.board-card');
    var toastTimer;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1900);
    }

    // ---- dragging ----
    cards.forEach(function (card) {
      var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
      card.addEventListener('pointerdown', function (e) {
        // don't drag when interacting with the action controls
        if (e.target.closest('.bc-actions')) return;
        dragging = true;
        card.style.transition = 'none';
        card.setPointerCapture(e.pointerId);
        card.style.zIndex = ++z;
        ox = card.offsetLeft;
        oy = card.offsetTop;
        card.style.left = ox + 'px';
        card.style.top = oy + 'px';
        sx = e.clientX;
        sy = e.clientY;
        if (hint) hint.style.opacity = '0';
      });
      card.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        card.style.left = (ox + e.clientX - sx) + 'px';
        card.style.top = (oy + e.clientY - sy) + 'px';
      });
      function end() { dragging = false; }
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', end);

      // bring to front on press anywhere
      card.addEventListener('pointerdown', function () { card.style.zIndex = ++z; });

      var name = card.dataset.name || 'board';

      // ---- recolor ----
      card.querySelectorAll('.bc-color button').forEach(function (sw) {
        sw.addEventListener('click', function () {
          card.style.setProperty('--bc', sw.dataset.c);
          card.querySelectorAll('.bc-color button').forEach(function (b) {
            b.setAttribute('aria-pressed', b === sw ? 'true' : 'false');
          });
        });
      });

      // ---- copy share link ----
      var share = card.querySelector('.bc-btn.share');
      if (share) {
        share.addEventListener('click', function () {
          var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          var link = 'https://debutt.studio/boards/' + slug;
          var done = function () {
            share.textContent = 'Copied!';
            showToast('\uD83D\uDD17  Link copied \u2014 ' + link);
            setTimeout(function () { share.textContent = 'Share'; }, 1600);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(done, done);
          } else {
            done();
          }
        });
      }

      // ---- push to Slides ----
      var slides = card.querySelector('.bc-btn.slides');
      if (slides) {
        slides.addEventListener('click', function () {
          if (slides.classList.contains('is-done')) return;
          var label = slides.textContent;
          slides.textContent = 'Pushing\u2026';
          showToast('Pushing \u201C' + name + '\u201D to Google Slides\u2026');
          setTimeout(function () {
            slides.classList.add('is-done');
            slides.textContent = 'Sent \u2713';
            showToast('\u201C' + name + '\u201D pushed to Google Slides \u2713');
            setTimeout(function () {
              slides.classList.remove('is-done');
              slides.textContent = label;
            }, 1900);
          }, 850);
        });
      }
    });

    // ---- snap tidy ----
    function tidy() {
      var sw = stage.clientWidth;
      cards.forEach(function (card, i) {
        card.style.transition = TIDY_TRANSITION;
        var left = sw - card.offsetWidth - 34;
        if (left < 16) left = 16;
        card.style.left = left + 'px';
        card.style.top = (26 + i * 58) + 'px';
        card.style.transform = 'rotate(0deg)';
        card.style.zIndex = ++z;
      });
      if (hint) hint.style.opacity = '0';
    }
    if (tidyBtn) tidyBtn.addEventListener('click', tidy);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

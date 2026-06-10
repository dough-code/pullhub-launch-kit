(async () => {
  const THEME_KEY = 'srh_viewer_theme';
  const themeClassicBtn = document.getElementById('theme-classic-btn');
  const themePullhubBtn = document.getElementById('theme-pullhub-btn');
  function applyViewerTheme(theme) {
    const usePullhub = theme === 'pullhub';
    document.body.classList.toggle('theme-classic', !usePullhub);
    localStorage.setItem(THEME_KEY, usePullhub ? 'pullhub' : 'classic');
    themeClassicBtn?.classList.toggle('active', !usePullhub);
    themePullhubBtn?.classList.toggle('active', usePullhub);
  }
  applyViewerTheme(localStorage.getItem(THEME_KEY) || 'classic');
  themeClassicBtn?.addEventListener('click', () => applyViewerTheme('classic'));
  themePullhubBtn?.addEventListener('click', () => applyViewerTheme('pullhub'));

  const params    = new URLSearchParams(location.search);
  const boardId   = params.get('bid');
  const projectId = params.get('pid');

  if (!boardId || !projectId) { showError('Missing board ID or project ID in URL'); return; }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shared_boards/${boardId}`;
  let doc;
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.status === 403 || resp.status === 401) {
      showError('Access denied (HTTP ' + resp.status + ').\n\nFix: Firebase Console → Firestore → Rules:\n\nmatch /shared_boards/{id} { allow read: if true; }');
      return;
    }
    if (resp.status === 404) { showError('Board not found — the share link may be expired or invalid.'); return; }
    if (!resp.ok) { showError(`Firestore returned HTTP ${resp.status} — check your Firebase project ID.`); return; }
    doc = await resp.json();
  } catch(e) {
    if (e.name === 'AbortError') {
      showError('Request timed out after 12 seconds.\n\nPossible causes:\n• Firestore security rules blocking public reads\n• Incorrect Firebase project ID\n• Network connectivity issue');
    } else {
      showError('Network error: ' + e.message);
    }
    return;
  }

  function fv(field) {
    if (!field) return undefined;
    return field.stringValue ?? field.booleanValue ?? field.integerValue ?? field.arrayValue ?? undefined;
  }
  const fields   = doc.fields || {};
  const name     = fv(fields.name)  || 'Shared Board';
  const color    = fv(fields.color) || '#1D9E75';
  const rawItems = fields.items?.arrayValue?.values || [];

  const items = rawItems.map(v => {
    const f = v.mapValue?.fields || {};
    return {
      url:       fv(f.url)       || '',
      dataUrl:   fv(f.dataUrl)   || '',
      pageUrl:   fv(f.pageUrl)   || '',
      mediaType: fv(f.mediaType) || 'image',
      note:      fv(f.note)      || ''
    };
  }).filter(item => item.dataUrl || item.url);

  function extensionFromType(type = '') {
    if (type.includes('gif')) return 'gif';
    if (type.includes('png')) return 'png';
    if (type.includes('webp')) return 'webp';
    if (type.includes('svg')) return 'svg';
    return 'jpg';
  }

  function extensionFromSource(src = '') {
    const clean = src.split('?')[0].split('#')[0];
    const match = clean.match(/\.([a-z0-9]{2,5})$/i);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  function triggerBlobDownload(blob, filename) {
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
  }

  async function downloadSharedImage(item, idx) {
    const src = item.dataUrl || item.url;
    const baseName = `pullhub-${name.replace(/[/\\:*?"<>|]/g, '_')}-${String(idx + 1).padStart(2, '0')}`;
    try {
      if (src.startsWith('data:')) {
        const resp = await fetch(src);
        const blob = await resp.blob();
        triggerBlobDownload(blob, `${baseName}.${extensionFromType(blob.type)}`);
        return;
      }

      const resp = await fetch(src, { mode: 'cors' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      triggerBlobDownload(blob, `${baseName}.${extensionFromType(blob.type) || extensionFromSource(src)}`);
    } catch(e) {
      alert('Direct download is blocked by this image host. Use Export ZIP, or open the original image and choose Save Image As.');
    }
  }

  // ── Render header ─────────────────────────────────────────────
  document.getElementById('state-loading').style.display = 'none';
  document.getElementById('board-view').style.display    = 'block';
  document.getElementById('board-dot').style.background  = color;
  document.getElementById('board-title').textContent     = name;
  document.getElementById('board-count').textContent     = `${items.length} image${items.length !== 1 ? 's' : ''}`;
  document.getElementById('hdr-meta').textContent        = `"${name}" · ${items.length} items`;
  document.title = `${name} — Pullhub`;

  // ── Empty state ───────────────────────────────────────────────
  if (items.length === 0) {
    document.getElementById('grid').innerHTML =
      `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:#a1a1a6;">
        <div style="font-size:48px;margin-bottom:16px;">🖼️</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">No images in this board</div>
        <div style="font-size:13px;">The board was shared but contains no saved images yet.</div>
      </div>`;
    return;
  }

  // ── Layout toggle ─────────────────────────────────────────────
  const LAYOUT_KEY = 'srh_viewer_layout';
  const VALID_LAYOUTS = new Set(['grid', 'portrait', 'masonry']);
  let currentLayout = localStorage.getItem(LAYOUT_KEY) || 'grid';
  if (!VALID_LAYOUTS.has(currentLayout)) currentLayout = 'grid';
  const grid = document.getElementById('grid');

  function applyLayout(layout) {
    if (!VALID_LAYOUTS.has(layout)) layout = 'grid';
    currentLayout = layout;
    localStorage.setItem(LAYOUT_KEY, layout);
    grid.className = layout === 'grid' ? 'grid' : `grid ${layout}`;
    document.getElementById('btn-layout-grid').classList.toggle('active', layout === 'grid');
    document.getElementById('btn-layout-portrait').classList.toggle('active', layout === 'portrait');
    document.getElementById('btn-layout-masonry').classList.toggle('active', layout === 'masonry');
    // Masonry shows natural ratio; portrait uses CSS 3:4; grid uses fixed 4:3.
    grid.querySelectorAll('.card img').forEach(img => {
      img.style.aspectRatio = layout === 'masonry' ? 'unset' : '';
    });
  }

  document.getElementById('btn-layout-grid').addEventListener('click', () => applyLayout('grid'));
  document.getElementById('btn-layout-portrait').addEventListener('click', () => applyLayout('portrait'));
  document.getElementById('btn-layout-masonry').addEventListener('click', () => applyLayout('masonry'));

  // ── Build cards ───────────────────────────────────────────────
  items.forEach((item, idx) => {
    const src = item.dataUrl || item.url;
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.idx = idx;

    // Image
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.loading = 'lazy';
    card.appendChild(img);

    // Hover quick actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const dlBtn = document.createElement('button');
    dlBtn.className = 'card-action-btn';
    dlBtn.type = 'button';
    dlBtn.title = 'Download';
    dlBtn.textContent = '⬇';
    dlBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      downloadSharedImage(item, idx);
    });
    actions.appendChild(dlBtn);
    if (item.pageUrl) {
      const sourceBtn = document.createElement('a');
      sourceBtn.className = 'card-action-btn';
      sourceBtn.href = item.pageUrl;
      sourceBtn.target = '_blank';
      sourceBtn.rel = 'noopener';
      sourceBtn.title = 'Visit source';
      sourceBtn.textContent = '↗';
      sourceBtn.addEventListener('click', e => e.stopPropagation());
      actions.appendChild(sourceBtn);
    }
    card.appendChild(actions);

    // Card footer: source link + note
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    if (item.pageUrl) {
      const link = document.createElement('a');
      link.href = item.pageUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.title = item.pageUrl; link.className = 'card-source-link';
      try { link.textContent = new URL(item.pageUrl).hostname; }
      catch { link.textContent = 'Source ↗'; }
      footer.appendChild(link);
    }
    if (item.note) {
      const noteEl = document.createElement('div');
      noteEl.className = 'card-note';
      noteEl.textContent = item.note;
      footer.appendChild(noteEl);
    }
    if (footer.hasChildNodes()) card.appendChild(footer);

    // Click → lightbox
    img.addEventListener('click', () => openLightbox(idx));
    grid.appendChild(card);
  });

  // Apply saved layout
  applyLayout(currentLayout);

  // ── Lightbox with keyboard navigation ─────────────────────────
  const lb     = document.getElementById('lightbox');
  const lbImg  = document.getElementById('lb-img');
  const lbDl   = document.getElementById('lb-dl');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  let   lbIdx  = 0;

  function openLightbox(idx) {
    lbIdx = idx;
    renderLightbox();
    lb.classList.add('show');
  }

  function renderLightbox() {
    const item = items[lbIdx];
    const src  = item.dataUrl || item.url;
    lbImg.src  = src;
    lbDl.href  = src;
    lbDl.download = `pullhub-image-${String(lbIdx + 1).padStart(2, '0')}.${extensionFromSource(src)}`;

    // Source link
    const existing = document.getElementById('lb-source');
    if (existing) existing.remove();
    if (item.pageUrl) {
      const a = document.createElement('a');
      a.id = 'lb-source'; a.href = item.pageUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = '↗ Visit source';
      a.style.cssText = 'position:absolute;bottom:20px;left:20px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;text-decoration:none;font-family:inherit;';
      lb.appendChild(a);
    }

    // Prev/Next visibility
    if (lbPrev) lbPrev.style.display = lbIdx > 0 ? 'flex' : 'none';
    if (lbNext) lbNext.style.display = lbIdx < items.length - 1 ? 'flex' : 'none';

    // Counter
    const counter = document.getElementById('lb-counter');
    if (counter) counter.textContent = `${lbIdx + 1} / ${items.length}`;
  }

  function closeLightbox() {
    lb.classList.remove('show');
    const existing = document.getElementById('lb-source');
    if (existing) existing.remove();
  }

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  lbDl.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    downloadSharedImage(items[lbIdx], lbIdx);
  });
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  if (lbPrev) lbPrev.addEventListener('click', e => { e.stopPropagation(); if (lbIdx > 0) { lbIdx--; renderLightbox(); } });
  if (lbNext) lbNext.addEventListener('click', e => { e.stopPropagation(); if (lbIdx < items.length - 1) { lbIdx++; renderLightbox(); } });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('show')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft'  && lbIdx > 0)               { lbIdx--; renderLightbox(); }
    if (e.key === 'ArrowRight' && lbIdx < items.length - 1) { lbIdx++; renderLightbox(); }
  });

  // ── Copy share link ───────────────────────────────────────────
  const copyBtn = document.getElementById('copy-link-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(location.href).then(() => {
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyBtn.textContent = '🔗 Copy link'; }, 2000);
      });
    });
  }

  // ── Export shared board as Pullhub-compatible ZIP ─────────────
  const exportBtn = document.getElementById('export-zip-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      if (!window.JSZip) { alert('ZIP export is unavailable on this page.'); return; }
      const originalText = exportBtn.textContent;
      exportBtn.disabled = true;
      exportBtn.textContent = 'Exporting...';
      try {
        const zip = new JSZip();
        const folderName = name.replace(/[/\\:*?"<>|]/g, '_');
        const folder = zip.folder(folderName);
        const metaItems = [];
        let embeddedCount = 0;
        let blockedCount = 0;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const mutable = { ...item };
          const pad = String(i + 1).padStart(3, '0');

          if (item.dataUrl && item.dataUrl.startsWith('data:')) {
            const [header, b64] = item.dataUrl.split(',');
            const ext = header.includes('jpeg') || header.includes('jpg') ? 'jpg' : header.includes('gif') ? 'gif' : 'png';
            const file = `shared_${pad}.${ext}`;
            folder.file(file, b64, { base64: true });
            mutable.file = file;
            embeddedCount++;
            delete mutable.dataUrl;
          } else if (item.url) {
            try {
              const resp = await fetch(item.url);
              if (resp.ok) {
                const blob = await resp.blob();
                const ext = blob.type.includes('gif') ? 'gif' : blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
                const file = `shared_${pad}.${ext}`;
                folder.file(file, await blob.arrayBuffer());
                mutable.file = file;
                embeddedCount++;
              } else {
                blockedCount++;
              }
            } catch(e) {
              // Keep URL-only metadata when remote images block cross-origin downloads.
              blockedCount++;
            }
          }
          metaItems.push(mutable);
        }

        if (blockedCount > 0) {
          zip.file('README.txt', [
            'Pullhub shared board ZIP export',
            '',
            `${embeddedCount} image file(s) were embedded in this ZIP.`,
            `${blockedCount} remote image(s) could not be embedded because the image host blocked browser downloads.`,
            '',
            'Blocked remote images remain as URLs in metadata.json.',
            'For a fuller backup of remote images, export the board from the Pullhub extension.'
          ].join('\n'));
        }

        zip.file('metadata.json', JSON.stringify({
          boardName: name,
          boardColors: { [name]: color },
          items: metaItems,
          exportedFrom: 'Pullhub shared board',
          exportedAt: new Date().toISOString()
        }, null, 2));

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = `Pullhub_${folderName}_Export.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objUrl);
        exportBtn.textContent = `Exported: ${embeddedCount} file${embeddedCount === 1 ? '' : 's'}, ${blockedCount} blocked`;
        alert(`Export complete.\n\nEmbedded image files: ${embeddedCount}\nRemote images not embedded: ${blockedCount}`);
        setTimeout(() => { exportBtn.textContent = originalText; }, 1800);
      } catch(e) {
        alert('Export failed: ' + (e.message || 'Unknown error'));
        exportBtn.textContent = originalText;
      } finally {
        exportBtn.disabled = false;
      }
    });
  }
})();

function showError(msg) {
  document.getElementById('state-loading').style.display = 'none';
  document.getElementById('state-error').style.display   = 'block';
  const el = document.getElementById('error-msg');
  el.style.whiteSpace = 'pre-wrap'; el.style.textAlign = 'left';
  el.style.fontFamily = 'monospace'; el.style.fontSize = '12px';
  el.style.background = '#f5f5f7'; el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.textContent = msg;
}

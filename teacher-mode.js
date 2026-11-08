(() => {
  'use strict';

  const init = () => {
    const editor = document.getElementById('panel-editor-controls');
    if (!editor || editor.dataset.teacherUxReady === 'true') return;
    editor.dataset.teacherUxReady = 'true';

    const panels = [...editor.children].filter(node => node.classList.contains('liquid-panel'));
    // Existing layout order: language card, winner details, item, achievement, grade, photo, theme.
    const [languagePanel, winnerPanel, itemPanel, achievementPanel, gradePanel, photoPanel, themePanel] = panels;
    const dropZone = document.getElementById('drop-zone');
    const photoReset = document.getElementById('btn-reset-photo-adjustments');
    const adjustmentGroup = photoPanel?.querySelector('.space-y-3.pt-1');
    const previewPanel = document.getElementById('panel-poster-preview');
    const canvasWrapper = document.getElementById('poster-canvas-wrapper');
    const downloadButton = document.getElementById('btn-main-download');
    const langButtons = document.querySelectorAll('.lang-switch-btn');

    if (!winnerPanel || !itemPanel || !achievementPanel || !gradePanel || !photoPanel || !themePanel) return;

    const toolbar = document.createElement('section');
    toolbar.className = 'teacher-toolbar';
    toolbar.setAttribute('aria-label', 'Accessibility and editor mode');
    toolbar.innerHTML = `
      <div class="teacher-toolbar-group" role="group" aria-label="Editor mode">
        <button type="button" class="teacher-control is-active" id="teacher-mode-button" aria-pressed="true">Teacher Mode / അധ്യാപക മോഡ്</button>
        <button type="button" class="teacher-control" id="advanced-mode-button" aria-pressed="false">Advanced</button>
      </div>
      <div class="teacher-toolbar-group" role="group" aria-label="Text size">
        <label for="teacher-text-size" style="color:#e2e8f0;font-size:13px;font-weight:700">Text size / അക്ഷരവലുപ്പം</label>
        <select id="teacher-text-size" class="teacher-control" aria-label="Choose text size">
          <option value="normal">Normal</option><option value="large">Large</option><option value="xlarge">Extra large</option>
        </select>
        <button type="button" class="teacher-control" id="teacher-contrast-button" aria-pressed="false">High contrast</button>
      </div>`;
    editor.insertBefore(toolbar, editor.firstChild);

    const stepper = document.createElement('section');
    stepper.className = 'teacher-stepper';
    stepper.setAttribute('aria-label', 'Poster creation steps');
    stepper.innerHTML = `
      <div class="teacher-step-top">
        <strong id="teacher-step-title" style="color:#fff;font-size:16px">Step 1 of 5 · Upload photo</strong>
        <span id="teacher-step-count" style="color:#fcd34d;font-size:13px;font-weight:800">20%</span>
      </div>
      <div class="teacher-progress" role="progressbar" aria-label="Poster creation progress" aria-valuemin="1" aria-valuemax="5" aria-valuenow="1" id="teacher-progress"><div class="teacher-progress-fill" id="teacher-progress-fill"></div></div>
      <nav class="teacher-step-list" aria-label="Creation steps">
        <button type="button" class="teacher-step-dot" data-step="1" aria-current="step">1<br>Photo</button>
        <button type="button" class="teacher-step-dot" data-step="2">2<br>Details</button>
        <button type="button" class="teacher-step-dot" data-step="3">3<br>Award</button>
        <button type="button" class="teacher-step-dot" data-step="4">4<br>Design</button>
        <button type="button" class="teacher-step-dot" data-step="5">5<br>Finish</button>
      </nav>
      <p class="teacher-step-description" id="teacher-step-description" aria-live="polite">Choose a clear photo of the winner. നിങ്ങളുടെ ഫോണിൽ നിന്ന് ചിത്രം തിരഞ്ഞെടുക്കുക.</p>
      <div class="teacher-step-actions">
        <button type="button" class="teacher-control" id="teacher-back-button" disabled>← Back / തിരികെ</button>
        <button type="button" class="teacher-control is-active" id="teacher-next-button">Continue / തുടരുക →</button>
      </div>`;
    editor.insertBefore(stepper, languagePanel || toolbar.nextSibling);

    const summary = document.createElement('section');
    summary.className = 'teacher-summary';
    summary.hidden = true;
    summary.innerHTML = `
      <h2 style="color:#fff;font-size:20px;font-weight:800">Your poster is ready to review / പോസ്റ്റർ പരിശോധിക്കാം</h2>
      <p style="color:#e2e8f0;font-size:14px;margin-top:6px">Check the details below, preview your poster, then download it.</p>
      <dl>
        <dt>Winner / വിജയി</dt><dd id="teacher-summary-name">—</dd>
        <dt>Item / ഇനം</dt><dd id="teacher-summary-item">—</dd>
        <dt>Achievement / നേട്ടം</dt><dd id="teacher-summary-award">—</dd>
        <dt>School / സ്കൂൾ</dt><dd id="teacher-summary-school">—</dd>
      </dl>
      <div class="teacher-step-actions">
        <button type="button" class="teacher-control" id="teacher-review-button">View poster / പോസ്റ്റർ കാണുക</button>
        <button type="button" class="teacher-control is-active" id="teacher-summary-download">Download / ഡൗൺലോഡ്</button>
      </div>
      <button type="button" class="teacher-control" id="teacher-new-poster" style="width:100%;margin-top:10px">Create another poster / മറ്റൊരു പോസ്റ്റർ</button>`;
    editor.appendChild(summary);

    const stepInfo = {
      1: {title:'Upload winner photo / ചിത്രം ചേർക്കുക',desc:'Choose a clear photo of the winner. നിങ്ങളുടെ ഫോണിൽ നിന്ന് ചിത്രം തിരഞ്ഞെടുക്കുക.'},
      2: {title:'Enter winner details / വിവരങ്ങൾ നൽകുക',desc:'Enter the winner name and competition item. School name is optional.'},
      3: {title:'Choose achievement / നേട്ടം തിരഞ്ഞെടുക്കുക',desc:'Select the correct place and grade. The selected options appear on the poster.'},
      4: {title:'Review the design / രൂപകൽപ്പന ക്രമീകരിക്കുക',desc:'Choose a poster theme. Advanced photo adjustments are available here.'},
      5: {title:'Preview and download / പരിശോധിച്ച് ഡൗൺലോഡ് ചെയ്യുക',desc:'Check the poster carefully before downloading the high-resolution image.'}
    };
    let step = 1;
    let mode = 'teacher';

    const stepDots = [...stepper.querySelectorAll('[data-step]')];
    const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;
    const setPanelVisibility = (panel, visible) => {
      if (!panel) return;
      panel.dataset.teacherHidden = visible ? 'false' : 'true';
    };
    const updateSummary = () => {
      const val = id => document.getElementById(id)?.value?.trim() || '—';
      document.getElementById('teacher-summary-name').textContent = val('input-winner-name');
      document.getElementById('teacher-summary-item').textContent = val('input-item-name');
      document.getElementById('teacher-summary-school').textContent = val('input-school-name');
      document.getElementById('teacher-summary-award').textContent = document.getElementById('current-badge-label')?.textContent?.trim() || '—';
    };
    const showStep = (nextStep, shouldScroll = true) => {
      step = Math.max(1, Math.min(5, nextStep));
      const visible = new Set();
      if (step === 1) visible.add(photoPanel);
      if (step === 1) {
        const photoInput = document.getElementById('file-photo-input');
        if (!photoInput?.files?.length) {
          document.getElementById('drop-zone')?.scrollIntoView({behavior:'smooth',block:'center'});
          photoInput?.focus();
          photoInput?.setCustomValidity('Please choose a winner photo / വിജയിയുടെ ചിത്രം തിരഞ്ഞെടുക്കുക.');
          photoInput?.reportValidity();
          return;
        }
        photoInput.setCustomValidity('');
      }
      if (step === 2) { visible.add(winnerPanel); visible.add(itemPanel); }
      if (step === 3) { visible.add(achievementPanel); visible.add(gradePanel); }
      if (step === 4) { visible.add(photoPanel); visible.add(themePanel); }
      panels.forEach(panel => setPanelVisibility(panel, visible.has(panel) && panel !== languagePanel));
      languagePanel.dataset.teacherHidden = 'true';
      summary.hidden = step !== 5;
      if (dropZone) dropZone.hidden = step === 4;
      if (adjustmentGroup) adjustmentGroup.hidden = step === 1;
      if (photoReset) photoReset.hidden = step === 1;
      const info = stepInfo[step];
      document.getElementById('teacher-step-title').textContent = `Step ${step} of 5 · ${info.title}`;
      document.getElementById('teacher-step-description').textContent = info.desc;
      document.getElementById('teacher-step-count').textContent = `${step * 20}%`;
      document.getElementById('teacher-progress-fill').style.width = `${step * 20}%`;
      document.getElementById('teacher-progress').setAttribute('aria-valuenow', String(step));
      document.getElementById('teacher-back-button').disabled = step === 1;
      document.getElementById('teacher-next-button').textContent = step === 5 ? 'Start again / വീണ്ടും തുടങ്ങുക' : 'Continue / തുടരുക →';
      stepDots.forEach(dot => {
        const active = Number(dot.dataset.step) === step;
        dot.setAttribute('aria-current', active ? 'step' : 'false');
        dot.disabled = Number(dot.dataset.step) > step;
      });
      if (step === 5) updateSummary();
      if (shouldScroll) {
        const target = step === 5 ? summary : (step === 1 || step === 4 ? photoPanel : step === 2 ? winnerPanel : achievementPanel);
        target?.scrollIntoView({behavior:'smooth',block:'start'});
      }
      try { sessionStorage.setItem('kalolsavam-teacher-step', String(step)); } catch (_) {}
    };

    const setMode = nextMode => {
      mode = nextMode;
      const teacher = mode === 'teacher';
      document.body.classList.toggle('teacher-mode', teacher);
      stepper.hidden = !teacher;
      [toolbar.querySelector('#teacher-mode-button'),toolbar.querySelector('#advanced-mode-button')].forEach((button,index) => {
        const active = index === (teacher ? 0 : 1);
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-active', active);
      });
      if (teacher) showStep(step, false);
      else {
        panels.forEach(panel => setPanelVisibility(panel, true));
        if (dropZone) dropZone.hidden = false;
        if (adjustmentGroup) adjustmentGroup.hidden = false;
        if (photoReset) photoReset.hidden = false;
        summary.hidden = true;
      }
      try { localStorage.setItem('kalolsavam-editor-mode', mode); } catch (_) {}
    };

    toolbar.querySelector('#teacher-mode-button').addEventListener('click', () => setMode('teacher'));
    toolbar.querySelector('#advanced-mode-button').addEventListener('click', () => setMode('advanced'));
    stepper.querySelector('#teacher-back-button').addEventListener('click', () => showStep(step - 1));
    stepper.querySelector('#teacher-next-button').addEventListener('click', () => {
      if (step === 5) { showStep(1); return; }
      if (step === 2) {
        const name = document.getElementById('input-winner-name').value.trim();
        const item = document.getElementById('input-item-name').value.trim();
        const placeholders = ['YOUR NAME','നിങ്ങളുടെ പേര്','SCHOOL NAME','സ്കൂളിന്റെ പേര്'];
        if (!name || placeholders.includes(name)) {
          document.getElementById('input-winner-name').focus();
          document.getElementById('input-winner-name').setCustomValidity('Please enter the winner name / വിജയിയുടെ പേര് നൽകുക.');
          document.getElementById('input-winner-name').reportValidity();
          return;
        }
        document.getElementById('input-winner-name').setCustomValidity('');
        if (!item) {
          document.getElementById('input-item-name').focus();
          document.getElementById('input-item-name').setCustomValidity('Please enter the competition item / മത്സര ഇനം നൽകുക.');
          document.getElementById('input-item-name').reportValidity();
          return;
        }
        document.getElementById('input-item-name').setCustomValidity('');
      }
      showStep(step + 1);
    });
    stepDots.forEach(dot => dot.addEventListener('click', () => {
      const targetStep = Number(dot.dataset.step);
      if (targetStep <= step) showStep(targetStep);
    }));
    summary.querySelector('#teacher-review-button').addEventListener('click', () => {
      if (isMobile()) canvasWrapper?.click();
      else previewPanel?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    summary.querySelector('#teacher-summary-download').addEventListener('click', () => downloadButton?.click());
    summary.querySelector('#teacher-new-poster').addEventListener('click', () => {
      const confirmed = window.confirm('Start another poster? The current winner details and photo will be cleared. School and event settings will be kept. / മറ്റൊരു പോസ്റ്റർ തുടങ്ങണോ?');
      if (!confirmed) return;
      const name = document.getElementById('input-winner-name');
      const item = document.getElementById('input-item-name');
      name.value = ''; item.value = '';
      const appState = window.posterStudio?.getState();
      if (appState) { appState.winnerName = ''; appState.itemName = ''; appState.photo.img = null; appState.photo.loaded = false; window.posterStudio.resetPhotoToSample(); }
      const file = document.getElementById('file-photo-input');
      if (file) file.value = '';
      const firstPlace = document.querySelector('[data-achievement="1st Place"]');
      if (firstPlace && !firstPlace.classList.contains('pill-active-gold')) firstPlace.click();
      const noGrade = document.querySelector('[data-grade=""]');
      if (noGrade && !noGrade.classList.contains('pill-active-cyan')) noGrade.click();
      name.dispatchEvent(new Event('input',{bubbles:true}));
      item.dispatchEvent(new Event('input',{bubbles:true}));
      window.posterStudio?.render();
      showStep(1);
    });

    // Keep a short-lived, text-only draft for this tab. Photos are never stored.
    const draftFields = ['input-winner-name','input-congrats-text','input-school-name','select-subdistrict','select-category','input-item-name'];
    const saveDraft = () => {
      const draft = {};
      draftFields.forEach(id => { const el=document.getElementById(id); if (el) draft[id]=el.value; });
      try { sessionStorage.setItem('kalolsavam-text-draft', JSON.stringify(draft)); } catch (_) {}
    };
    try {
      const draft = JSON.parse(sessionStorage.getItem('kalolsavam-text-draft') || 'null');
      if (draft) {
        draftFields.forEach(id => {
          const el=document.getElementById(id);
          if (el && typeof draft[id] === 'string') {
            el.value=draft[id];
            el.dispatchEvent(new Event('input',{bubbles:true}));
            el.dispatchEvent(new Event('change',{bubbles:true}));
          }
        });
        window.posterStudio?.render();
      }
    } catch (_) {}
    draftFields.forEach(id => {
      const el=document.getElementById(id);
      el?.addEventListener('input',saveDraft);
      el?.addEventListener('change',saveDraft);
    });

    toolbar.querySelector('#teacher-text-size').addEventListener('change', event => {
      document.documentElement.classList.remove('accessibility-large','accessibility-xlarge');
      if (event.target.value === 'large') document.documentElement.classList.add('accessibility-large');
      if (event.target.value === 'xlarge') document.documentElement.classList.add('accessibility-xlarge');
      try { localStorage.setItem('kalolsavam-text-size',event.target.value); } catch (_) {}
    });
    toolbar.querySelector('#teacher-contrast-button').addEventListener('click', event => {
      const active = document.documentElement.classList.toggle('high-contrast-mode');
      event.currentTarget.setAttribute('aria-pressed',String(active));
      event.currentTarget.classList.toggle('is-active',active);
      try { localStorage.setItem('kalolsavam-high-contrast',String(active)); } catch (_) {}
    });

    try {
      const savedMode = localStorage.getItem('kalolsavam-editor-mode');
      setMode(savedMode === 'advanced' ? 'advanced' : 'teacher');
      const size = localStorage.getItem('kalolsavam-text-size') || 'normal';
      toolbar.querySelector('#teacher-text-size').value = ['normal','large','xlarge'].includes(size) ? size : 'normal';
      toolbar.querySelector('#teacher-text-size').dispatchEvent(new Event('change'));
      if (localStorage.getItem('kalolsavam-high-contrast') === 'true') toolbar.querySelector('#teacher-contrast-button').click();
    } catch (_) { setMode('teacher'); }

    // Better keyboard semantics and touch labels for existing upload/preview controls.
    if (dropZone) {
      dropZone.setAttribute('role','group');
      dropZone.setAttribute('aria-label','Upload or replace the winner photograph');
    }
    document.getElementById('btn-share-trigger')?.setAttribute('aria-label','Copy poster to clipboard');
    canvasWrapper?.setAttribute('aria-describedby','teacher-step-description');
    langButtons.forEach(button => button.setAttribute('aria-label',button.dataset.lang === 'ml' ? 'Set poster language to Malayalam' : 'Set poster language to English'));

    showStep(step, false);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
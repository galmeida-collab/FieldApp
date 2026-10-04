import { MINISTRY } from './config.js';
import { esc } from './ui.js';

export function initPillarDropdowns() {
  const pillarSelect = document.getElementById('pillarSelect');
  const strataSelect = document.getElementById('strataSelect');
  const locInput = document.getElementById('locationInput');
  const venueInput = document.getElementById('venueInput');

  if (!pillarSelect || !strataSelect) return;

  pillarSelect.innerHTML = Object.keys(MINISTRY).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  
  function updateFields() {
    const p = pillarSelect.value;
    const cfg = MINISTRY[p] || { strata: [], loc: '', venue: '' };
    strataSelect.innerHTML = cfg.strata.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    if (locInput) locInput.placeholder = cfg.loc;
    if (venueInput) venueInput.placeholder = cfg.venue;
  }

  pillarSelect.addEventListener('change', updateFields);
  updateFields();
}
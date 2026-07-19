/* ================================================
   SCALA 40 ESPLOSIVA – app.js
   Logica completa: giocatori, partita, storico, musica
   ================================================ */

'use strict';

// ────────────────────────────────────────────────
// STATO GLOBALE
// ────────────────────────────────────────────────
const STATE = {
  players: [],          // { id, name, wins, games, totalPoints }
  game: null,           // partita corrente
  history: [],          // storico partite
  playlists: [],        // playlist musicali
  musicOpen: false,
};

// ────────────────────────────────────────────────
// PERSISTENZA (localStorage)
// ────────────────────────────────────────────────
function saveState() {
  localStorage.setItem('s40_players',   JSON.stringify(STATE.players));
  localStorage.setItem('s40_history',   JSON.stringify(STATE.history));
  localStorage.setItem('s40_playlists', JSON.stringify(STATE.playlists));
}

function loadState() {
  try {
    STATE.players   = JSON.parse(localStorage.getItem('s40_players'))   || [];
    STATE.history   = JSON.parse(localStorage.getItem('s40_history'))   || [];
    STATE.playlists = JSON.parse(localStorage.getItem('s40_playlists')) || [];
  } catch (e) {
    STATE.players = []; STATE.history = []; STATE.playlists = [];
  }

  // Se non ci sono playlist, aggiungiamo alcune di default
  if (STATE.playlists.length === 0) {
    STATE.playlists = [
      { id: uid(), name: 'Lo-Fi Chill Beats', url: 'https://www.youtube.com/playlist?list=PLofht4PTcKYnaH8w5olJCI_FEOtNVPBiP' },
      { id: uid(), name: 'Jazz & Carte 🎷', url: 'https://www.youtube.com/playlist?list=PLAjPEp7QKGOKJIOmBa94JA9PUzNFHIpMr' },
      { id: uid(), name: 'House da Gioco 🔥', url: 'https://www.youtube.com/results?search_query=house+music+playlist' },
      { id: uid(), name: 'Musica Italiana 🇮🇹', url: 'https://www.youtube.com/results?search_query=musica+italiana+mix+2024' },
    ];
    saveState();
  }
}

// ────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function initials(name) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

// ────────────────────────────────────────────────
// TOAST NOTIFICATION
// ────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: '💡', gold: '🏆' };
  el.innerHTML = `<span>${icons[type] || '💡'}</span> <span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, duration);
}

// ────────────────────────────────────────────────
// MODAL
// ────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Chiudi modal cliccando backdrop
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });
});

// ────────────────────────────────────────────────
// VIEWS NAVIGATION
// ────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById('view-' + name);
  if (view) { view.classList.add('active'); view.classList.remove('fade-in'); void view.offsetWidth; view.classList.add('fade-in'); }

  const btn = document.getElementById('nav-' + name);
  if (btn) btn.classList.add('active');

  if (name === 'storico') renderStorico();
  if (name === 'giocatori') renderGiocatori();
}

// ────────────────────────────────────────────────
// GESTIONE GIOCATORI
// ────────────────────────────────────────────────
function addPlayer(nameOverride) {
  const input = document.getElementById('new-player-name');
  const name = (nameOverride || input?.value || '').trim();
  if (!name) { toast('Inserisci un nome!', 'error'); return; }
  if (STATE.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast('Giocatore già esistente!', 'error'); return;
  }
  const player = { id: uid(), name, wins: 0, games: 0, totalPoints: 0 };
  STATE.players.push(player);
  saveState();
  if (input) input.value = '';
  toast(`${name} aggiunto! 👤`, 'success');
  renderGiocatori();
  renderRoster();
}

function quickAddPlayer() {
  const input = document.getElementById('quick-player-input');
  const name = input.value.trim();
  if (!name) { toast('Inserisci un nome!', 'error'); return; }
  if (STATE.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    toast('Giocatore già esistente!', 'error'); return;
  }
  const player = { id: uid(), name, wins: 0, games: 0, totalPoints: 0 };
  STATE.players.push(player);
  saveState();
  input.value = '';
  toast(`${name} aggiunto! 👤`, 'success');
  renderRoster();
  renderGiocatori();
}

function removePlayer(id) {
  const player = STATE.players.find(p => p.id === id);
  if (!player) return;
  if (!confirm(`Rimuovere ${player.name}? Le sue statistiche verranno eliminate.`)) return;
  STATE.players = STATE.players.filter(p => p.id !== id);
  saveState();
  toast('Giocatore rimosso', 'info');
  renderGiocatori();
  renderRoster();
}

// ────────────────────────────────────────────────
// RENDER: ROSTER (home setup)
// ────────────────────────────────────────────────
function renderRoster() {
  const roster = document.getElementById('player-roster');
  const badge = document.getElementById('selected-count-badge');

  if (STATE.players.length === 0) {
    roster.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <div class="empty-title">Nessun giocatore</div>
        <div class="empty-sub">Aggiungine uno sopra o vai nella sezione Giocatori</div>
      </div>`;
    updateStartBtn();
    return;
  }

  roster.innerHTML = STATE.players.map(p => {
    const selected = STATE.game?.selectedIds?.includes(p.id) ?? false;
    return `
    <div class="player-item ${selected ? 'selected' : ''}" onclick="togglePlayerSelection('${p.id}')" id="roster-${p.id}">
      <div class="player-avatar">${initials(p.name)}</div>
      <span class="player-name-text">${escHtml(p.name)}</span>
      <span class="player-select-badge">${selected ? '✔ In partita' : 'Clicca per selezionare'}</span>
      <button class="player-remove" onclick="event.stopPropagation();removePlayer('${p.id}')" title="Rimuovi">✕</button>
    </div>`;
  }).join('');

  const count = getSelectedIds().length;
  badge.textContent = count + ' selezionati';
  badge.className = 'badge ' + (count >= 2 ? 'badge-gold' : 'badge-purple');

  updateStartBtn();
}

// Selezione temporanea nella home (usiamo un Set locale)
const _selectedSet = new Set();

function togglePlayerSelection(id) {
  if (_selectedSet.has(id)) _selectedSet.delete(id);
  else _selectedSet.add(id);
  renderRoster();
}

function getSelectedIds() {
  return [..._selectedSet].filter(id => STATE.players.some(p => p.id === id));
}

function updateStartBtn() {
  const btn = document.getElementById('start-game-btn');
  if (btn) btn.disabled = getSelectedIds().length < 2;
}

// ────────────────────────────────────────────────
// RENDER: GIOCATORI (view)
// ────────────────────────────────────────────────
function renderGiocatori() {
  const grid = document.getElementById('players-grid');
  if (!grid) return;

  if (STATE.players.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">👥</div>
        <div class="empty-title">Nessun giocatore registrato</div>
        <div class="empty-sub">Aggiungine uno tramite il form qui sopra</div>
      </div>`;
    return;
  }

  // Ordina per vittorie desc
  const sorted = [...STATE.players].sort((a, b) => b.wins - a.wins);

  grid.innerHTML = sorted.map(p => {
    const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0;
    const avg = p.games > 0 ? Math.round(p.totalPoints / p.games) : 0;
    return `
    <div class="player-card fade-in">
      <button class="player-card-delete" onclick="removePlayer('${p.id}')" title="Elimina">✕</button>
      <div class="player-card-avatar">${initials(p.name)}</div>
      <div class="player-card-name">${escHtml(p.name)}</div>
      <div class="player-card-stats">
        <div class="pc-stat">
          <div class="pc-stat-val" style="color:var(--gold-400)">${p.wins}</div>
          <div class="pc-stat-label">Vittorie</div>
        </div>
        <div class="pc-stat">
          <div class="pc-stat-val">${p.games}</div>
          <div class="pc-stat-label">Partite</div>
        </div>
        <div class="pc-stat">
          <div class="pc-stat-val" style="color:var(--green-400)">${winRate}%</div>
          <div class="pc-stat-label">Win rate</div>
        </div>
      </div>
      <div class="lb-winrate">Punti medi: ${avg} / partita</div>
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────
// GAME – START
// ────────────────────────────────────────────────
function startGame() {
  const selectedIds = getSelectedIds();
  if (selectedIds.length < 2) { toast('Seleziona almeno 2 giocatori!', 'error'); return; }

  const limit = parseInt(document.getElementById('score-limit').value) || 100;
  const aceVal = parseInt(document.getElementById('ace-value').value) || 11;

  STATE.game = {
    id: uid(),
    startedAt: new Date().toISOString(),
    scoreLimit: limit,
    aceValue: aceVal,
    selectedIds: selectedIds,
    // Per ogni giocatore: { id, scores:[], total, eliminated }
    players: selectedIds.map(id => {
      const p = STATE.players.find(pl => pl.id === id);
      return { id, name: p.name, scores: [], total: 0, eliminated: false };
    }),
    round: 1,
    rounds: [],  // storico mani
    finished: false,
  };

  showGamePanel();
}

function showGamePanel() {
  document.getElementById('setup-panel').style.display = 'none';
  document.getElementById('game-panel').style.display = 'block';
  renderGameTable();
  renderRoundInputs();
  updateStatusBar();
}

function backToSetup() {
  document.getElementById('setup-panel').style.display = 'block';
  document.getElementById('game-panel').style.display = 'none';
  STATE.game = null;
  _selectedSet.clear();
  renderRoster();
}

// ────────────────────────────────────────────────
// GAME – RENDER TABLE
// ────────────────────────────────────────────────
function renderGameTable() {
  if (!STATE.game) return;
  const g = STATE.game;
  const tbody = document.getElementById('score-tbody');
  const header = document.getElementById('rounds-header');

  // Aggiorna header colonne mani
  const rounds = g.round - 1;
  let headerCols = '<th>Pos.</th><th>Giocatore</th><th>Totale</th>';
  for (let r = 1; r <= rounds; r++) headerCols += `<th>M${r}</th>`;
  headerCols += `<th>Mano ${g.round}</th>`;
  document.querySelector('#score-table thead tr').innerHTML = headerCols;

  // Ordina per totale asc (chi ha meno punti è in testa)
  const sorted = [...g.players].sort((a, b) => {
    if (a.eliminated && !b.eliminated) return 1;
    if (!a.eliminated && b.eliminated) return -1;
    return a.total - b.total;
  });

  tbody.innerHTML = sorted.map((p, idx) => {
    const pos = idx + 1;
    const scoreClass = p.total >= g.scoreLimit ? 'danger' : p.total >= g.scoreLimit * 0.75 ? 'warning' : 'safe';
    const badge = p.eliminated
      ? '<span class="eliminated-chip">❌ Eliminato</span>'
      : (pos === 1 ? '<span class="winner-chip">🥇 1°</span>' : '');

    const roundCells = p.scores.map(s => `<td style="text-align:center;color:var(--text-secondary)">${s}</td>`).join('');
    const emptyRounds = g.round - 1 - p.scores.length;
    const emptyCells = Array(Math.max(0, emptyRounds)).fill('<td style="text-align:center;color:var(--text-muted)">—</td>').join('');

    return `
    <tr class="${p.eliminated ? 'eliminated' : ''}">
      <td style="font-family:'Cinzel',serif;font-weight:700;color:var(--text-muted);padding-left:20px">${pos}</td>
      <td>
        <div class="player-col">
          <div class="mini-avatar">${initials(p.name)}</div>
          <div>
            <div style="font-weight:600">${escHtml(p.name)}</div>
            <div style="margin-top:3px">${badge}</div>
          </div>
        </div>
      </td>
      <td><span class="score-total ${scoreClass}">${p.total}</span></td>
      ${roundCells}${emptyCells}
      <td class="score-input-cell">—</td>
    </tr>`;
  }).join('');
}

// ────────────────────────────────────────────────
// GAME – ROUND INPUTS
// ────────────────────────────────────────────────
function renderRoundInputs() {
  if (!STATE.game) return;
  const g = STATE.game;
  const container = document.getElementById('round-inputs');
  const label = document.getElementById('round-input-label');
  label.textContent = `Mano ${g.round}`;

  const activePlayers = g.players.filter(p => !p.eliminated);

  container.innerHTML = activePlayers.map(p => `
    <div class="round-input-group">
      <label class="round-input-label">
        <div class="mini-avatar" style="width:22px;height:22px;font-size:0.6rem">${initials(p.name)}</div>
        ${escHtml(p.name)}
      </label>
      <input type="number" class="score-cell-input" id="input-${p.id}"
        placeholder="0" min="0" max="200" inputmode="numeric"
        onkeydown="if(event.key==='Enter')submitRound()" />
    </div>
  `).join('');
}

function clearRoundInputs() {
  if (!STATE.game) return;
  STATE.game.players.forEach(p => {
    const inp = document.getElementById('input-' + p.id);
    if (inp) inp.value = '';
  });
}

// ────────────────────────────────────────────────
// GAME – SUBMIT ROUND
// ────────────────────────────────────────────────
function submitRound() {
  if (!STATE.game) return;
  const g = STATE.game;
  const activePlayers = g.players.filter(p => !p.eliminated);

  // Raccolta punteggi
  const roundData = {};
  for (const p of activePlayers) {
    const inp = document.getElementById('input-' + p.id);
    const val = inp ? inp.value.trim() : '';
    if (val === '') { toast(`Inserisci il punteggio per ${p.name}!`, 'error'); inp?.focus(); return; }
    const num = parseInt(val);
    if (isNaN(num) || num < 0) { toast(`Punteggio non valido per ${p.name}!`, 'error'); inp?.focus(); return; }
    roundData[p.id] = num;
  }

  // Applica punteggi
  const roundEntry = { round: g.round, scores: {} };
  for (const p of g.players) {
    const pts = roundData[p.id] ?? null;
    if (pts !== null) {
      p.scores.push(pts);
      p.total += pts;
      roundEntry.scores[p.id] = pts;
      if (p.total >= g.scoreLimit) {
        p.eliminated = true;
        toast(`${p.name} è stato eliminato! 💥`, 'error', 4000);
      }
    } else {
      p.scores.push('—'); // era già eliminato
    }
  }

  g.rounds.push(roundEntry);
  g.round++;

  clearRoundInputs();
  renderGameTable();
  renderRoundInputs();
  updateStatusBar();
  checkWinner();
}

// ────────────────────────────────────────────────
// GAME – CHECK WINNER
// ────────────────────────────────────────────────
function checkWinner() {
  if (!STATE.game) return;
  const g = STATE.game;
  const active = g.players.filter(p => !p.eliminated);

  if (active.length <= 1) {
    // Partita finita!
    const winner = active.length === 1 ? active[0] : g.players.reduce((a, b) => a.total < b.total ? a : b);
    showWinnerModal(winner);
  }
}

function showWinnerModal(winner) {
  document.getElementById('winner-name').textContent = winner.name;
  document.getElementById('winner-score-sub').textContent = `Ha vinto con soli ${winner.total} punti! 🎉`;

  const g = STATE.game;
  const sorted = [...g.players].sort((a, b) => a.total - b.total);
  document.getElementById('winner-scores-list').innerHTML = sorted.map((p, i) => {
    const medals = ['🥇', '🥈', '🥉'];
    const scoreClass = p.total >= g.scoreLimit ? 'danger' : '';
    return `
    <div class="ws-item">
      <div class="ws-item-name">${medals[i] || `${i+1}.`} ${escHtml(p.name)}</div>
      <div class="ws-item-score ${scoreClass}">${p.total} pt</div>
    </div>`;
  }).join('');

  launchConfetti();
  openModal('winner-modal');
}

function saveGameAndReset() {
  saveFinishedGame();
  backToSetup();
}

function saveFinishedGame() {
  if (!STATE.game) return;
  const g = STATE.game;
  const active = g.players.filter(p => !p.eliminated);
  const winner = active.length === 1 ? active[0] : g.players.reduce((a, b) => a.total < b.total ? a : b);

  // Aggiorna statistiche giocatori
  g.players.forEach(p => {
    const pl = STATE.players.find(pl => pl.id === p.id);
    if (!pl) return;
    pl.games++;
    pl.totalPoints += p.total;
    if (p.id === winner.id) pl.wins++;
  });

  // Salva nello storico
  STATE.history.unshift({
    id: g.id,
    date: new Date().toISOString(),
    winner: winner.name,
    winnerId: winner.id,
    rounds: g.round - 1,
    players: g.players.map(p => ({ id: p.id, name: p.name, total: p.total })),
  });

  saveState();
  toast(`Partita salvata! 🏆 Vince ${winner.name}`, 'gold', 5000);
}

// ────────────────────────────────────────────────
// GAME – UNDO LAST ROUND
// ────────────────────────────────────────────────
function undoLastRound() {
  if (!STATE.game || STATE.game.round <= 1) { toast('Nessuna mano da annullare!', 'error'); return; }
  const g = STATE.game;
  const lastRound = g.rounds.pop();

  g.players.forEach(p => {
    const pts = lastRound.scores[p.id];
    if (typeof pts === 'number') {
      p.scores.pop();
      p.total -= pts;
      p.eliminated = p.total >= g.scoreLimit;
    } else {
      // era eliminato, rimuovi il '—'
      if (p.scores[p.scores.length - 1] === '—') p.scores.pop();
    }
  });

  g.round--;
  renderGameTable();
  renderRoundInputs();
  updateStatusBar();
  toast('Ultima mano annullata ↩', 'info');
}

// ────────────────────────────────────────────────
// GAME – FORCE END
// ────────────────────────────────────────────────
function confirmEndGame() { openModal('end-game-modal'); }

function forceEndGame() {
  closeModal('end-game-modal');
  if (!STATE.game) return;
  const g = STATE.game;
  const activeSorted = [...g.players].sort((a, b) => a.total - b.total);
  const winner = activeSorted[0];
  showWinnerModal(winner);
}

// ────────────────────────────────────────────────
// STATUS BAR
// ────────────────────────────────────────────────
function updateStatusBar() {
  if (!STATE.game) return;
  const g = STATE.game;
  const active = g.players.filter(p => !p.eliminated);
  const leader = [...g.players].sort((a, b) => a.total - b.total)[0];

  document.getElementById('round-display').textContent = g.round;
  document.getElementById('active-players-display').textContent = active.length;
  document.getElementById('limit-display').textContent = g.scoreLimit;
  document.getElementById('leader-display').textContent = leader ? leader.name : '-';
}

// ────────────────────────────────────────────────
// STORICO
// ────────────────────────────────────────────────
function renderStorico() {
  renderLeaderboard();
  renderHistory();
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  if (STATE.players.length === 0 || STATE.players.every(p => p.games === 0)) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🏆</div>
        <div class="empty-title">Nessuna partita ancora</div>
        <div class="empty-sub">Gioca la prima partita per vedere la classifica!</div>
      </div>`;
    return;
  }

  const sorted = [...STATE.players]
    .filter(p => p.games > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const awr = a.games > 0 ? a.wins / a.games : 0;
      const bwr = b.games > 0 ? b.wins / b.games : 0;
      return bwr - awr;
    });

  const rankLabels = ['gold', 'silver', 'bronze'];
  const rankIcons  = ['🥇', '🥈', '🥉'];

  container.innerHTML = sorted.map((p, i) => {
    const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0;
    const avg = p.games > 0 ? Math.round(p.totalPoints / p.games) : 0;
    const rank = rankLabels[i] || '';
    const icon = rankIcons[i] || `#${i+1}`;
    return `
    <div class="leaderboard-card fade-in">
      <div class="lb-rank ${rank}">${icon}</div>
      <div class="lb-avatar ${i === 0 ? 'rank-1' : ''}">${initials(p.name)}</div>
      <div class="lb-name">${escHtml(p.name)}</div>
      <div class="lb-stats">
        <div class="lb-stat">
          <div class="lb-stat-val gold-val">${p.wins}</div>
          <div class="lb-stat-label">Vittorie</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val">${p.games}</div>
          <div class="lb-stat-label">Partite</div>
        </div>
        <div class="lb-stat">
          <div class="lb-stat-val" style="color:var(--green-400)">${winRate}%</div>
          <div class="lb-stat-label">Win rate</div>
        </div>
      </div>
      <div class="lb-winrate">Media: ${avg} punti/partita</div>
    </div>`;
  }).join('');
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;

  if (STATE.history.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">Nessuna partita nel registro</div>
        <div class="empty-sub">Le partite completate appariranno qui</div>
      </div>`;
    return;
  }

  list.innerHTML = STATE.history.slice(0, 50).map(h => {
    const playerNames = h.players.map(p => p.name).join(', ');
    const winnerEntry = h.players.find(p => p.id === h.winnerId);
    const winnerScore = winnerEntry ? winnerEntry.total : '—';
    return `
    <div class="history-item fade-in">
      <div class="history-date">📅 ${formatDate(h.date)}</div>
      <div class="history-winner">🏆 ${escHtml(h.winner)} <span style="color:var(--text-muted);font-size:0.78rem;font-weight:400">(${winnerScore} pt)</span></div>
      <div class="history-players" title="${escHtml(playerNames)}">
        ${h.players.slice(0,3).map(p => escHtml(p.name)).join(', ')}${h.players.length > 3 ? ' +altri' : ''}
      </div>
      <div class="history-rounds">🃏 ${h.rounds} mani</div>
    </div>`;
  }).join('');
}

function confirmClearHistory() { openModal('clear-history-modal'); }

function clearHistory() {
  STATE.history = [];
  STATE.players.forEach(p => { p.wins = 0; p.games = 0; p.totalPoints = 0; });
  saveState();
  closeModal('clear-history-modal');
  toast('Storico azzerato', 'info');
  renderStorico();
  renderGiocatori();
}

// ────────────────────────────────────────────────
// MUSICA
// ────────────────────────────────────────────────
function toggleMusic() {
  STATE.musicOpen = !STATE.musicOpen;
  const sidebar = document.getElementById('music-sidebar');
  const btn = document.getElementById('nav-music');
  sidebar.classList.toggle('open', STATE.musicOpen);
  btn.classList.toggle('active', STATE.musicOpen);
  renderPlaylists();
}

function renderPlaylists() {
  const list = document.getElementById('playlist-list');
  if (!list) return;

  if (STATE.playlists.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:24px 12px">
        <div class="empty-icon">🎵</div>
        <div class="empty-title">Nessuna playlist</div>
        <div class="empty-sub">Aggiungine una qui sotto</div>
      </div>`;
    return;
  }

  list.innerHTML = STATE.playlists.map(pl => `
    <a class="playlist-item" href="${escHtml(pl.url)}" target="_blank" rel="noopener noreferrer">
      <div class="playlist-icon">▶</div>
      <div class="playlist-info">
        <div class="playlist-name">${escHtml(pl.name)}</div>
        <div class="playlist-desc">Apri su YouTube →</div>
      </div>
      <button class="playlist-item-delete" onclick="event.preventDefault();event.stopPropagation();deletePlaylist('${pl.id}')" title="Rimuovi">✕</button>
    </a>
  `).join('');
}

function addPlaylist() {
  const name = document.getElementById('playlist-name-input').value.trim();
  const url  = document.getElementById('playlist-url-input').value.trim();

  if (!name) { toast('Inserisci un nome per la playlist!', 'error'); return; }
  if (!url || !url.startsWith('http')) { toast('URL non valido!', 'error'); return; }

  STATE.playlists.push({ id: uid(), name, url });
  saveState();
  document.getElementById('playlist-name-input').value = '';
  document.getElementById('playlist-url-input').value  = '';
  renderPlaylists();
  toast(`"${name}" aggiunta! 🎵`, 'gold');
}

function deletePlaylist(id) {
  STATE.playlists = STATE.playlists.filter(pl => pl.id !== id);
  saveState();
  renderPlaylists();
}

// ────────────────────────────────────────────────
// CALCOLATORE PUNTI
// ────────────────────────────────────────────────
function calcPoints() { openModal('calc-modal'); updateCalc(); }

function updateCalc() {
  const aces   = parseInt(document.getElementById('calc-aces').value)   || 0;
  const faces  = parseInt(document.getElementById('calc-faces').value)  || 0;
  const tens   = parseInt(document.getElementById('calc-tens').value)   || 0;
  const others = parseInt(document.getElementById('calc-others').value) || 0;
  const aceVal = STATE.game ? STATE.game.aceValue : 11;
  const total  = aces * aceVal + faces * 10 + tens * 10 + others;
  document.getElementById('calc-total').textContent = total;
}

['calc-aces','calc-faces','calc-tens','calc-others'].forEach(id => {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalc);
  });
});

// ────────────────────────────────────────────────
// CONFETTI
// ────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#a855f7','#fbbf24','#4ade80','#f87171','#60a5fa','#c084fc'];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));

  let frame = 0;
  const max = 180;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.angle += p.spin; p.vy += 0.05;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / max);
      if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
    frame++;
    if (frame < max) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ────────────────────────────────────────────────
// SICUREZZA: escape HTML
// ────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ────────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    if (STATE.musicOpen) toggleMusic();
  }
});

// Quick add player con Enter
document.addEventListener('DOMContentLoaded', () => {
  const qi = document.getElementById('quick-player-input');
  if (qi) qi.addEventListener('keydown', e => { if (e.key === 'Enter') quickAddPlayer(); });

  const ni = document.getElementById('new-player-name');
  if (ni) ni.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });

  // Bind calc inputs
  ['calc-aces','calc-faces','calc-tens','calc-others'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalc);
  });

  // Init
  loadState();
  renderRoster();
  updateStartBtn();
});

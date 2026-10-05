(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* local storage is optional */ } },
    remove(key) { try { localStorage.removeItem(key); } catch { /* local storage is optional */ } }
  };
  const session = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* session storage is optional */ } },
    remove(key) { try { sessionStorage.removeItem(key); } catch { /* session storage is optional */ } }
  };

  const header = $('.header');
  const progress = $('#progressBar');
  const cursorGlow = $('#cursorGlow');
  const menuButton = $('#menuButton');
  const menu = $('#menu');
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function updateScrollUI() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progress.style.width = `${Math.min(100, percentage)}%`;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  if (window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('pointermove', (event) => {
      cursorGlow.style.opacity = '1';
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    });
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menuButton.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  $$('.nav a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

  const nightButton = $('#nightButton');
  const savedNightMode = storage.get('london-love-night') === 'true';
  function applyNightMode(active, announce = false) {
    document.body.classList.toggle('night', active);
    nightButton.textContent = active ? '☀' : '☾';
    nightButton.setAttribute('aria-label', active ? 'Ativar modo diurno' : 'Ativar modo noturno');
    storage.set('london-love-night', active);
    if (announce) showToast(active ? 'Londres ao luar ativada. ✦' : 'O sol voltou a Londres. ☀');
  }
  applyNightMode(savedNightMode);
  nightButton.addEventListener('click', () => applyNightMode(!document.body.classList.contains('night'), true));

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 }) : null;
  $$('.reveal').forEach((element) => revealObserver ? revealObserver.observe(element) : element.classList.add('in-view'));

  const modal = $('#loveModal');
  const modalTitle = $('#modalTitle');
  const modalMessage = $('#modalMessage');
  const closeModal = $('#closeModal');
  let lastTrigger = null;
  function openModal(title, message, trigger) {
    lastTrigger = trigger || document.activeElement;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    closeModal.focus();
  }
  function dismissModal() {
    if (modal.open) modal.close();
    else modal.removeAttribute('open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }
  $$('.note').forEach((note) => note.addEventListener('click', () => openModal(note.dataset.title, note.dataset.note, note)));
  closeModal.addEventListener('click', dismissModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) dismissModal(); });
  modal.addEventListener('cancel', (event) => { event.preventDefault(); dismissModal(); });

  $('#showLondonButton').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const open = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!open));
    $('#londonMap').classList.toggle('map-awake', !open);
    button.firstChild.textContent = open ? 'acender nosso mapa ' : 'nosso mapa está aceso ';
    showToast(open ? 'O mapa guardou nossos sentimentos outra vez.' : 'Cada ponto guarda uma parte do que sinto por você.');
  });

  const countdownElement = $('#countdown');
  const returnDate = new Date(countdownElement.dataset.returnDate).getTime();
  const countdownParts = { days: $('#days'), hours: $('#hours'), minutes: $('#minutes'), seconds: $('#seconds') };
  const countdownNote = $('#countdownNote');
  function renderCountdown() {
    const remaining = Math.max(0, returnDate - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining / 3600000) % 24);
    const minutes = Math.floor((remaining / 60000) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    countdownParts.days.textContent = String(days).padStart(2, '0');
    countdownParts.hours.textContent = String(hours).padStart(2, '0');
    countdownParts.minutes.textContent = String(minutes).padStart(2, '0');
    countdownParts.seconds.textContent = String(seconds).padStart(2, '0');
    if (remaining === 0) countdownNote.textContent = 'O Big Ben já marcou a hora do abraço mais esperado. ♥';
  }
  renderCountdown();
  window.setInterval(renderCountdown, 1000);

  $('#promiseButton').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const stamped = button.dataset.stamped === 'true';
    button.dataset.stamped = String(!stamped);
    button.innerHTML = stamped ? 'carimbar nossa promessa <b>♥</b>' : 'promessa carimbada <b>♥</b>';
    button.classList.toggle('is-stamped', !stamped);
    showToast(stamped ? 'A promessa continua aqui, esperando você.' : 'Promessa carimbada com todo o meu amor. ♥');
    if (!stamped) createHearts(12, button.getBoundingClientRect().left + button.offsetWidth / 2);
  });

  function createHearts(amount = 18, originX) {
    for (let index = 0; index < amount; index += 1) {
      const heart = document.createElement('span');
      heart.className = 'hearts-particle';
      heart.textContent = index % 3 === 0 ? '✦' : '♥';
      heart.style.left = `${originX ?? Math.random() * window.innerWidth}px`;
      heart.style.color = index % 2 ? '#d82a45' : '#f1c76d';
      heart.style.fontSize = `${12 + Math.random() * 18}px`;
      heart.style.setProperty('--x', `${(Math.random() - 0.5) * 210}px`);
      document.body.appendChild(heart);
      window.setTimeout(() => heart.remove(), 2000);
    }
  }
  $('#heartButton').addEventListener('click', (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    createHearts(22, bounds.left + bounds.width / 2);
    showToast('Um pouco de amor acabou de atravessar o Atlântico. ♥');
  });

  /*
   * Spotify Web Playback SDK
   * The Client ID can be public in a browser application. Tokens are obtained
   * using PKCE and stay in sessionStorage only; there is no Client Secret here.
   */
  const soundtrackButton = $('#soundtrackButton');
  const spotifyStatus = $('#spotifyStatus');
  const spotifyClientId = '04253b01c3c94cd397b8138f29d9b5e9';
  const spotifyRedirectUri = `${window.location.origin}${window.location.pathname.endsWith('/index.html')
    ? window.location.pathname.slice(0, -'index.html'.length)
    : window.location.pathname}`;
  const spotifyTrack = 'spotify:track:22dg08ZH3AWZGN1f059yy5';
  const spotifyScopes = ['streaming', 'user-read-email', 'user-read-private', 'user-modify-playback-state'];
  const spotifyKeys = {
    token: 'london-love-spotify-token',
    verifier: 'london-love-spotify-verifier',
    state: 'london-love-spotify-state'
  };
  let spotifyPlayer = null;
  let spotifyDeviceId = null;
  let spotifyIsPlaying = false;
  let spotifyWasPaused = false;
  let spotifyIsPreparing = false;
  let spotifyStartupPromise = null;

  function setSoundtrackLabel(label) {
    soundtrackButton.lastChild.textContent = ` ${label}`;
  }

  function setSpotifyStatus(message = '', state = '') {
    spotifyStatus.textContent = message;
    spotifyStatus.hidden = !message;
    if (state) spotifyStatus.dataset.state = state;
    else delete spotifyStatus.dataset.state;
  }

  function updateSoundtrackButton() {
    soundtrackButton.setAttribute('aria-pressed', String(spotifyIsPlaying));
    if (spotifyIsPreparing) {
      setSoundtrackLabel('preparando a trilha...');
      return;
    }
    if (spotifyIsPlaying) {
      setSoundtrackLabel('pausar a trilha da viagem');
    } else if (spotifyWasPaused) {
      setSoundtrackLabel('trilha pausada ♥');
    } else {
      setSoundtrackLabel('tocar a trilha da viagem');
    }
  }

  function getSpotifyToken() {
    try {
      const savedToken = storage.get(spotifyKeys.token);
      const temporaryToken = session.get(spotifyKeys.token);
      const token = JSON.parse(savedToken || temporaryToken || 'null');
      /* Migrate the authorization made before this update, without asking again. */
      if (!savedToken && token?.accessToken) {
        storage.set(spotifyKeys.token, JSON.stringify(token));
        session.remove(spotifyKeys.token);
      }
      return token && typeof token.accessToken === 'string' ? token : null;
    } catch {
      storage.remove(spotifyKeys.token);
      session.remove(spotifyKeys.token);
      return null;
    }
  }

  function saveSpotifyToken(payload, previous = {}) {
    const token = {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token || previous.refreshToken,
      expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000
    };
    storage.set(spotifyKeys.token, JSON.stringify(token));
    return token;
  }

  function randomString(length = 64) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return [...values].map((value) => characters[value % characters.length]).join('');
  }

  async function makeCodeChallenge(verifier) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  async function authorizeSpotify() {
    const verifier = randomString();
    const state = randomString(32);
    session.set(spotifyKeys.verifier, verifier);
    session.set(spotifyKeys.state, state);
    const authorizeUrl = new URL('https://accounts.spotify.com/authorize');
    authorizeUrl.search = new URLSearchParams({
      client_id: spotifyClientId,
      response_type: 'code',
      redirect_uri: spotifyRedirectUri,
      code_challenge_method: 'S256',
      code_challenge: await makeCodeChallenge(verifier),
      state,
      scope: spotifyScopes.join(' ')
    }).toString();
    setSpotifyStatus('Abrindo o login seguro do Spotify…');
    window.location.assign(authorizeUrl.toString());
  }

  async function getTokenFromSpotify(parameters) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(parameters)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || 'Não foi possível autorizar o Spotify.');
    }
    return payload;
  }

  async function completeSpotifyAuthorization() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const authorizationError = url.searchParams.get('error');
    if (!code && !authorizationError) return false;

    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

    if (authorizationError) throw new Error('A conexão com o Spotify foi cancelada.');
    const verifier = session.get(spotifyKeys.verifier);
    const expectedState = session.get(spotifyKeys.state);
    session.remove(spotifyKeys.verifier);
    session.remove(spotifyKeys.state);
    if (!verifier || !returnedState || returnedState !== expectedState) {
      throw new Error('Não foi possível confirmar a conexão com o Spotify. Tente outra vez.');
    }
    const payload = await getTokenFromSpotify({
      client_id: spotifyClientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: spotifyRedirectUri,
      code_verifier: verifier
    });
    saveSpotifyToken(payload);
    return true;
  }

  async function ensureSpotifyAccessToken() {
    const current = getSpotifyToken();
    if (current && current.expiresAt > Date.now() + 60000) return current.accessToken;
    if (!current?.refreshToken) return null;
    const payload = await getTokenFromSpotify({
      client_id: spotifyClientId,
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken
    });
    return saveSpotifyToken(payload, current).accessToken;
  }

  /* Persist any valid authorization already active before this page is refreshed. */
  getSpotifyToken();

  function loadSpotifySdk() {
    if (window.Spotify) return Promise.resolve();
    return new Promise((resolve, reject) => {
      window.onSpotifyWebPlaybackSDKReady = resolve;
      const sdk = document.createElement('script');
      sdk.src = 'https://sdk.scdn.co/spotify-player.js';
      sdk.async = true;
      sdk.addEventListener('error', () => reject(new Error('O player do Spotify não carregou.')));
      document.head.appendChild(sdk);
    });
  }

  async function spotifyApi(path, options = {}) {
    const accessToken = await ensureSpotifyAccessToken();
    if (!accessToken) throw new Error('Conecte sua conta Spotify para continuar.');
    const response = await fetch(`https://api.spotify.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!response.ok && response.status !== 204) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error?.message || 'O Spotify não conseguiu iniciar a música.');
    }
    return response;
  }

  async function prepareSpotifyPlayer() {
    if (spotifyPlayer && spotifyDeviceId) return spotifyPlayer;
    if (spotifyStartupPromise) return spotifyStartupPromise;
    spotifyStartupPromise = (async () => {
      await loadSpotifySdk();
      const player = new window.Spotify.Player({
        name: 'Trilha da nossa viagem para Londres',
        getOAuthToken: async (callback) => {
          try { callback(await ensureSpotifyAccessToken()); }
          catch { callback(''); }
        },
        volume: 0.7
      });
      player.addListener('ready', ({ device_id: deviceId }) => {
        spotifyPlayer = player;
        spotifyDeviceId = deviceId;
        spotifyIsPreparing = false;
        updateSoundtrackButton();
      });
      player.addListener('not_ready', () => {
        spotifyDeviceId = null;
        spotifyIsPlaying = false;
        spotifyWasPaused = false;
        updateSoundtrackButton();
      });
      player.addListener('player_state_changed', (state) => {
        if (!state) return;
        spotifyIsPlaying = !state.paused;
        updateSoundtrackButton();
      });
      player.addListener('initialization_error', ({ message }) => {
        const detail = `Spotify: ${message}`;
        showToast(detail);
        setSpotifyStatus(detail, 'error');
      });
      player.addListener('authentication_error', ({ message }) => {
        const detail = `Spotify: ${message}`;
        showToast(detail);
        setSpotifyStatus(detail, 'error');
      });
      player.addListener('account_error', () => {
        const detail = 'A reprodução completa requer uma conta Spotify Premium.';
        showToast(detail);
        setSpotifyStatus(detail, 'error');
      });
      player.addListener('playback_error', ({ message }) => {
        const detail = `Não foi possível tocar a trilha: ${message}`;
        showToast(detail);
        setSpotifyStatus(detail, 'error');
      });
      player.addListener('autoplay_failed', () => {
        const detail = 'O navegador bloqueou o áudio. Toque novamente no botão para iniciar a trilha.';
        showToast(detail);
        setSpotifyStatus(detail, 'error');
      });
      const connected = await player.connect();
      if (!connected) throw new Error('Não foi possível conectar o player do Spotify.');
      spotifyPlayer = player;
      await new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const waitForDevice = () => {
          if (spotifyDeviceId) resolve();
          else if (Date.now() - startedAt > 8000) reject(new Error('O Spotify demorou para preparar a trilha. Tente de novo.'));
          else window.setTimeout(waitForDevice, 100);
        };
        waitForDevice();
      });
      return player;
    })();
    try {
      return await spotifyStartupPromise;
    } finally {
      spotifyStartupPromise = null;
    }
  }

  async function startSpotifyTrack() {
    await spotifyApi('/v1/me/player', {
      method: 'PUT',
      body: JSON.stringify({ device_ids: [spotifyDeviceId], play: false })
    });
    await spotifyApi(`/v1/me/player/play?device_id=${encodeURIComponent(spotifyDeviceId)}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [spotifyTrack] })
    });
    spotifyIsPlaying = true;
    spotifyWasPaused = false;
    updateSoundtrackButton();
  }

  async function handleSoundtrackClick() {
    try {
      if (!await ensureSpotifyAccessToken()) {
        spotifyIsPreparing = true;
        updateSoundtrackButton();
        await authorizeSpotify();
        return;
      }
      spotifyIsPreparing = true;
      updateSoundtrackButton();
      await prepareSpotifyPlayer();
      spotifyIsPreparing = false;
      updateSoundtrackButton();
      if (spotifyIsPlaying) {
        await spotifyPlayer.pause();
        spotifyIsPlaying = false;
        spotifyWasPaused = true;
        updateSoundtrackButton();
        showToast('A trilha foi pausada.');
        setSpotifyStatus('Trilha pausada. Quando quiser, é só tocar novamente. ♥');
      } else {
        await startSpotifyTrack();
        showToast('A trilha completa começou a tocar. ♥');
        setSpotifyStatus('Tocando a versão completa no Spotify. ♥');
      }
    } catch (error) {
      spotifyIsPreparing = false;
      updateSoundtrackButton();
      showToast(error.message || 'Não foi possível conectar o Spotify.');
      setSpotifyStatus(error.message || 'Não foi possível conectar o Spotify.', 'error');
    }
  }

  soundtrackButton.addEventListener('click', () => {
    /* Must happen synchronously inside the click event or browsers may block audio. */
    if (spotifyPlayer) {
      spotifyPlayer.activateElement().catch(() => {
        setSpotifyStatus('O navegador não liberou o áudio. Tente tocar novamente.', 'error');
      });
    }
    void handleSoundtrackClick();
  });

  completeSpotifyAuthorization().then(async (connected) => {
    if (!connected) return;
    spotifyIsPreparing = true;
    updateSoundtrackButton();
    setSpotifyStatus('Conta conectada. Preparando a trilha completa…');
    await prepareSpotifyPlayer();
    spotifyIsPreparing = false;
    updateSoundtrackButton();
    showToast('Spotify conectado. Toque em “tocar a trilha da viagem” para começar.');
    setSpotifyStatus('Conta conectada. Toque no botão para começar.');
  }).catch((error) => {
    const message = error.message || 'Não foi possível concluir a conexão com o Spotify.';
    spotifyIsPreparing = false;
    updateSoundtrackButton();
    showToast(message);
    setSpotifyStatus(message, 'error');
  });
})();

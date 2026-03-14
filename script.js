document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.loader-wrapper');
    const status = document.querySelector('.loader-status');
    const initBtn = document.querySelector('#init-button');
    const bg = document.querySelector('.site-background');
    const canvas = document.getElementById('matrix-canvas');
    const cursor = document.querySelector('.custom-cursor');
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const spotlight = document.querySelector('.spotlight');
    const fogLayer1 = document.querySelector('.fog-layer.layer1');
    const fogLayer2 = document.querySelector('.fog-layer.layer2');
    const terminalOverlay = document.getElementById('terminal-overlay');
    const terminalInput = document.getElementById('terminal-input');
    const terminalBody = document.getElementById('terminal-body');
    const terminalClose = document.getElementById('terminal-close');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY, dotX = mouseX, dotY = mouseY;
    let audioCtx = null;
    let musicStarted = false;
    let experienceStarted = false;
    const BACKEND_URL = 'https://jlep-backend.onrender.com';
    let statusIdx = 0;
    const isErrorPage = window.location.pathname.includes('404.html') || !!document.querySelector('.error-code');
    const isLevel1 = window.location.pathname.includes('first.html');
    const isAutoplayPage = isErrorPage || isLevel1;

    // --- ADD YOUR CUSTOM HINTS HERE ---
    const levelHints = {
        1: "Undentified Random Location is where the sequence is. Sometimes it takes the form of a word only...",
        // 2: "Your custom hint for level 2 goes here",
    };

    const statuses = isErrorPage ? [
        "Scanning Corrupt Sectors...",
        "Access Denied: 0x404",
        "Attempting System Re-sync...",
        "Bypassing Corrupt Kernels...",
        "FAULT PREVENTED: ACCESS RESTORED"
    ] : [
        "Initializing Logic...",
        "Decrypting Assets...",
        "Synchronizing Audio...",
        "Bypassing Firewalls...",
        "CTLD.EXE: ACCESS GRANTED"
    ];

    // Data Migration: Port old JLEP data to Controlled
    if (localStorage.getItem('jlep_solvers_data') && !localStorage.getItem('controlled_solvers_data')) {
        localStorage.setItem('controlled_solvers_data', localStorage.getItem('jlep_solvers_data'));
        localStorage.removeItem('jlep_solvers_data');
        console.log("Migration: JLEP data ported to Controlled system.");
    }

    function revealProject() {
        // Ensure we start at the top
        window.scrollTo(0, 0);

        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.style.display = 'none', 1100);
            document.documentElement.classList.remove('loading');
            document.body.classList.remove('loading');
        }
        experienceStarted = true;

        if (bg) {
            bg.style.opacity = '1';
        }

        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';

        setupRevealObserver();

        // Background sync existing profiles on reveal
        setTimeout(() => syncAllProfiles(false), 2000);
    }

    async function triggerAudio() {
        const success = await initAudio();
        if (success) {
            startGenerativeMusic();
        }
    }

    function updateLoader() {
        if (statusIdx < statuses.length) {
            if (status) status.textContent = statuses[statusIdx];
            statusIdx++;
            setTimeout(updateLoader, 300 + Math.random() * 300);
        } else {
            setTimeout(revealProject, 500);
        }
    }

    function setupRevealObserver() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        reveals.forEach(el => observer.observe(el));
    }

    async function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        return audioCtx.state === 'running';
    }

    function createOsc(freq, type, vol, duration = 0) {
        if (!audioCtx || audioCtx.state !== 'running') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        if (duration > 0) {
            gain.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration + 1);
        } else {
            gain.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 1.0);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
        }
    }

    function startGenerativeMusic() {
        if (musicStarted) return;
        createOsc(40, 'sine', 0.12);
        createOsc(60, 'sine', 0.08);
        const mToF = (m) => Math.pow(2, (m - 69) / 12) * 440;
        const chords = isErrorPage ?
            [[24, 25, 28], [20, 21, 24], [17, 18, 21]] : // Much lower and more dissonant
            [[48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 46, 50]];
        const oscType = isErrorPage ? 'sawtooth' : 'triangle';
        let chordIndex = 0;
        const playChord = () => {
            if (!musicStarted || !experienceStarted) return;
            const volume = isErrorPage ? 0.012 : 0.02;
            chords[chordIndex].forEach(midi => createOsc(mToF(midi), oscType, volume, 10 + Math.random() * 5));
            chordIndex = (chordIndex + 1) % chords.length;
            const delay = isErrorPage ? 14000 : 10000;
            setTimeout(playChord, delay + Math.random() * 5000);
        };
        const scale = isErrorPage ? [36, 37, 40, 41] : [60, 63, 65, 67, 70, 72, 75];
        const playShimmer = () => {
            if (!musicStarted || !experienceStarted) return;
            const note = scale[Math.floor(Math.random() * scale.length)];
            createOsc(mToF(note + 12), 'sine', 0.008, 4 + Math.random() * 3);
            const delay = isErrorPage ? 5000 : 2000;
            setTimeout(playShimmer, delay + Math.random() * 4000);
        };
        playChord();
        playShimmer();
        musicStarted = true;
    }


    async function playSound(freq, type, duration, volume) {
        if (!experienceStarted) return;
        const active = await initAudio();
        if (!active) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function handleVisibility(visible) {
        const opacity = visible ? '1' : '0';
        if (cursor) cursor.style.opacity = opacity;
        if (spotlight) spotlight.style.opacity = opacity;
    }

    function animateCursor() {
        dotX += (mouseX - dotX) * 0.2;
        dotY += (mouseY - dotY) * 0.2;
        if (dot) {
            dot.style.left = `${dotX}px`;
            dot.style.top = `${dotY}px`;
        }
        ringX += (mouseX - ringX) * 0.1;
        ringY += (mouseY - ringY) * 0.1;
        if (ring) {
            ring.style.left = `${ringX}px`;
            ring.style.top = `${ringY}px`;
        }
        requestAnimationFrame(animateCursor);
    }

    function setupAudioListeners() {
        const startAudioOnInteraction = async () => {
            await triggerAudio();
            ['mousedown', 'keydown', 'touchstart', 'click'].forEach(ev =>
                document.removeEventListener(ev, startAudioOnInteraction)
            );
        };
        ['mousedown', 'keydown', 'touchstart', 'click'].forEach(ev =>
            document.addEventListener(ev, startAudioOnInteraction)
        );
    }

    if (canvas && loader) {
        initMatrixBackground(canvas, loader);
    }

    if (loader) {
        const urlParams = new URL(window.location.href).searchParams;
        if (urlParams.get('skipLoader') === 'true') {
            revealProject();
            setupAudioListeners();
            // Fallback for immediate interaction
            window.addEventListener('click', () => {
                if (!musicStarted) triggerAudio();
            }, { once: true });
        } else {
            document.documentElement.classList.add('loading');
            document.body.classList.add('loading');
        }
    } else {
        revealProject();
        setupAudioListeners();
        window.addEventListener('click', () => {
            if (!musicStarted) triggerAudio();
        }, { once: true });
    }

    if (dot) { dot.style.left = `${dotX}px`; dot.style.top = `${dotY}px`; }
    if (ring) { ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`; }
    if (!loader) handleVisibility(true);
    animateCursor();


    if (isAutoplayPage) {
        experienceStarted = true;
        triggerAudio();
        // Fallback for browsers blocking audio without interaction
        window.addEventListener('click', () => {
            if (!musicStarted) triggerAudio();
        }, { once: true });
    }

    if (initBtn) {
        initBtn.addEventListener('click', () => {
            initBtn.style.opacity = '0';
            initBtn.style.pointerEvents = 'none';
            setTimeout(() => initBtn.style.display = 'none', 500);
            if (status) status.classList.add('blink-anim');
            experienceStarted = true;
            triggerAudio();
            updateLoader();
        });
    }

    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (spotlight) {
            spotlight.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255, 62, 62, 0.15) 0%, transparent 60%)`;
        }
        handleVisibility(true);

        const normX = (e.clientX / window.innerWidth - 0.5) * 2;
        const normY = (e.clientY / window.innerHeight - 0.5) * 2;
        if (fogLayer1) {
            fogLayer1.style.transform = `translateX(${-normX * 15}px) translateY(${-normY * 8}px)`;
        }
        if (fogLayer2) {
            fogLayer2.style.transform = `translateX(${normX * 10}px) translateY(${normY * 5}px)`;
        }

        if (bg && bg.style.opacity !== '0') {
            const bx = (e.clientX / window.innerWidth - 0.5) * 30;
            const by = (e.clientY / window.innerHeight - 0.5) * 30;
            bg.style.transform = `translate(${bx}px, ${by}px) scale(1.1)`;
        }
    });

    document.addEventListener('mouseleave', () => handleVisibility(false));
    document.addEventListener('mouseenter', () => handleVisibility(true));
    document.addEventListener('mousedown', () => {
        playSound(150, 'sine', 0.04, 0.05);
    });

    document.querySelectorAll('a, button, .game-item, .door-link').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (cursor) cursor.classList.add('hovering');
            playSound(150, 'sine', 0.1, 0.04);
        });
        el.addEventListener('mouseleave', () => {
            if (cursor) cursor.classList.remove('hovering');
            el.style.transform = '';
        });
        el.addEventListener('click', () => playSound(50, 'triangle', 0.2, 0.03));
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
    });

    let terminalOpen = false;
    let resetPending = false;
    let deletePending = null;

    if (terminalClose) {
        terminalClose.addEventListener('mouseenter', () => playSound(180, 'sine', 0.05, 0.03));
    }

    async function playTerminalSweep(open) {
        if (!experienceStarted) return;
        const active = await initAudio();
        if (!active) return;
        const duration = 0.4;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        const startFreq = open ? 200 : 800;
        const endFreq = open ? 800 : 200;
        osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function toggleTerminal(forceClose) {
        if (!experienceStarted) return;
        if (forceClose || terminalOpen) {
            terminalOverlay && terminalOverlay.classList.remove('open');
            document.documentElement.classList.remove('terminal-open');
            terminalOpen = false;
            playTerminalSweep(false);
        } else {
            terminalOverlay && terminalOverlay.classList.add('open');
            document.documentElement.classList.add('terminal-open');
            terminalOpen = true;
            playTerminalSweep(true);
            if (terminalInput) terminalInput.focus();
        }
    }

    function addTerminalLine(text, type = 'system') {
        if (!terminalBody) return;
        const p = document.createElement('p');
        p.className = `terminal-line ${type}`;
        p.innerHTML = text;
        terminalBody.appendChild(p);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function getStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('controlled_solvers_data'));
            return data && typeof data === 'object' && Array.isArray(data.profiles) ? data : { active: null, profiles: [] };
        } catch { return { active: null, profiles: [] }; }
    }

    function updateNavProfile() {
        const nav = document.getElementById('nav-profile');
        if (nav) {
            const data = getStorage();
            if (data.active) {
                nav.textContent = 'Welcome, ' + data.active;
                nav.style.display = 'inline-block';
            } else {
                nav.textContent = '';
                nav.style.display = 'none';
            }
        }
    }

    function saveStorage(data) {
        localStorage.setItem('controlled_solvers_data', JSON.stringify(data));
        if (typeof updateNavProfile === 'function') updateNavProfile();
    }

    updateNavProfile();

    function getSolverData() {
        const storage = getStorage();
        if (!storage.active) return null;
        return storage.profiles.find(p => p.name === storage.active) || null;
    }

    async function saveSolverData(solverObj) {
        const storage = getStorage();

        // Track historical maximum level (persistent Peak)
        // Ensure we always take the maximum of current, cleared, and historical highest
        const profileLevel = parseInt(solverObj.level) || 0;
        const clearedMax = solverObj.cleared.length > 0 ? Math.max(...solverObj.cleared) : 0;
        solverObj.highestLevel = Math.max(
            (solverObj.highestLevel || 0),
            profileLevel,
            clearedMax
        );

        // Security defaults
        if (solverObj.failedAttempts === undefined) solverObj.failedAttempts = 0;
        if (solverObj.lockUntil === undefined) solverObj.lockUntil = 0;

        const idx = storage.profiles.findIndex(p => p.name === solverObj.name);
        if (idx >= 0) {
            storage.profiles[idx] = solverObj;
        } else {
            storage.profiles.push(solverObj);
        }
        storage.active = solverObj.name;
        saveStorage(storage);

        // Attempt to sync to global leaderboard in background
        if (navigator.onLine && solverObj.name !== 'Guest') {
            return fetch(`${BACKEND_URL}/leaderboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: solverObj.name,
                    level: solverObj.level,
                    highestLevel: solverObj.highestLevel,
                    cleared: solverObj.cleared,
                    password: solverObj.password,
                    failedAttempts: solverObj.failedAttempts || 0,
                    lockUntil: solverObj.lockUntil || 0
                }),
                keepalive: true
            }).then(async response => {
                if (!response.ok) {
                    const errObj = await response.json().catch(() => ({}));
                    throw new Error(errObj.error || `Uplink Error ${response.status}`);
                }
                return response.json();
            });
        }
        return Promise.resolve({ success: true, offline: true });
    }

    async function syncAllProfiles(verbose = false) {
        if (!navigator.onLine) return { success: false, error: 'Offline' };
        const storage = getStorage();
        if (!storage.profiles || storage.profiles.length === 0) return { success: true, count: 0 };

        if (verbose) addTerminalLine('[SYNC]: Starting full global update...', 'system');
        
        let syncedCount = 0;
        const syncPromises = storage.profiles
            .filter(p => p.name !== 'Guest')
            .map(async (p) => {
                try {
                    await fetch(`${BACKEND_URL}/leaderboard`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: p.name,
                            level: p.level,
                            highestLevel: p.highestLevel,
                            cleared: p.cleared,
                            password: p.password
                        }),
                        keepalive: true
                    });
                    syncedCount++;
                    if (verbose) addTerminalLine(`[SYNC]: Profile '${p.name}' updated globally.`, 'system');
                } catch (e) {
                    if (verbose) addTerminalLine(`[SYNC]: Profile '${p.name}' update failed.`, 'system');
                }
            });

        await Promise.all(syncPromises);
        if (verbose) addTerminalLine(`[SYNC]: Done. ${syncedCount} profiles processed.`, 'system');
        return { success: true, count: syncedCount };
    }

    function checkLock(profile) {
        if (!profile.lockUntil || profile.lockUntil < Date.now()) {
            return { locked: false };
        }
        const diff = profile.lockUntil - Date.now();
        const mins = Math.ceil(diff / 60000);
        let timeStr = mins + 'm';
        if (mins > 5256000) timeStr = '10 years'; // Hard cap mention
        else if (mins > 1440) timeStr = Math.round(mins / 1440) + ' days';
        else if (mins > 60) timeStr = Math.round(mins / 60) + ' hours';
        return { locked: true, remaining: timeStr };
    }

    function handleFailedAttempt(profile) {
        profile.failedAttempts = (profile.failedAttempts || 0) + 1;
        if (profile.failedAttempts >= 3) {
            // 3: 3m, 4: 30m, 5: 300m (5h), 6: 3000m (2d), 7: 30000m (20d), 8: 300000m (208d), 9+: 10 years
            const powers = [0, 0, 0, 3, 30, 300, 3000, 30000, 300000];
            let lockMins = powers[profile.failedAttempts] || 5256000; // 10 years for 9+ attempts
            profile.lockUntil = Date.now() + (lockMins * 60000);
            addTerminalLine(`[SECURITY]: <span class="cmd">LOCKOUT ACTIVATED</span>. Profile locked for ${lockMins < 5000000 ? lockMins + ' minutes' : '10 years'}.`, 'system');
        } else {
            addTerminalLine(`[SECURITY]: Incorrect password. ${3 - profile.failedAttempts} attempts remaining before lockout.`, 'system');
        }
        saveSolverData(profile);
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async function processCommand(cmd) {
        const trimmed = cmd.trim().toLowerCase();
        const parts = cmd.trim().split(/\s+/);
        const base = parts[0].toLowerCase();
        const args = parts.slice(1);
        addTerminalLine(escapeHTML(cmd), 'user');

        if (deletePending) {
            const confirmCmd = trimmed;
            if (confirmCmd === 'confirm') {
                const { name, password, storage, idx } = deletePending;
                addTerminalLine('[SYNC]: Executing global wipe sequence...');
                if (navigator.onLine) {
                    try {
                        const res = await fetch(`${BACKEND_URL}/leaderboard`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, password })
                        });
                        if (!res.ok) throw new Error('Server reject');
                        storage.profiles.splice(idx, 1);
                        if (storage.active === name) storage.active = null;
                        saveStorage(storage);
                        addTerminalLine('[TERMINAL]: Profile <span class="cmd">' + name + '</span> has been wiped.');
                    } catch (e) {
                        addTerminalLine('[ERROR]: Global wipe failed. Operation aborted.');
                    }
                } else {
                    addTerminalLine('[ERROR]: Uplink required for deletion.');
                }
            } else {
                addTerminalLine('[TERMINAL]: Deletion aborted.');
            }
            deletePending = null;
            return;
        }

        const commands = {
            'help': () => addTerminalLine(
                'Available commands: <span class="cmd">help</span>, <span class="cmd">manual &lt;cmd&gt;</span>, <span class="cmd">hint</span>, <span class="cmd">status</span>, <span class="cmd">about</span>, <span class="cmd">solvers</span>, <span class="cmd">progress</span>, <span class="cmd">ping</span>, <span class="cmd">date</span>, <span class="cmd">reset-system</span>, <span class="cmd">clear</span>'
            ),
            'manual': (args) => {
                if (!args || args.length === 0) {
                    addTerminalLine('=== SYSTEM COMMAND MANUAL ===');
                    addTerminalLine('Usage: <span class="cmd">manual &lt;command&gt;</span> to know about a specific command.');
                    addTerminalLine('Available Manuals: <span class="cmd">help</span>, <span class="cmd">hint</span>, <span class="cmd">status</span>, <span class="cmd">about</span>, <span class="cmd">ping</span>, <span class="cmd">date</span>, <span class="cmd">clear</span>, <span class="cmd">solvers</span>, <span class="cmd">progress</span>, <span class="cmd">reset-system</span>');
                    addTerminalLine('---');
                    addTerminalLine('Type <span class="cmd">help</span> for a quick summary of all commands.');
                    return;
                }
                const target = args[0].toLowerCase();
                const manuals = {
                    'help': 'Displays a concise list of all available system commands.',
                    'manual': 'Displays detailed information about system commands. Usage: <span class="cmd">manual &lt;command&gt;</span>',
                    'hint': 'Provides a clue for the current level or a specified level number. Usage: <span class="cmd">hint [number]</span>',
                    'status': 'Shows current system connectivity and active solver profile.',
                    'about': 'Information regarding the Controlled game.',
                    'ping': 'Measures network latency to external mainframes to verify uplink stability.',
                    'date': 'Shows current system timestamp and session uptime.',
                    'clear': 'Wipes the terminal buffer and resets the visual output.',
                    'solvers': 'Profile management system. Usage:<br>' +
                        ' - <span class="cmd">solvers register &lt;name&gt; &lt;pass&gt;</span>: Create profile.<br>' +
                        ' - <span class="cmd">solvers switch &lt;name&gt; &lt;pass&gt;</span>: Change active profile.<br>' +
                        ' - <span class="cmd">solvers status</span>: Detailed profile breakdown.<br>' +
                        ' - <span class="cmd">solvers local</span> / <span class="cmd">global</span>: View rankings.<br>' +
                        ' - <span class="cmd">solvers rename &lt;old&gt; &lt;new&gt; &lt;pass&gt;</span>: Globally rename profile.<br>' +
                        ' - <span class="cmd">solvers delete &lt;name&gt; &lt;pass&gt;</span>: Permanently wipe profile.<br>' +
                        ' - <span class="cmd">solvers sync</span>: Force global update of all local profiles.',
                    'progress': 'Progress tracking system. Usage:<br>' +
                        ' - <span class="cmd">progress</span>: View your stats.<br>' +
                        ' - <span class="cmd">progress reset &lt;name&gt; &lt;password&gt;</span>: Reset progress (subject to security lockout).',
                    'reset-system': 'DANGEROUS: Wipes all local profiles and progress data from this browser immediately. No password required.'
                };

                if (manuals[target]) {
                    addTerminalLine(`=== MANUAL: ${target.toUpperCase()} ===`);
                    addTerminalLine(manuals[target]);
                } else {
                    addTerminalLine(`No manual entry found for: <span class="cmd">${target}</span>`);
                }
            },
            'hint': (args) => {
                const solver = getSolverData();
                let currentLevelValue = (solver && solver.level !== 'None') ? parseInt(solver.level) : 1;

                let levelToHint = null;
                if (args.length > 0) {
                    levelToHint = parseInt(args[0]);
                } else {
                    levelToHint = currentLevelValue;
                }

                if (!levelToHint || isNaN(levelToHint)) {
                    addTerminalLine('<span class="cmd">ERROR:</span> Could not determine level. Usage: <span class="cmd">hint &lt;number&gt;</span>');
                    return;
                }

                // Anti-Cheat: Prevent accessing hints for future levels
                if (levelToHint > currentLevelValue) {
                    addTerminalLine(`[HINT SYSTEM]: <span class="cmd">ACCESS DENIED</span>. Sector ${levelToHint} data is encrypted.`, 'system');
                    addTerminalLine('Progress further to unlock higher-tier decryption keys.', 'system');
                    return;
                }

                // Hints are manually added here and NOT extracted from the level itself.
                const hint = levelHints[levelToHint];
                if (hint) {
                    addTerminalLine(`[HINT SYSTEM]: DECRYPTING DATA FOR SECTOR ${levelToHint}...`, 'system');
                    addTerminalLine(hint, 'hint');
                } else {
                    addTerminalLine(`[HINT SYSTEM]: No custom data packets found for Sector ${levelToHint}.`, 'system');
                }
            },
            'status': () => {
                const solver = getSolverData();
                addTerminalLine('SYSTEM STATUS: <span class="cmd">ONLINE</span>');
                addTerminalLine('Registered Solver: ' + (solver ? '<span class="cmd">' + escapeHTML(solver.name) + '</span>' : 'None'));
                addTerminalLine('Current Level: ' + (solver ? '<span class="cmd">' + escapeHTML(solver.level) + '</span>' : 'None'));
                addTerminalLine('Max Level: ' + (solver ? '<span class="cmd">' + (solver.highestLevel || (solver.level !== 'None' ? solver.level : 0)) + '</span>' : 'None'));
                addTerminalLine('Levels Cleared: ' + (solver && solver.cleared.length > 0 ? escapeHTML(solver.cleared.join(', ')) : 'None'));
                addTerminalLine('Threat Level: <span class="cmd">MODERATE</span>');
            },
            'about': () => {
                addTerminalLine('Controlled');
                addTerminalLine('A browser-based riddle game inspired by Notpron.');
                addTerminalLine('Created Feb 2026. Over 100 levels.');
            },
            'solvers': async (args) => {
                const sub = args[0] ? args[0].toLowerCase() : null;
                const solver = getSolverData();

                if (!sub || sub === 'status') {
                    addTerminalLine('=== ACTIVE SOLVER ===');
                    if (solver) {
                        addTerminalLine('Name: <span class="cmd">' + escapeHTML(solver.name) + '</span>');
                        addTerminalLine('Current Level: <span class="cmd">' + escapeHTML(solver.level) + '</span>');
                        addTerminalLine('Max Level: <span class="cmd">' + (solver.highestLevel || (solver.level !== 'None' ? solver.level : 0)) + '</span>');
                        addTerminalLine('Levels Cleared: ' + (solver.cleared.length > 0 ? escapeHTML(solver.cleared.join(', ')) : 'None'));
                        addTerminalLine('Registered: ' + escapeHTML(solver.registered));
                    } else {
                        addTerminalLine('No active solver.');
                        addTerminalLine('Use <span class="cmd">solvers register &lt;name&gt; &lt;pass&gt;</span> to create one.');
                    }
                    return;
                }

                if (sub === 'register' || sub === 'claim') {
                    if (args.length < 3) {
                        addTerminalLine('Usage: <span class="cmd">solvers ' + sub + ' &lt;name&gt; &lt;password&gt;</span>');
                        return;
                    }
                    const password = args.pop();
                    const name = args.slice(1).join(' ');
                    const storage = getStorage();

                    if (storage.profiles.length >= 3) {
                        addTerminalLine('[SECURITY]: <span class="cmd">ACCESS DENIED</span>. Device profile limit reached (3/3).');
                        addTerminalLine('To register a new solver, you must first <span class="cmd">solvers delete</span> an existing local profile.');
                        return;
                    }

                    if (storage.profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                        addTerminalLine('Profile <span class="cmd">' + name + '</span> already exists locally. Use <span class="cmd">solvers switch</span>.');
                        return;
                    }

                    addTerminalLine('[SYNC]: Establishing uplink with Controlled mainframes...');
                    const newSolver = {
                        name: name,
                        password: password,
                        level: 'None',
                        cleared: [],
                        highestLevel: 0,
                        registered: new Date().toLocaleDateString()
                    };

                    try {
                        await saveSolverData(newSolver);
                        const actionVerb = sub === 'claim' ? 'claimed' : 'registered';
                        addTerminalLine('[SYNC]: Connection stable. Solver ' + actionVerb + ': <span class="cmd">' + name + '</span>');
                        addTerminalLine('Good luck, ' + name + '. The puzzle awaits.');
                        playSound(120, 'sine', 0.3, 0.03);
                    } catch (err) {
                        if (err.message.includes('password') || err.message.includes('locked')) {
                            addTerminalLine('[SYNC]: <span class="cmd">ACCESS DENIED</span>. Name <span class="cmd">' + name + '</span> is already taken globally.');
                        } else {
                            addTerminalLine('[SYNC]: <span class="cmd">WARNING</span> — Global sync failed (' + err.message + ').');
                            addTerminalLine('Profile created locally. It will auto-sync on your next action.');
                        }
                        addTerminalLine('Welcome, ' + name + '.');
                        playSound(120, 'sine', 0.3, 0.03);
                    }
                } else if (sub === 'switch') {
                    if (args.length < 3) {
                        addTerminalLine('Usage: <span class="cmd">solvers switch &lt;name&gt; &lt;password&gt;</span>');
                        return;
                    }
                    const password = args.pop();
                    const name = args.slice(1).join(' ');
                    const storage = getStorage();
                    const target = storage.profiles.find(p => p.name.toLowerCase() === name.toLowerCase());

                    if (target) {
                        const lock = checkLock(target);
                        if (lock.locked) {
                            addTerminalLine(`[SECURITY]: <span class="cmd">ACCESS DENIED</span>. Profile locked for ${lock.remaining}.`);
                            return;
                        }

                        if (target.password && target.password !== password) {
                            handleFailedAttempt(target);
                            return;
                        }
                        // Success
                        target.failedAttempts = 0;
                        target.lockUntil = 0;
                        storage.active = target.name;
                        saveStorage(storage);
                        try {
                            addTerminalLine('[SYNC]: Synchronizing profile state...');
                            await saveSolverData(target);
                            addTerminalLine('Switched active profile to: <span class="cmd">' + escapeHTML(target.name) + '</span>');
                        } catch (err) {
                            addTerminalLine('Switched active profile to: <span class="cmd">' + escapeHTML(target.name) + '</span> (Offline mode)');
                        }
                    } else {
                        addTerminalLine('Profile not found locally.');
                    }
                } else if (sub === 'rename') {
                    if (args.length < 4) {
                        addTerminalLine('Usage: <span class="cmd">solvers rename &lt;old&gt; &lt;new&gt; &lt;pass&gt;</span>');
                        return;
                    }
                    const password = args.pop();
                    const newName = args.pop();
                    const oldName = args.slice(1).join(' ');
                    const storage = getStorage();
                    const targetIdx = storage.profiles.findIndex(p => p.name.toLowerCase() === oldName.toLowerCase());

                    if (targetIdx >= 0) {
                        const target = storage.profiles[targetIdx];
                        const lock = checkLock(target);
                        if (lock.locked) {
                            addTerminalLine(`[SECURITY]: <span class="cmd">ACCESS DENIED</span>. Profile locked for ${lock.remaining}.`);
                            return;
                        }

                        if (target.password && target.password !== password) {
                            handleFailedAttempt(target);
                            return;
                        }

                        if (navigator.onLine) {
                            try {
                                const r = await fetch(`${BACKEND_URL}/leaderboard/rename`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ oldName, newName, password })
                                });
                                const data = await r.json();
                                if (data.error) {
                                    addTerminalLine('<span class="cmd">ERROR:</span> ' + data.error);
                                } else {
                                    target.name = newName;
                                    target.failedAttempts = 0;
                                    target.lockUntil = 0;
                                    storage.profiles[targetIdx] = target;
                                    if (storage.active === oldName) storage.active = newName;
                                    saveStorage(storage);
                                    addTerminalLine('Profile <span class="cmd">' + oldName + '</span> renamed to <span class="cmd">' + newName + '</span>.');
                                }
                            } catch { addTerminalLine('<span class="cmd">ERROR:</span> Sync failed.'); }
                        } else {
                            addTerminalLine('Online connection required for renaming.');
                        }
                    } else {
                        addTerminalLine('Profile not found.');
                    }
                } else if (sub === 'local') {
                    const storage = getStorage();
                    const sorted = [...storage.profiles].sort((a,b) => (b.highestLevel || 0) - (a.highestLevel || 0));
                    addTerminalLine('=== LOCAL LEADERBOARD ===');
                    sorted.forEach((p, i) => addTerminalLine(`${i+1}. <span class="cmd">${escapeHTML(p.name)}</span> — Max Level: ${p.highestLevel || 0}`));
                } else if (sub === 'global') {
                    if (!navigator.onLine) {
                        addTerminalLine('Internet connection required.');
                        return;
                    }
                    addTerminalLine('Fetching global data...');
                    try {
                        const res = await fetch(`${BACKEND_URL}/leaderboard`);
                        const data = await res.json();
                        addTerminalLine('=== GLOBAL LEADERBOARD ===');
                        data.slice(0, 10).forEach((p, i) => addTerminalLine(`${i+1}. <span class="cmd">${p.name}</span> — Max Level: ${p.highestLevel || 0}`));
                    } catch { addTerminalLine('Server unreachable.'); }
                } else if (sub === 'delete') {
                    if (args.length < 3) {
                        addTerminalLine('Usage: <span class="cmd">solvers delete &lt;name&gt; &lt;pass&gt;</span>');
                        return;
                    }
                    const password = args.pop();
                    const name = args.slice(1).join(' ');
                    const storage = getStorage();
                    const idx = storage.profiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
                    if (idx >= 0) {
                        const target = storage.profiles[idx];
                        const lock = checkLock(target);
                        if (lock.locked) {
                            addTerminalLine(`[SECURITY]: <span class="cmd">ACCESS DENIED</span>. Profile locked for ${lock.remaining}.`);
                            return;
                        }

                        if (target.password && target.password !== password) {
                            handleFailedAttempt(target);
                            return;
                        }

                        deletePending = { name, password, storage, idx };
                        addTerminalLine('[WARNING]: <span class="cmd">DANGEROUS ACTION</span>. You are about to permanently wipe profile <span class="cmd">' + name + '</span>.');
                        addTerminalLine('Type <span class="cmd">confirm</span> to proceed, or anything else to cancel.');
                    } else { addTerminalLine('Not found.'); }
                } else if (sub === 'sync') {
                    await syncAllProfiles(true);
                } else {
                    addTerminalLine('<span class="cmd">ERROR:</span> Unknown solvers subcommand: <span class="cmd">' + escapeHTML(sub) + '</span>');
                    addTerminalLine('Type <span class="cmd">manual solvers</span> for usage.');
                }
            },
            'ping': () => {
                addTerminalLine('Pinging network...');
                if (!navigator.onLine) {
                    addTerminalLine('<span class="cmd">OFFLINE</span> — No internet connection detected.');
                    return;
                }
                const doPing = async (i) => {
                    const start = performance.now();
                    try {
                        await fetch('https://httpbin.org/get', { mode: 'no-cors', cache: 'no-store' });
                        const ms = Math.round(performance.now() - start);
                        addTerminalLine(`Ping ${i}: time=${ms}ms`);
                        return ms;
                    } catch {
                        addTerminalLine(`Ping ${i}: <span class="cmd">TIMEOUT</span>`);
                        return null;
                    }
                };
                (async () => {
                    const results = [];
                    for (let i = 1; i <= 3; i++) {
                        const ms = await doPing(i);
                        if (ms !== null) results.push(ms);
                    }
                    if (results.length > 0) {
                        const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
                        const status = avg < 100 ? 'EXCELLENT' : avg < 300 ? 'GOOD' : 'POOR';
                        addTerminalLine(`Average: ${avg}ms — Connection: <span class="cmd">${status}</span>`);
                    } else {
                        addTerminalLine('Connection: <span class="cmd">FAILED</span>');
                    }
                })();
            },
            'date': () => {
                const now = new Date();
                addTerminalLine(`System Time: ${now.toLocaleString()}`);
                addTerminalLine(`Uptime: ${Math.floor(performance.now() / 1000)}s`);
            },
            'progress': (args) => {
                const sub = args[0] ? args[0].toLowerCase() : null;
                
                if (sub === 'reset') {
                    if (args.length < 3) {
                        addTerminalLine('Usage: <span class="cmd">progress reset &lt;name&gt; &lt;password&gt;</span>');
                        return;
                    }
                    const password = args.pop();
                    const name = args.slice(1).join(' '); // Skip 'reset'
                    
                    const storage = getStorage();
                    const target = storage.profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
                    
                    if (target) {
                        if (target.password && target.password !== password) {
                            addTerminalLine('<span class="cmd">ERROR:</span> Invalid authorization credentials.');
                            return;
                        }

                        addTerminalLine('[SYNC]: Initiating Sector Reset sequence for <span class="cmd">' + escapeHTML(target.name) + '</span>...');
                        
                        // Reset to 'None' and wipe cleared history
                        target.level = 'None';
                        target.cleared = [];
                        
                        (async () => {
                            try {
                                await saveSolverData(target);
                                addTerminalLine('[SYNC]: Progress reset successful. <span class="cmd">Max Level</span> remains preserved.');
                                addTerminalLine('Profile: <span class="cmd">' + escapeHTML(target.name) + '</span> — Current Level: <span class="cmd">None</span>');
                                playSound(150, 'sine', 0.4, 0.05);

                                // If resetting the ACTIVE profile while on a level page, kick them back to home
                                if (storage.active === target.name && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && window.location.pathname.includes('outerframe')) {
                                    addTerminalLine('[SYSTEM]: Sector reset triggered. Relocating to main portal...');
                                    setTimeout(() => {
                                        window.location.href = '../index.html?skipLoader=true';
                                    }, 1500);
                                }
                            } catch (err) {
                                addTerminalLine('[SYNC]: <span class="cmd">WARNING</span> — Reset recorded locally but failed to sync globally.');
                            }
                        })();
                    } else {
                        addTerminalLine('Profile not found.');
                    }
                    return;
                }

                if (sub !== null) {
                    addTerminalLine('<span class="cmd">ERROR:</span> Unknown progress subcommand: <span class="cmd">' + escapeHTML(sub) + '</span>');
                    addTerminalLine('Type <span class="cmd">manual progress</span> for usage.');
                    return;
                }

                const solver = getSolverData();
                if (!solver) {
                    addTerminalLine('No solver registered. Use <span class="cmd">solvers register &lt;name&gt;</span> first.');
                    return;
                }
                addTerminalLine('=== PROGRESS ===');
                addTerminalLine('Current Level: <span class="cmd">' + escapeHTML(solver.level) + '</span>');
                addTerminalLine('Levels Cleared: ' + (solver.cleared.length > 0 ? escapeHTML(solver.cleared.join(', ')) : 'None'));
                addTerminalLine('Max Level: <span class="cmd">' + (solver.highestLevel || 0) + '</span>');
            },
            'clear': () => {
                if (terminalBody) terminalBody.innerHTML = '';
                addTerminalLine('Terminal cleared.');
            },
            'reset-system': () => {
                resetPending = true;
                addTerminalLine('<span class="cmd">WARNING:</span> This will permanently wipe all local profiles and progress.');
                addTerminalLine('Type <span class="cmd">confirm-reset</span> to proceed or <span class="cmd">cancel</span> to abort.');
            },
            'confirm-reset': () => {
                if (!resetPending) {
                    addTerminalLine('<span class="cmd">ACCESS DENIED.</span> No system reset operation is pending.');
                    return;
                }
                resetPending = false;
                const storage = getStorage();
                if (storage.profiles.length > 0 && navigator.onLine) {
                    addTerminalLine('Syncing with global server...');
                    storage.profiles.forEach(p => {
                        if (p.name && p.password) {
                            fetch(`${BACKEND_URL}/leaderboard`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: p.name, password: p.password })
                            }).catch(() => { });
                        }
                    });
                }
                localStorage.removeItem('controlled_solvers_data');
                if (typeof updateNavProfile === 'function') updateNavProfile();
                addTerminalLine('SYSTEM WIPE COMPLETE. All local data has been purged.');
                playSound(150, 'sawtooth', 0.5, 0.04);
            },
            'cancel': () => {
                if (resetPending) {
                    resetPending = false;
                    addTerminalLine('Operation aborted. Data preserved.');
                } else {
                    addTerminalLine('No active operation to cancel.');
                }
            }
        };

        if (commands[base]) {
            if (resetPending && base !== 'confirm-reset' && base !== 'cancel') {
                resetPending = false;
            }
            commands[base](args);
        } else {
            if (resetPending) resetPending = false;
            addTerminalLine(`Unknown command: "${escapeHTML(cmd)}". Type <span class="cmd">help</span> for available commands.`);
            playSound(200, 'square', 0.15, 0.02);
        }
    }


    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isLevel1) return; // Terminal disabled in Level 1
            e.preventDefault();
            toggleTerminal();
        }
    });

    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && terminalInput.value.trim()) {
                processCommand(terminalInput.value);
                terminalInput.value = '';
                playSound(100, 'sine', 0.1, 0.03);
            }
        });
    }

    if (terminalClose) {
        terminalClose.addEventListener('click', () => toggleTerminal(true));
    }

    const launchBtn = document.getElementById('launch-terminal');
    if (launchBtn) {
        launchBtn.addEventListener('click', () => toggleTerminal());
    }
    console.log("%cYou found a secret!", "color: #ff3e3e; font-size: 20px; font-weight: bold;");
    console.log("%cNothing here yet. Come back later!", "color: #ff3e3e; opacity: 0.7; font-size: 14px;");
});

function initMatrixBackground(canvas, loader) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const characters = '01';
    const fontSize = 16;
    const columns = Math.ceil(width / fontSize);
    const drops = [];
    for (let i = 0; i < columns; i++) drops[i] = Math.random() * -100;

    let animationFrameId;
    function draw() {
        if (loader && (getComputedStyle(loader).visibility === 'hidden' || getComputedStyle(loader).opacity === '0')) {
            cancelAnimationFrame(animationFrameId);
            return;
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ff3e3e';
        ctx.font = fontSize + 'px Courier Prime';
        for (let i = 0; i < drops.length; i++) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
            else drops[i]++;
        }
        animationFrameId = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    draw();
}

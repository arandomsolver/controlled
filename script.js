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
    let statusIdx = 0;
    const statuses = [
        "Initializing Logic...",
        "Decrypting Assets...",
        "Synchronizing Audio...",
        "Bypassing Firewalls...",
        "JLEP: ACCESS GRANTED"
    ];

    function revealProject() {
        // Ensure we start at the top
        window.scrollTo(0, 0);

        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.style.display = 'none', 1100);
            document.documentElement.classList.remove('loading');
            document.body.classList.remove('loading');
            experienceStarted = true;
        }

        if (bg) {
            bg.style.opacity = '1';
        }

        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';

        setupRevealObserver();
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
        const chords = [[48, 51, 55], [44, 48, 51], [41, 44, 48], [43, 46, 50]];
        let chordIndex = 0;
        const playChord = () => {
            if (!musicStarted || !experienceStarted) return;
            chords[chordIndex].forEach(midi => createOsc(mToF(midi), 'triangle', 0.02, 8 + Math.random() * 4));
            chordIndex = (chordIndex + 1) % chords.length;
            setTimeout(playChord, 10000 + Math.random() * 5000);
        };
        const scale = [60, 63, 65, 67, 70, 72, 75];
        const playShimmer = () => {
            if (!musicStarted || !experienceStarted) return;
            const note = scale[Math.floor(Math.random() * scale.length)];
            createOsc(mToF(note + 12), 'sine', 0.015, 4 + Math.random() * 3);
            setTimeout(playShimmer, 2000 + Math.random() * 4000);
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
            ['mousedown', 'keydown', 'touchstart', 'mousemove', 'scroll'].forEach(ev =>
                document.removeEventListener(ev, startAudioOnInteraction)
            );
        };
        ['mousedown', 'keydown', 'touchstart', 'mousemove', 'scroll'].forEach(ev =>
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
        } else {
            document.documentElement.classList.add('loading');
            document.body.classList.add('loading');
        }
    } else {
        revealProject();
        setupAudioListeners();
    }

    if (dot) { dot.style.left = `${dotX}px`; dot.style.top = `${dotY}px`; }
    if (ring) { ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`; }
    if (!loader) handleVisibility(true);
    animateCursor();


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
            const data = JSON.parse(localStorage.getItem('jlep_solvers_data'));
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
                nav.style.display = 'none';
            }
        }
    }

    function saveStorage(data) {
        localStorage.setItem('jlep_solvers_data', JSON.stringify(data));
        if (typeof updateNavProfile === 'function') updateNavProfile();
    }

    updateNavProfile();

    function getSolverData() {
        const storage = getStorage();
        if (!storage.active) return null;
        return storage.profiles.find(p => p.name === storage.active) || null;
    }

    function saveSolverData(solverObj) {
        const storage = getStorage();

        // Track historical maximum level
        const currentMax = solverObj.cleared.length > 0 ? Math.max(...solverObj.cleared) : 0;
        solverObj.highestLevel = Math.max((solverObj.highestLevel || 0), currentMax);

        const idx = storage.profiles.findIndex(p => p.name === solverObj.name);
        if (idx >= 0) {
            storage.profiles[idx] = solverObj;
        } else {
            storage.profiles.push(solverObj);
        }
        storage.active = solverObj.name;
        saveStorage(storage);

        // Attempt to sync to global leaderboard in background
        if (navigator.onLine) {
            try {
                fetch('https://jlep-backend.onrender.com/leaderboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: solverObj.name,
                        level: solverObj.level,
                        cleared: solverObj.cleared,
                        password: solverObj.password
                    })
                }).catch(() => { });
            } catch (e) { }
        }
    }

    function processCommand(cmd) {
        const trimmed = cmd.trim().toLowerCase();
        const parts = cmd.trim().split(/\s+/);
        const base = parts[0].toLowerCase();
        const args = parts.slice(1);
        addTerminalLine(cmd, 'user');

        const commands = {
            'help': () => addTerminalLine(
                'Available commands: <span class="cmd">help</span>, <span class="cmd">log</span>, <span class="cmd">status</span>, <span class="cmd">about</span>, <span class="cmd">solvers</span>, <span class="cmd">progress</span>, <span class="cmd">ping</span>, <span class="cmd">date</span>, <span class="cmd">clear</span><br>' +
                'Solvers: <span class="cmd">solvers</span> (view), <span class="cmd">solvers register &lt;name&gt; &lt;pass&gt;</span>, <span class="cmd">solvers switch &lt;name&gt; &lt;pass&gt;</span>, <span class="cmd">solvers delete &lt;name&gt; &lt;pass&gt;</span>, <span class="cmd">solvers rename &lt;old&gt; &lt;new&gt; &lt;pass&gt;</span>, <span class="cmd">solvers local</span>, <span class="cmd">solvers global</span><br>' +
                'Progress: <span class="cmd">progress</span> (view), <span class="cmd">progress reset &lt;pass&gt;</span>, <span class="cmd">progress reset all &lt;pass1&gt; &lt;pass2&gt; ...</span>'
            ),
            'log': () => {
                addTerminalLine('[LOG 001] This puzzle was created by 4_r4nd0m_p14y3r. I dunno who is that, but the system created is good. — Feb 26, 2026');
                addTerminalLine('[LOG 002] Threat levels were increasing, so security was improved. The owner created his own profile with encrypted password. (really?) — Mar 01, 2026');
            },
            'status': () => {
                const solver = getSolverData();
                addTerminalLine('SYSTEM STATUS: <span class="cmd">ONLINE</span>');
                addTerminalLine('Registered Solver: ' + (solver ? '<span class="cmd">' + solver.name + '</span>' : 'None'));
                addTerminalLine('Current Level: ' + (solver ? '<span class="cmd">' + solver.level + '</span>' : 'None'));
                addTerminalLine('Levels Cleared: ' + (solver && solver.cleared.length > 0 ? solver.cleared.join(', ') : 'None'));
                addTerminalLine('Threat Level: <span class="cmd">MODERATE</span>');
            },
            'about': () => {
                addTerminalLine('JLEP — Just Like Every Puzzle');
                addTerminalLine('A browser-based riddle game inspired by Notpron.');
                addTerminalLine('Created Feb 2026. Over 100 levels.');
            },
            'solvers': () => {
                const solver = getSolverData();
                addTerminalLine('=== ACTIVE SOLVER ===');
                if (solver) {
                    addTerminalLine('Name: <span class="cmd">' + solver.name + '</span>');
                    addTerminalLine('Current Level: <span class="cmd">' + solver.level + '</span>');
                    addTerminalLine('Levels Cleared: ' + (solver.cleared.length > 0 ? solver.cleared.join(', ') : 'None'));
                    addTerminalLine('Max Level: <span class="cmd">' + (solver.highestLevel || 0) + '</span>');
                    addTerminalLine('Registered: ' + solver.registered);
                } else {
                    addTerminalLine('No active solver.');
                    addTerminalLine('Use <span class="cmd">solvers register &lt;name&gt;</span> to create one.');
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
            'progress': () => {
                const solver = getSolverData();
                if (!solver) {
                    addTerminalLine('No solver registered. Use <span class="cmd">solvers register &lt;name&gt;</span> first.');
                    return;
                }
                addTerminalLine('=== PROGRESS ===');
                addTerminalLine('Current Level: <span class="cmd">' + solver.level + '</span>');
                addTerminalLine('Levels Cleared: ' + (solver.cleared.length > 0 ? solver.cleared.join(', ') : 'None'));
                addTerminalLine('Max Level: <span class="cmd">' + (solver.highestLevel || 0) + '</span>');
            },
            'clear': () => {
                if (terminalBody) terminalBody.innerHTML = '';
                addTerminalLine('Terminal cleared.');
            }
        };

        if (base === 'solvers' && args.length > 0) {
            const sub = args[0].toLowerCase();
            if ((sub === 'register' || sub === 'claim') && args.length >= 2) {
                const nameArgs = args.slice(1);
                if (nameArgs.length < 2) {
                    addTerminalLine('Usage: <span class="cmd">solvers ' + sub + ' &lt;name&gt; &lt;password&gt;</span>');
                    return;
                }
                const password = nameArgs.pop();
                const name = nameArgs.join(' ');

                const storage = getStorage();
                if (storage.profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                    addTerminalLine('Profile <span class="cmd">' + name + '</span> already exists locally. Use <span class="cmd">solvers switch</span>.');
                    return;
                }
                const solver = {
                    name: name,
                    password: password,
                    level: 'None',
                    cleared: [],
                    highestLevel: 0,
                    registered: new Date().toLocaleDateString()
                };
                saveSolverData(solver);

                const actionVerb = sub === 'claim' ? 'claimed' : 'registered';
                addTerminalLine('Solver ' + actionVerb + ' and active: <span class="cmd">' + name + '</span>');
                addTerminalLine('Good luck, ' + name + '. The puzzle awaits.');
                playSound(120, 'sine', 0.3, 0.03);
            } else if (sub === 'switch' && args.length >= 2) {
                const nameArgs = args.slice(1);
                if (nameArgs.length < 2) {
                    addTerminalLine('Usage: <span class="cmd">solvers switch &lt;name&gt; &lt;password&gt;</span>');
                    return;
                }
                const password = nameArgs.pop();
                const name = nameArgs.join(' ');

                const storage = getStorage();
                const target = storage.profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
                if (target) {
                    if (!target.password) {
                        target.password = password;
                    }
                    storage.active = target.name;
                    saveStorage(storage);
                    saveSolverData(target);
                    addTerminalLine('Switched active profile to: <span class="cmd">' + target.name + '</span>');
                } else {
                    addTerminalLine('Profile not found. Use <span class="cmd">solvers register &lt;name&gt; &lt;password&gt;</span>.');
                }
            } else if (sub === 'rename' && args.length >= 3) {
                const nameArgs = args.slice(1);
                if (nameArgs.length < 3) {
                    addTerminalLine('Usage: <span class="cmd">solvers rename &lt;old_name&gt; &lt;new_name&gt; &lt;password&gt;</span>');
                    return;
                }
                const password = nameArgs.pop();
                const newName = nameArgs.pop();
                const oldName = nameArgs.join(' ');

                const storage = getStorage();
                const targetIdx = storage.profiles.findIndex(p => p.name.toLowerCase() === oldName.toLowerCase());

                if (targetIdx >= 0) {
                    const target = storage.profiles[targetIdx];
                    if (target.password && target.password !== password) {
                        addTerminalLine('<span class="cmd">ERROR:</span> Incorrect password for this profile.');
                        return;
                    }
                    if (storage.profiles.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
                        addTerminalLine('<span class="cmd">ERROR:</span> The new name is already taken locally.');
                        return;
                    }

                    if (navigator.onLine) {
                        fetch('https://jlep-backend.onrender.com/leaderboard/rename', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ oldName, newName, password })
                        }).then(r => r.json()).then(data => {
                            if (data.error) {
                                addTerminalLine('<span class="cmd">ERROR:</span> ' + data.error);
                            } else {
                                if (!target.password) target.password = password;
                                target.name = newName;
                                storage.profiles[targetIdx] = target;
                                if (storage.active === oldName) storage.active = newName;
                                saveStorage(storage);
                                addTerminalLine('Profile <span class="cmd">' + oldName + '</span> successfully renamed to <span class="cmd">' + newName + '</span>.');
                            }
                        }).catch(() => {
                            addTerminalLine('<span class="cmd">ERROR:</span> Failed to contact global server for renaming.');
                        });
                    } else {
                        addTerminalLine('<span class="cmd">ERROR:</span> You must be online to rename a global profile.');
                    }
                } else {
                    addTerminalLine('Profile not found locally.');
                }
            } else if (sub === 'local') {
                const storage = getStorage();
                if (!storage.profiles.length) {
                    addTerminalLine('No local solvers registered yet.');
                    return;
                }
                const sorted = [...storage.profiles].sort((a, b) => {
                    const maxA = a.highestLevel || (a.cleared.length > 0 ? Math.max(...a.cleared) : 0);
                    const maxB = b.highestLevel || (b.cleared.length > 0 ? Math.max(...b.cleared) : 0);
                    if (maxB !== maxA) return maxB - maxA;
                    return a.name.localeCompare(b.name);
                });
                addTerminalLine('=== LOCAL LEADERBOARD ===');
                sorted.forEach((p, i) => {
                    const maxCleared = p.highestLevel || (p.cleared.length > 0 ? Math.max(...p.cleared) : 0);
                    addTerminalLine(`${i + 1}. <span class="cmd">${p.name}</span> — Max Level: ${maxCleared}`);
                });
            } else if (sub === 'global') {
                addTerminalLine('Checking connection to JLEP mainframes...');
                if (!navigator.onLine) {
                    setTimeout(() => addTerminalLine('<span class="cmd">ERROR:</span> No internet connection. Global leaderboard requires uplink.'), 500);
                    return;
                }
                setTimeout(async () => {
                    addTerminalLine('Uplink established. Downloading global data...');
                    try {
                        const res = await fetch('https://jlep-backend.onrender.com/leaderboard');
                        if (!res.ok) throw new Error('Bad response');
                        const data = await res.json();

                        setTimeout(() => {
                            if (data.length === 0) {
                                addTerminalLine('=== GLOBAL LEADERBOARD ===');
                                addTerminalLine('Database is empty. Be the first to claim a spot.');
                            } else {
                                addTerminalLine('=== GLOBAL LEADERBOARD ===');
                                data.slice(0, 10).forEach((p, i) => {
                                    const max = p.cleared.length > 0 ? Math.max(...p.cleared) : 0;
                                    addTerminalLine(`${i + 1}. <span class="cmd">${p.name}</span> — Max Level: ${max}`);
                                });


                                const storage = getStorage();
                                const activeName = storage.active;
                                if (activeName) {
                                    const myRank = data.findIndex(p => p.name === activeName);
                                    if (myRank > 9) {
                                        const myMax = data[myRank].cleared.length > 0 ? Math.max(...data[myRank].cleared) : 0;
                                        addTerminalLine(`...<br>${myRank + 1}. <span class="cmd">${activeName}</span> — Max Level: ${myMax} (YOU)`);
                                    }
                                }
                            }
                        }, 500);
                    } catch (err) {
                        setTimeout(() => addTerminalLine('<span class="cmd">ERROR:</span> Connection refused. The global server is currently unreachable.'), 500);
                    }
                }, 600);
            } else if (sub === 'delete' && args.length >= 2) {

                const nameArgs = args.slice(1);
                if (nameArgs.length < 2) {
                    addTerminalLine('Usage: <span class="cmd">solvers delete &lt;name&gt; &lt;password&gt;</span>');
                    return;
                }
                const password = nameArgs.pop();
                const name = nameArgs.join(' ');

                const storage = getStorage();
                const targetIdx = storage.profiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
                if (targetIdx >= 0) {
                    if (storage.profiles[targetIdx].password && storage.profiles[targetIdx].password !== password) {
                        addTerminalLine('<span class="cmd">ERROR:</span> Incorrect password for this profile.');
                        return;
                    }
                    if (navigator.onLine) {
                        fetch('https://jlep-backend.onrender.com/leaderboard', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, password })
                        }).then(r => r.json()).then(data => {
                            if (data.error) {
                                addTerminalLine('<span class="cmd">ERROR:</span> ' + data.error);
                            } else {
                                storage.profiles.splice(targetIdx, 1);
                                if (storage.active && storage.active.toLowerCase() === name.toLowerCase()) {
                                    storage.active = null;
                                    if (typeof updateNavProfile === 'function') updateNavProfile();
                                }
                                saveStorage(storage);
                                addTerminalLine('Profile <span class="cmd">' + name + '</span> deleted successfully locally and globally.');
                            }
                        }).catch(() => {
                            addTerminalLine('<span class="cmd">ERROR:</span> Failed to contact global server for deletion.');
                        });
                    } else {
                        addTerminalLine('<span class="cmd">ERROR:</span> You must be online to delete a global profile.');
                    }
                } else {
                    addTerminalLine('Profile not found. Use <span class="cmd">solvers local</span> to view profiles.');
                }
            } else {
                addTerminalLine('Usage: <span class="cmd">solvers local</span> / <span class="cmd">global</span> / <span class="cmd">register &lt;name&gt; &lt;pass&gt;</span> / <span class="cmd">switch &lt;name&gt; &lt;pass&gt;</span> / <span class="cmd">rename &lt;old&gt; &lt;new&gt; &lt;pass&gt;</span> / <span class="cmd">delete &lt;name&gt; &lt;pass&gt;</span>');
            }
            return;
        }


        if (base === 'progress' && args.length > 0) {
            const sub = args[0].toLowerCase();
            let solver = getSolverData();
            if (!solver) {
                addTerminalLine('No solver registered. Use <span class="cmd">solvers register &lt;name&gt;</span> first.');
                return;
            }
            if (sub === 'reset') {
                const isAll = args[1] && args[1].toLowerCase() === 'all';
                const storage = getStorage();

                if (isAll) {
                    const profiles = storage.profiles;
                    if (profiles.length === 0) {
                        localStorage.removeItem('jlep_solvers_data');
                        if (typeof updateNavProfile === 'function') updateNavProfile();
                        addTerminalLine('No profiles found. System reset to default.');
                        return;
                    }

                    const providedPasses = args.slice(2);
                    if (providedPasses.length < profiles.length) {
                        addTerminalLine('<span class="cmd">ERROR:</span> This action requires passwords from ALL local solvers.');
                        addTerminalLine('Usage: <span class="cmd">progress reset all &lt;pass1&gt; &lt;pass2&gt; ...</span>');
                        return;
                    }

                    let allMatched = true;
                    const remainingPasses = [...providedPasses];

                    for (const p of profiles) {
                        const idx = remainingPasses.indexOf(p.password || '');
                        if (idx >= 0) {
                            remainingPasses.splice(idx, 1);
                        } else {
                            allMatched = false;
                            break;
                        }
                    }

                    if (allMatched) {
                        localStorage.removeItem('jlep_solvers_data');
                        if (typeof updateNavProfile === 'function') updateNavProfile();
                        addTerminalLine('CRITICAL WIPE SUCCESSFUL. All solver profiles have been wiped from memory.');
                    } else {
                        addTerminalLine('<span class="cmd">ACCESS DENIED.</span> One or more passwords were incorrect.');
                    }
                } else {
                    const solver = getSolverData();
                    if (!solver) {
                        addTerminalLine('No solver registered. Use <span class="cmd">solvers register &lt;name&gt;</span> first.');
                        return;
                    }
                    if (args.length < 2) {
                        addTerminalLine('Usage: <span class="cmd">progress reset &lt;password&gt;</span>');
                        return;
                    }
                    const password = args.slice(1).join(' ');
                    if (solver.password && solver.password !== password) {
                        addTerminalLine('<span class="cmd">ERROR:</span> Incorrect password. Cannot reset progress.');
                        return;
                    }
                    solver.level = 'None';
                    solver.cleared = [];
                    saveSolverData(solver);
                    addTerminalLine('Progress for <span class="cmd">' + solver.name + '</span> has been reset.');
                }
            } else {
                addTerminalLine('Usage: <span class="cmd">progress</span>, <span class="cmd">progress reset &lt;password&gt;</span>, <span class="cmd">progress reset all &lt;pass1&gt; &lt;pass2&gt; ...</span>');
            }
            return;
        }


        if (base === 'secret') {
            const passcode = args.join(' ');
            if (!passcode) {
                addTerminalLine('Usage: <span class="cmd">secret &lt;passcode&gt;</span>');
                return;
            }
            if (passcode === 'verdict') {
                addTerminalLine('<span class="cmd">ACCESS GRANTED.</span>');
                addTerminalLine('You accessed a message sent by the admin.');
                addTerminalLine('Nothing here yet.');
                addTerminalLine('— JLEP System Administrator');
                playSound(120, 'sine', 0.5, 0.03);
            } else {
                addTerminalLine('<span class="cmd">ACCESS DENIED.</span> Invalid passcode.');
                playSound(80, 'sawtooth', 0.3, 0.04);
            }
            return;
        }

        if (commands[base]) {
            commands[base]();
        } else {
            addTerminalLine(`Unknown command: "${cmd}". Type <span class="cmd">help</span> for available commands.`);
            playSound(200, 'square', 0.15, 0.02);
        }
    }


    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
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

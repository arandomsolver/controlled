/**
 * Controlled Level Progress Tracker
 * Include this script on any level page to track solver progress.
 * 
 * Usage:
 *   1. Add <script src="../assets-main/level-tracker.js"></script> to your level page.
 *   2. Call ctldSolveLevel(levelNumber) when the solver completes the level.
 *      Example: ctldSolveLevel(1) — marks level 1 as solved and sets current level to 2.
 *   3. The solver's profile (registered via the terminal) is automatically updated.
 */

(function () {
    'use strict';

    function getStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('controlled_solvers_data'));
            return data && typeof data === 'object' && Array.isArray(data.profiles) ? data : { active: null, profiles: [] };
        } catch { return { active: null, profiles: [] }; }
    }

    function saveStorage(data) {
        localStorage.setItem('controlled_solvers_data', JSON.stringify(data));
    }

    function getSolverData() {
        const storage = getStorage();
        if (!storage.active) return null;
        return storage.profiles.find(p => p.name === storage.active) || null;
    }

    function saveSolverData(solverObj) {
        const storage = getStorage();
        const idx = storage.profiles.findIndex(p => p.name === solverObj.name);
        if (idx >= 0) {
            storage.profiles[idx] = solverObj;
        } else {
            storage.profiles.push(solverObj);
        }
        storage.active = solverObj.name;
        saveStorage(storage);
    }

    /**
     * Mark a level as solved and advance the current level.
     * @param {number} levelNumber - The level that was just solved (e.g. 1, 2, 3...)
     */
    window.ctldSolveLevel = function (levelNumber) {
        let solver = getSolverData();

        // If no solver registered, create a guest profile
        if (!solver) {
            solver = {
                name: 'Guest',
                level: 'None',
                cleared: [],
                registered: new Date().toLocaleDateString()
            };
        }

        // Add to cleared list if not already there
        if (!solver.cleared.includes(levelNumber)) {
            solver.cleared.push(levelNumber);
            solver.cleared.sort((a, b) => a - b);
        }

        // Update current level to the next one
        solver.level = levelNumber + 1;

        saveSolverData(solver);

        console.log(`%cControlled: Level ${levelNumber} solved!`, 'color: #ff3e3e; font-size: 14px; font-weight: bold;');
        console.log(`%cProgress saved. Current level: ${solver.level}`, 'color: #888; font-size: 12px;');
    };

    /**
     * Get the current solver's progress.
     * @returns {object|null} The solver data or null if not registered.
     */
    window.ctldGetProgress = function () {
        return getSolverData();
    };

    /**
     * Set the current level without marking anything as solved.
     * Useful for tracking which level the solver is currently on.
     * @param {number} levelNumber - The level the solver is currently on.
     */
    window.ctldSetCurrentLevel = function (levelNumber) {
        let solver = getSolverData();
        if (!solver) {
            solver = {
                name: 'Guest',
                level: levelNumber,
                cleared: [],
                registered: new Date().toLocaleDateString()
            };
        } else {
            solver.level = levelNumber;
        }
        saveSolverData(solver);
    };
    // Backward Compatibility Aliases
    window.jlepSolveLevel = window.ctldSolveLevel;
    window.jlepGetProgress = window.ctldGetProgress;
    window.jlepSetCurrentLevel = window.ctldSetCurrentLevel;
})();

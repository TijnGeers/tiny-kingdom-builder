// ============================================
// TINY KINGDOM BUILDER - Game Logic
// ============================================

const Game = {
    canvas: null,
    ctx: null,
    state: null,
    selectedBuilding: null,
    hoveredCell: null,
    hoveredIsland: null,
    bridgeMode: false,
    bridgeStart: null,
    camera: { x: 0, y: 0, zoom: 1 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 },
    animationFrame: null,
    particles: [],
    floatOffset: 0,
    windParticles: [],
    incomeTimer: 10,
    lastTimestamp: 0,
    dragon: null,
    trader: null,
    traderTimer: 0,
    placingIsland: false,
    muteNotifications: false,
    noChallenges: false,
};

// ============================================
// BUILDING DEFINITIONS
// ============================================
const BUILDINGS = {
    house: {
        name: 'Huis',
        icon: '🏠',
        cost: { gold: 20, wood: 15 },
        provides: { population: 2 },
        description: 'Huisvest 2 bewoners.',
        synergies: { market: '+3 goud', farm: '+1 voedsel' },
        penalties: { quarry: '-1 bevolking' },
        income: { food: -1 },
    },
    mansion: {
        name: 'Landhuis',
        icon: '🏰',
        cost: { gold: 60, wood: 30, stone: 20 },
        provides: { population: 5 },
        description: 'Huisvest 5 bewoners.',
        synergies: { market: '+5 goud', farm: '+2 voedsel' },
        penalties: { quarry: '-2 bevolking' },
        income: { food: -2 },
    },
    farm: {
        name: 'Boerderij',
        icon: '🌾',
        cost: { gold: 15, wood: 10 },
        provides: {},
        description: 'Produceert voedsel elke 10s.',
        synergies: { house: '+1 voedsel', windmill: '+3 voedsel' },
        penalties: { quarry: '-1 voedsel' },
        income: { food: 3 },
    },
    lumbermill: {
        name: 'Houtzagerij',
        icon: '🪓',
        cost: { gold: 25, stone: 10 },
        provides: {},
        description: 'Produceert hout elke 10s.',
        synergies: { house: '+1 hout' },
        penalties: { farm: '-1 voedsel' },
        income: { wood: 3 },
    },
    quarry: {
        name: 'Steengroeve',
        icon: '⛏️',
        cost: { gold: 30, wood: 15 },
        provides: {},
        description: 'Produceert steen elke 10s.',
        synergies: { workshop: '+2 steen' },
        penalties: { house: '-1 geluk', farm: '-1 voedsel' },
        income: { stone: 3 },
    },
    market: {
        name: 'Markt',
        icon: '🏪',
        cost: { gold: 40, wood: 20, stone: 10 },
        provides: {},
        description: 'Genereert goud elke 10s.',
        synergies: { house: '+2 goud', tavern: '+3 goud' },
        penalties: {},
        income: { gold: 5 },
    },
    tower: {
        name: 'Wachttoren',
        icon: '🗼',
        cost: { gold: 35, stone: 25 },
        provides: {},
        description: 'Beschermt eiland + verbonden eilanden tegen draken.',
        synergies: {},
        penalties: {},
        income: {},
        special: 'dragon_protection',
    },
    windmill: {
        name: 'Windmolen',
        icon: '🌀',
        cost: { gold: 30, wood: 20 },
        provides: {},
        description: 'Boost boerderijen ernaast.',
        synergies: { farm: '+3 voedsel' },
        penalties: {},
        income: { food: 1 },
    },
    tavern: {
        name: 'Taverne',
        icon: '🍺',
        cost: { gold: 35, wood: 15 },
        provides: { population: 1 },
        description: 'Trekt bewoners aan.',
        synergies: { market: '+2 goud', house: '+1 bevolking' },
        penalties: { tower: '-1 bescherming' },
        income: { gold: 2 },
    },
    workshop: {
        name: 'Werkplaats',
        icon: '🔨',
        cost: { gold: 45, wood: 20, stone: 15 },
        provides: {},
        description: 'Verbetert productie ernaast.',
        synergies: { quarry: '+2 steen', lumbermill: '+2 hout' },
        penalties: {},
        income: { gold: 1 },
    },
    temple: {
        name: 'Tempel',
        icon: '⛩️',
        cost: { gold: 60, stone: 30 },
        provides: {},
        description: 'Beschermt eiland + verbonden eilanden tegen wind.',
        synergies: {},
        penalties: {},
        income: { gold: 2 },
        special: 'wind_protection',
    },
    cow_stable: {
        name: 'Koeienstal',
        icon: '🐄',
        cost: { gold: 25, wood: 20 },
        provides: {},
        description: 'Geeft eten en leer.',
        synergies: { farm: '+2 voedsel', windmill: '+1 leer' },
        penalties: {},
        income: { food: 2, leather: 3 },
        special: null,
    },
    sheep_stable: {
        name: 'Schapenstal',
        icon: '🐑',
        cost: { gold: 25, wood: 20 },
        provides: {},
        description: 'Geeft eten en wol. Verhoogt kans op draakje aanvallen!',
        synergies: { farm: '+2 voedsel', windmill: '+1 wol' },
        penalties: {},
        income: { food: 2, wool: 3 },
        special: null,
    },
    smelterij: {
        name: 'Smelterij',
        icon: '🔥',
        cost: { gold: 40, stone: 25 },
        provides: {},
        description: 'Produceert ijzer uit steen. Bonus naast steengroeve en werkplaats.',
        synergies: { quarry: '+2 ijzer', workshop: '+1 ijzer' },
        penalties: {},
        income: { iron: 2 },
        special: null,
    },
    bakkerij: {
        name: 'Bakkerij',
        icon: '🍞',
        cost: { gold: 30, wood: 15 },
        provides: {},
        description: 'Zet voedsel om in goud. Bonus naast boerderij en huizen.',
        synergies: { farm: '+2 goud', house: '+1 goud', mansion: '+2 goud' },
        penalties: {},
        income: { gold: 3 },
        special: null,
    },
    bank: {
        name: 'Bank',
        icon: '🏦',
        cost: { gold: 80, stone: 40, iron: 10 },
        provides: {},
        description: 'Genereert 5% rente op je goud per tick (max +50). Verlies 20% goud als verwoest!',
        synergies: { market: '+rente', mansion: '+rente' },
        penalties: {},
        income: {},
        special: 'bank',
    },
    gildehuis: {
        name: 'Gildehuis',
        icon: '🏛️',
        cost: { gold: 60, wood: 20, stone: 20 },
        provides: {},
        description: 'Gebouwen ernaast krijgen +50% inkomen (min +1 per resource). +1 goud.',
        synergies: {},
        penalties: {},
        income: { gold: 1 },
        special: 'gildehuis',
    },
    haven: {
        name: 'Haven',
        icon: '⚓',
        cost: { gold: 45, wood: 30 },
        provides: {},
        description: 'Handelsschepen brengen random resources. Meer havens = meer handel.',
        synergies: { market: '+handel', warehouse: '+opslag' },
        penalties: {},
        income: { gold: 2 },
        special: 'haven',
    },
    veiling_huis: {
        name: 'Veiling Huis',
        icon: '🔔',
        cost: { gold: 55, wood: 20, stone: 15 },
        provides: {},
        description: 'Handelaar kans +15% per stuk (basis 10%). +2 goud naast markt.',
        synergies: { market: '+2 goud' },
        penalties: {},
        income: { gold: 1 },
        special: 'veiling_huis',
    },
    alchemist_lab: {
        name: 'Alchemist Lab',
        icon: '⚗️',
        cost: { gold: 70, stone: 30, scales: 5 },
        provides: {},
        description: 'Klik om resources om te zetten! Kost schubben. Naast drakenstal = sneller.',
        synergies: { dragon_stable: 'snellere conversie' },
        penalties: {},
        income: {},
        special: 'alchemist_lab',
    },
    wensput: {
        name: 'Wensput',
        icon: '🪙',
        cost: { gold: 35, stone: 20 },
        provides: {},
        description: 'Elke income tick een kans op random bonus resources of een negatief event.',
        synergies: {},
        penalties: {},
        income: {},
        special: 'wensput',
    },
    school: {
        name: 'School',
        icon: '📚',
        cost: { gold: 45, wood: 25 },
        provides: { population: 3 },
        description: 'Verhoogt max bevolking (+3) en versnelt income timer met 0.5s.',
        synergies: { house: '+1 pop', mansion: '+2 pop' },
        penalties: {},
        income: { gold: 1 },
        special: 'school',
    },
    monument: {
        name: 'Monument',
        icon: '🗿',
        cost: { gold: 100, stone: 50, iron: 15 },
        provides: {},
        description: '+10% goud bonus op dit eiland. Max 1 per eiland!',
        synergies: {},
        penalties: {},
        income: {},
        special: 'monument',
    },
    drakennest: {
        name: 'Drakennest',
        icon: '🪺',
        cost: { gold: 120, scales: 25, iron: 20 },
        provides: {},
        description: 'Broedt automatisch draakjes uit. Elke 5 min een nieuw draakje!',
        synergies: { dragon_stable: '+sneller broeden' },
        penalties: {},
        income: { scales: 3 },
        special: 'drakennest',
    },
    dragon_stable: {
        name: 'Drakenstal',
        icon: '🐲',
        cost: { gold: 50, wood: 30, stone: 20 },
        provides: {},
        description: '10% kans om een draakje te bevrienden bij een aanval!',
        synergies: { tower: '+bescherming' },
        penalties: {},
        income: {},
        special: 'dragon_stable',
    },
    bridge: {
        name: 'Brug',
        icon: '🌉',
        cost: { gold: 20, wood: 25 },
        provides: {},
        description: 'Verbindt eilanden. Deelt toren/tempel bescherming.',
        synergies: {},
        penalties: {},
        income: {},
        special: 'bridge',
    },
    new_island: {
        name: 'Nieuw Eiland',
        icon: '🏝️',
        cost: { gold: 50, stone: 20 },
        provides: {},
        description: 'Koop een nieuw zwevend eiland.',
        synergies: {},
        penalties: {},
        income: {},
        special: 'new_island',
    },
    demolish: {
        name: 'Slopen',
        icon: '🔴',
        cost: {},
        provides: {},
        description: 'Klik op een gebouw, brug of eiland om te slopen. Je krijgt resources terug.',
        synergies: {},
        penalties: {},
        income: {},
        special: 'demolish',
    },
};

// ============================================
// BOT SYSTEM
// ============================================
const BOT_NAMES = [
    { name: 'Koning Aldric', icon: '👑', personality: 'aggressive' },
    { name: 'Vrouwe Elara', icon: '👸', personality: 'defensive' },
    { name: 'Drakenlord Moros', icon: '🐲', personality: 'aggressive' },
    { name: 'Handelaar Finn', icon: '🧙', personality: 'peaceful' },
    { name: 'Kapitein Storm', icon: '⚓', personality: 'aggressive' },
    { name: 'Heks Ravenna', icon: '🔮', personality: 'defensive' },
    { name: 'Baron van Ijzer', icon: '⚔️', personality: 'aggressive' },
    { name: 'Priesteres Luna', icon: '🌙', personality: 'peaceful' },
];

function createBot(difficulty) {
    const template = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const mult = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.2 : 0.7;
    return {
        id: Math.random().toString(36).substr(2, 9),
        name: template.name,
        icon: template.icon,
        personality: template.personality,
        difficulty: difficulty,
        resources: {
            gold: Math.floor((40 + Math.random() * 60) * mult),
            wood: Math.floor((20 + Math.random() * 30) * mult),
            stone: Math.floor((15 + Math.random() * 25) * mult),
            food: Math.floor((20 + Math.random() * 30) * mult),
            iron: Math.floor(Math.random() * 10 * mult),
            wool: Math.floor(Math.random() * 10 * mult),
            leather: Math.floor(Math.random() * 10 * mult),
            scales: Math.floor(Math.random() * 5 * mult),
        },
        population: Math.floor((3 + Math.random() * 5) * mult),
        islands: 1 + Math.floor(Math.random() * 2 * mult),
        buildings: Math.floor((2 + Math.random() * 6) * mult),
        challengeCooldown: 0,
        lastChallengeTime: 0,
    };
}

function initBots() {
    if (!Game.state.bots || Game.state.bots.length === 0) {
        Game.state.bots = [
            createBot('easy'),
            createBot('easy'),
            createBot('medium'),
            createBot('medium'),
            createBot('hard'),
        ];
        // Ensure unique names
        const usedNames = new Set();
        for (const bot of Game.state.bots) {
            while (usedNames.has(bot.name)) {
                const template = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
                bot.name = template.name;
                bot.icon = template.icon;
                bot.personality = template.personality;
            }
            usedNames.add(bot.name);
        }
    }
}

function tickBots() {
    if (!Game.state.bots) return;
    for (const bot of Game.state.bots) {
        // Bots grow resources each income tick
        const growthMult = bot.difficulty === 'hard' ? 1.5 : bot.difficulty === 'medium' ? 1.0 : 0.6;
        bot.resources.gold += Math.floor((2 + Math.random() * 4) * growthMult);
        bot.resources.wood += Math.floor((1 + Math.random() * 3) * growthMult);
        bot.resources.stone += Math.floor((1 + Math.random() * 2) * growthMult);
        bot.resources.food += Math.floor((1 + Math.random() * 3) * growthMult);
        bot.resources.iron += Math.floor(Math.random() * 2 * growthMult);
        bot.resources.wool += Math.floor(Math.random() * 1.5 * growthMult);
        bot.resources.leather += Math.floor(Math.random() * 1.5 * growthMult);
        bot.resources.scales += Math.floor(Math.random() * 1 * growthMult);
        
        // Occasionally grow population and buildings
        if (Math.random() < 0.15 * growthMult) {
            bot.population += 1;
        }
        if (Math.random() < 0.08 * growthMult) {
            bot.buildings += 1;
        }
        if (Math.random() < 0.03 * growthMult && bot.islands < 5) {
            bot.islands += 1;
        }
        
        // Decrease challenge cooldown
        if (bot.challengeCooldown > 0) bot.challengeCooldown--;
    }
}

function tryBotChallenge() {
    if (Game.noChallenges) return;
    if (!Game.state.bots) return;
    // Random chance a bot challenges the player
    for (const bot of Game.state.bots) {
        if (bot.challengeCooldown > 0) continue;
        const isAggressive = bot.personality === 'aggressive';
        const chance = isAggressive ? 0.03 : 0.01;
        if (Math.random() < chance) {
            showBotInvite(bot);
            bot.challengeCooldown = 30; // Can't challenge again for 30 ticks (5 min)
            break; // Only one challenge per tick
        }
    }
}

function calculateBattleStrength(population, buildings, petDragons) {
    const base = population * 10 + buildings * 3 + (petDragons || 0) * 25;
    // Small random variance: ±5% of base strength
    const variance = base * 0.05 * (Math.random() * 2 - 1);
    return Math.max(1, base + variance);
}

function resolveBattle(bot) {
    const playerDragons = Game.state.petDragons ? Game.state.petDragons.length : 0;
    const playerStrength = calculateBattleStrength(
        Game.state.resources.population,
        Game.state.totalBuildings,
        playerDragons
    );
    const botStrength = calculateBattleStrength(
        bot.population,
        bot.buildings,
        0
    );
    
    const playerWins = playerStrength > botStrength;
    const results = [];
    
    if (playerWins) {
        // Player wins: get 25% of bot resources
        const loot = {};
        for (const [res, amount] of Object.entries(bot.resources)) {
            const take = Math.floor(amount * 0.25);
            if (take > 0) {
                loot[res] = take;
                bot.resources[res] -= take;
                Game.state.resources[res] = (Game.state.resources[res] || 0) + take;
            }
        }
        for (const [res, amount] of Object.entries(loot)) {
            const icons = { gold: '💰', wood: '🪵', stone: '🪨', food: '🌾', iron: '⚙️', wool: '🧶', leather: '👜', scales: '🐲' };
            results.push({ text: `+${amount} ${icons[res] || ''} ${res}`, negative: false });
        }
        // Bot loses some population/buildings
        bot.population = Math.max(1, bot.population - Math.floor(bot.population * 0.1));
        bot.buildings = Math.max(1, bot.buildings - 1);
    } else {
        // Player loses: bot takes 25% of player resources
        const loss = {};
        for (const res of ['gold', 'wood', 'stone', 'food', 'iron', 'wool', 'leather', 'scales']) {
            const amount = Game.state.resources[res] || 0;
            const take = Math.floor(amount * 0.25);
            if (take > 0) {
                loss[res] = take;
                Game.state.resources[res] -= take;
                bot.resources[res] += take;
            }
        }
        for (const [res, amount] of Object.entries(loss)) {
            const icons = { gold: '💰', wood: '🪵', stone: '🪨', food: '🌾', iron: '⚙️', wool: '🧶', leather: '👜', scales: '🐲' };
            results.push({ text: `-${amount} ${icons[res] || ''} ${res}`, negative: true });
        }
    }
    
    bot.challengeCooldown = 20;
    saveGame();
    updateUI();
    
    return { playerWins, results, playerStrength: Math.floor(playerStrength), botStrength: Math.floor(botStrength) };
}

// ============================================
// GAME STATE
// ============================================
function createInitialState() {
    return {
        resources: {
            gold: 100,
            wood: 50,
            stone: 30,
            food: 40,
            population: 5,
            scales: 0,
            wool: 0,
            leather: 0,
            iron: 0,
        },
        maxPopulation: 5,
        islands: [createIsland(0, 0, 'start')],
        bridges: [],
        windLevel: 0,
        dragonTimer: 0,
        totalBuildings: 0,
        petDragons: [],
        bots: [],
    };
}

function createIsland(x, y, type = 'normal') {
    const size = type === 'start' ? 4 : 3;
    const grid = [];
    
    for (let row = 0; row < size; row++) {
        grid[row] = [];
        for (let col = 0; col < size; col++) {
            grid[row][col] = null;
        }
    }
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        x: x,
        y: y,
        size: size,
        grid: grid,
        type: type,
        name: type === 'start' ? 'Hoofdeiland' : 'Eiland ' + Math.floor(Math.random() * 100),
        floatPhase: Math.random() * Math.PI * 2,
        hasTower: false,
        hasTemple: false,
    };
}

// ============================================
// SAVE / LOAD
// ============================================
Game.activeSlot = 0;

function getSaveKey(slot) {
    return `tiny-kingdom-save-${slot}`;
}

function getSaveSlotInfo() {
    const slots = [];
    for (let i = 0; i < 3; i++) {
        try {
            const raw = localStorage.getItem(getSaveKey(i));
            if (raw) {
                const data = JSON.parse(raw);
                slots.push({
                    name: data.slotName || `Save ${i + 1}`,
                    islands: data.state ? data.state.islands.length : 0,
                    gold: data.state ? Math.floor(data.state.resources.gold) : 0,
                    exists: true,
                });
            } else {
                slots.push({ name: `Save ${i + 1}`, exists: false });
            }
        } catch (e) {
            slots.push({ name: `Save ${i + 1}`, exists: false });
        }
    }
    return slots;
}

function saveGame() {
    if (!Game.state) return;
    const saveData = {
        state: Game.state,
        camera: Game.camera,
        incomeTimer: Game.incomeTimer,
        slotName: Game.slotName || `Save ${Game.activeSlot + 1}`,
    };
    try {
        localStorage.setItem(getSaveKey(Game.activeSlot), JSON.stringify(saveData));
        localStorage.setItem('tiny-kingdom-active-slot', Game.activeSlot);
    } catch (e) { /* ignore quota errors */ }
}

function loadGame(slot) {
    if (slot === undefined) slot = Game.activeSlot;
    try {
        const raw = localStorage.getItem(getSaveKey(slot));
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data && data.state && data.state.islands) {
            // Restore hasTower/hasTemple flags from grid contents
            for (const island of data.state.islands) {
                island.hasTower = false;
                island.hasTemple = false;
                for (let r = 0; r < island.size; r++) {
                    for (let c = 0; c < island.size; c++) {
                        const b = island.grid[r][c];
                        if (b === 'tower') island.hasTower = true;
                        if (b === 'temple') island.hasTemple = true;
                    }
                }
            }
            // Clean up orphaned pet dragons (stable no longer exists at that position)
            if (data.state.petDragons) {
                data.state.petDragons = data.state.petDragons.filter(p => {
                    const isl = data.state.islands.find(i => i.id === p.islandId);
                    return isl && isl.grid[p.row] && (isl.grid[p.row][p.col] === 'dragon_stable' || isl.grid[p.row][p.col] === 'drakennest');
                });
            }
            // Ensure new resources exist
            if (!data.state.resources.scales) data.state.resources.scales = 0;
            if (!data.state.resources.wool) data.state.resources.wool = 0;
            if (!data.state.resources.leather) data.state.resources.leather = 0;
            if (!data.state.resources.iron) data.state.resources.iron = 0;
            if (!data.state.petDragons) data.state.petDragons = [];
            if (!data.state.alchemistConversions) data.state.alchemistConversions = [];
            if (!data.state.nestTimers) data.state.nestTimers = {};
            if (!data.state.bots) data.state.bots = [];
            data.slotName = data.slotName || `Save ${slot + 1}`;
            return data;
        }
    } catch (e) { /* ignore parse errors */ }
    return null;
}

function loadSlot(slot) {
    const saved = loadGame(slot);
    if (saved) {
        Game.activeSlot = slot;
        localStorage.setItem('tiny-kingdom-active-slot', slot);
        Game.state = saved.state;
        Game.slotName = saved.slotName;
        Game.camera = saved.camera || { x: Game.canvas.width / 2, y: Game.canvas.height / 2, zoom: 1 };
        Game.incomeTimer = saved.incomeTimer || 10;
        Game.trader = null;
        Game.dragon = null;
        Game.lastTimestamp = performance.now();
        initBots();
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        resizeCanvas();
        updateUI();
        if (!Game.animationFrame) gameLoop();
        closeMenuPanel();
        showInfo(`✅ "${Game.slotName}" geladen!`);
    }
}

function newGameInSlot(slot) {
    Game.activeSlot = slot;
    const name = prompt('Geef je save een naam:', `Save ${slot + 1}`);
    Game.slotName = (name && name.trim()) ? name.trim() : `Save ${slot + 1}`;
    startGame();
    closeMenuPanel();
}

function deleteSlot(slot) {
    const info = getSaveSlotInfo()[slot];
    if (!info.exists) return;
    if (!confirm(`Weet je zeker dat je "${info.name}" wilt verwijderen?`)) return;
    localStorage.removeItem(getSaveKey(slot));
    if (Game.activeSlot === slot) {
        // If deleting active slot, go back to title
        Game.state = null;
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
        if (Game.animationFrame) {
            cancelAnimationFrame(Game.animationFrame);
            Game.animationFrame = null;
        }
    }
    renderMenuPanel();
}

function renameSlot(slot) {
    const info = getSaveSlotInfo()[slot];
    if (!info.exists) return;
    const name = prompt('Nieuwe naam:', info.name);
    if (name && name.trim()) {
        try {
            const raw = localStorage.getItem(getSaveKey(slot));
            if (raw) {
                const data = JSON.parse(raw);
                data.slotName = name.trim();
                localStorage.setItem(getSaveKey(slot), JSON.stringify(data));
                if (Game.activeSlot === slot) Game.slotName = name.trim();
            }
        } catch (e) {}
        renderMenuPanel();
    }
}

function toggleMenuPanel() {
    const panel = document.getElementById('menu-panel');
    if (panel.classList.contains('hidden')) {
        renderMenuPanel();
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}

function closeMenuPanel() {
    document.getElementById('menu-panel').classList.add('hidden');
}

function renderMenuPanel() {
    const list = document.getElementById('save-slots');
    list.innerHTML = '';
    const slots = getSaveSlotInfo();
    
    for (let i = 0; i < 3; i++) {
        const slot = slots[i];
        const isActive = Game.state && Game.activeSlot === i;
        const div = document.createElement('div');
        div.className = 'save-slot' + (isActive ? ' active' : '');
        
        if (slot.exists) {
            div.innerHTML = `
                <div class="slot-info">
                    <span class="slot-name">${slot.name}${isActive ? ' ⬅' : ''}</span>
                    <span class="slot-details">🏝️${slot.islands} eilanden • 💰${slot.gold}</span>
                </div>
                <div class="slot-buttons">
                    <button class="btn-slot btn-load" data-slot="${i}">Laden</button>
                    <button class="btn-slot btn-rename" data-slot="${i}">✏️</button>
                    <button class="btn-slot btn-delete" data-slot="${i}">🗑️</button>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="slot-info">
                    <span class="slot-name">Leeg</span>
                    <span class="slot-details">Geen save</span>
                </div>
                <div class="slot-buttons">
                    <button class="btn-slot btn-new" data-slot="${i}">Nieuw Spel</button>
                </div>
            `;
        }
        
        list.appendChild(div);
    }
    
    // Attach event listeners
    list.querySelectorAll('.btn-load').forEach(btn => {
        btn.addEventListener('click', () => loadSlot(parseInt(btn.dataset.slot)));
    });
    list.querySelectorAll('.btn-new').forEach(btn => {
        btn.addEventListener('click', () => newGameInSlot(parseInt(btn.dataset.slot)));
    });
    list.querySelectorAll('.btn-rename').forEach(btn => {
        btn.addEventListener('click', () => renameSlot(parseInt(btn.dataset.slot)));
    });
    list.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteSlot(parseInt(btn.dataset.slot)));
    });
    
    // Settings toggles
    const settingsDiv = document.getElementById('menu-settings');
    if (settingsDiv) {
        settingsDiv.innerHTML = `
            <div class="menu-toggle">
                <label>
                    <input type="checkbox" id="toggle-mute" ${Game.muteNotifications ? 'checked' : ''}>
                    🔕 Meldingen uit
                </label>
            </div>
            <div class="menu-toggle">
                <label>
                    <input type="checkbox" id="toggle-no-challenge" ${Game.noChallenges ? 'checked' : ''}>
                    🛡️ Uitdagingen blokkeren
                </label>
            </div>
        `;
        document.getElementById('toggle-mute').addEventListener('change', (e) => {
            Game.muteNotifications = e.target.checked;
            localStorage.setItem('tkb-mute-notifications', Game.muteNotifications);
        });
        document.getElementById('toggle-no-challenge').addEventListener('change', (e) => {
            Game.noChallenges = e.target.checked;
            localStorage.setItem('tkb-no-challenges', Game.noChallenges);
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    Game.canvas = document.getElementById('game-canvas');
    Game.ctx = Game.canvas.getContext('2d');
    
    // Load settings from localStorage
    Game.muteNotifications = localStorage.getItem('tkb-mute-notifications') === 'true';
    Game.noChallenges = localStorage.getItem('tkb-no-challenges') === 'true';
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    document.getElementById('start-btn').addEventListener('click', () => {
        // From title screen: show menu to pick a slot
        toggleMenuPanel();
    });
    document.getElementById('event-ok').addEventListener('click', closeEventModal);
    document.getElementById('menu-btn').addEventListener('click', toggleMenuPanel);
    
    setupCanvasEvents();
    renderBuildingMenu();
    
    // Auto-load: load last active slot, or first available
    const rawSlot = localStorage.getItem('tiny-kingdom-active-slot');
    const lastSlot = rawSlot !== null ? parseInt(rawSlot) : 0;
    console.log('[INIT] rawSlot from localStorage:', rawSlot, '→ lastSlot:', lastSlot);
    const slotOrder = [lastSlot, ...([0, 1, 2].filter(s => s !== lastSlot))];
    console.log('[INIT] slotOrder:', slotOrder);
    for (const i of slotOrder) {
        const saved = loadGame(i);
        console.log('[INIT] trying slot', i, '→', saved ? 'FOUND' : 'empty');
        if (saved) {
            Game.activeSlot = i;
            localStorage.setItem('tiny-kingdom-active-slot', i);
            Game.state = saved.state;
            Game.slotName = saved.slotName;
            Game.camera = saved.camera || { x: Game.canvas.width / 2, y: Game.canvas.height / 2, zoom: 1 };
            Game.incomeTimer = saved.incomeTimer || 10;
            Game.lastTimestamp = performance.now();
            initBots();
            document.getElementById('title-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            resizeCanvas();
            updateUI();
            gameLoop();
            console.log('[INIT] Loaded slot', i, '- name:', saved.slotName);
            showInfo(`📂 Slot ${i + 1}: "${saved.slotName}" geladen`);
            break;
        }
    }

    // Migrate old single save to slot 0
    if (!Game.state) {
        try {
            const oldRaw = localStorage.getItem('tiny-kingdom-save');
            if (oldRaw) {
                localStorage.setItem(getSaveKey(0), oldRaw);
                localStorage.removeItem('tiny-kingdom-save');
                location.reload();
                return;
            }
        } catch (e) {}
    }
}

function resizeCanvas() {
    const area = document.getElementById('game-area');
    Game.canvas.width = area.clientWidth;
    Game.canvas.height = area.clientHeight;
}

function startGame() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    resizeCanvas();
    
    Game.state = createInitialState();
    Game.camera = { x: Game.canvas.width / 2, y: Game.canvas.height / 2, zoom: 1 };
    Game.incomeTimer = 10;
    Game.lastTimestamp = performance.now();
    initBots();
    
    saveGame();
    updateUI();
    gameLoop();
}

// ============================================
// CANVAS EVENTS
// ============================================
function setupCanvasEvents() {
    const canvas = Game.canvas;
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.button === 2) {
            Game.isDragging = true;
            Game.dragStart = { x: e.clientX, y: e.clientY };
        } else if (e.button === 0) {
            handleClick(e);
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (Game.isDragging) {
            const dx = e.clientX - Game.dragStart.x;
            const dy = e.clientY - Game.dragStart.y;
            Game.camera.x += dx;
            Game.camera.y += dy;
            Game.dragStart = { x: e.clientX, y: e.clientY };
        }
        Game.lastMouse = { x: e.clientX, y: e.clientY };
        updateHover(e);
    });
    
    canvas.addEventListener('mouseup', () => {
        Game.isDragging = false;
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = Game.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const oldZoom = Game.camera.zoom;
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        Game.camera.zoom = Math.max(0.2, Math.min(3, Game.camera.zoom * zoomFactor));
        
        // Zoom towards mouse position
        const zoomChange = Game.camera.zoom / oldZoom;
        Game.camera.x = mx - (mx - Game.camera.x) * zoomChange;
        Game.camera.y = my - (my - Game.camera.y) * zoomChange;
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // ---- TOUCH EVENTS (mobile) ----
    let touchStartPos = null;
    let touchStartTime = 0;
    let lastTouchDist = 0;
    let isTouchDragging = false;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            const t = e.touches[0];
            touchStartPos = { x: t.clientX, y: t.clientY };
            touchStartTime = Date.now();
            isTouchDragging = false;
            Game.dragStart = { x: t.clientX, y: t.clientY };
        } else if (e.touches.length === 2) {
            // Pinch start
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            isTouchDragging = true;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && touchStartPos) {
            const t = e.touches[0];
            const dx = t.clientX - Game.dragStart.x;
            const dy = t.clientY - Game.dragStart.y;
            const totalDx = t.clientX - touchStartPos.x;
            const totalDy = t.clientY - touchStartPos.y;
            const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
            
            if (totalDist > 10) {
                isTouchDragging = true;
            }
            
            if (isTouchDragging) {
                Game.camera.x += dx;
                Game.camera.y += dy;
                Game.dragStart = { x: t.clientX, y: t.clientY };
            }
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (lastTouchDist > 0) {
                const rect = Game.canvas.getBoundingClientRect();
                const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                
                const oldZoom = Game.camera.zoom;
                const scale = dist / lastTouchDist;
                Game.camera.zoom = Math.max(0.2, Math.min(3, Game.camera.zoom * scale));
                
                const zoomChange = Game.camera.zoom / oldZoom;
                Game.camera.x = mx - (mx - Game.camera.x) * zoomChange;
                Game.camera.y = my - (my - Game.camera.y) * zoomChange;
            }
            lastTouchDist = dist;
            isTouchDragging = true;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!isTouchDragging && touchStartPos && e.changedTouches.length === 1) {
            const t = e.changedTouches[0];
            // Simulate click
            handleClick({ clientX: t.clientX, clientY: t.clientY });
        }
        if (e.touches.length === 0) {
            touchStartPos = null;
            isTouchDragging = false;
            lastTouchDist = 0;
        }
    }, { passive: false });
}

function handleClick(e) {
    const rect = Game.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const worldPos = screenToWorld(mx, my);
    
    // Island placement mode
    if (Game.placingIsland) {
        placeIslandAt(worldPos.x, worldPos.y);
        return;
    }
    
    if (Game.bridgeMode) {
        const island = getIslandAt(worldPos.x, worldPos.y);
        if (island) {
            if (!Game.bridgeStart) {
                Game.bridgeStart = island;
                showInfo('Klik op een tweede eiland om de brug te verbinden.');
            } else if (island.id !== Game.bridgeStart.id) {
                buildBridge(Game.bridgeStart, island);
                Game.bridgeMode = false;
                Game.bridgeStart = null;
            }
        }
        return;
    }
    
    if (Game.selectedBuilding) {
        // Special actions
        if (Game.selectedBuilding === 'bridge') {
            toggleBridgeMode();
            return;
        }
        if (Game.selectedBuilding === 'new_island') {
            buyNewIsland();
            return;
        }
        if (Game.selectedBuilding === 'demolish') {
            handleDemolish(worldPos);
            return;
        }
        
        const result = getCellAt(worldPos.x, worldPos.y);
        if (result) {
            // If clicking on an existing alchemist lab, open it instead of trying to place
            if (result.island.grid[result.row][result.col] === 'alchemist_lab') {
                openAlchemistLab(result.island, result.row, result.col);
                return;
            }
            placeBuilding(result.island, result.row, result.col);
        }
    } else {
        // Check if clicking on trader
        if (isClickOnTrader(worldPos.x, worldPos.y)) {
            openTraderShop();
            return;
        }
        // No building selected - check for interactive buildings or show info
        const result = getCellAt(worldPos.x, worldPos.y);
        if (result && result.island.grid[result.row][result.col]) {
            const clickedType = result.island.grid[result.row][result.col];
            if (clickedType === 'alchemist_lab') {
                openAlchemistLab(result.island, result.row, result.col);
                return;
            }
            showBuildingInfo(clickedType);
        } else {
            const island = getIslandAt(worldPos.x, worldPos.y);
            if (island) {
                const newName = prompt('Geef je eiland een naam:', island.name || 'Eiland');
                if (newName && newName.trim()) {
                    island.name = newName.trim();
                    // Easter egg
                    if (island.type === 'start' && island.name.toUpperCase() === 'TACOLAND') {
                        Game.state.resources.gold += 10000;
                        Game.state.resources.wood += 10000;
                        Game.state.resources.stone += 10000;
                        Game.state.resources.food += 10000;
                        showInfo('🌮 TACOLAND ACTIVATED! +10000 van alles!');
                        updateUI();
                    }
                    saveGame();
                }
            }
        }
    }
}

function updateHover(e) {
    const rect = Game.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldPos = screenToWorld(mx, my);
    
    Game.hoveredCell = getCellAt(worldPos.x, worldPos.y);
    Game.hoveredIsland = getIslandAt(worldPos.x, worldPos.y);
}

function screenToWorld(sx, sy) {
    return {
        x: (sx - Game.camera.x) / Game.camera.zoom,
        y: (sy - Game.camera.y) / Game.camera.zoom,
    };
}

function worldToScreen(wx, wy) {
    return {
        x: wx * Game.camera.zoom + Game.camera.x,
        y: wy * Game.camera.zoom + Game.camera.y,
    };
}

// ============================================
// ISLAND & CELL DETECTION
// ============================================
const CELL_SIZE = 44;
const ISLAND_PADDING = 30;

function getIslandScreenPos(island) {
    const totalSize = island.size * CELL_SIZE + ISLAND_PADDING * 2;
    const baseX = island.x * 320;
    const baseY = island.y * 320;
    const floatY = Math.sin(Game.floatOffset + island.floatPhase) * 4;
    return { x: baseX, y: baseY + floatY, width: totalSize, height: totalSize };
}

function getIslandAt(wx, wy) {
    for (const island of Game.state.islands) {
        const pos = getIslandScreenPos(island);
        if (wx >= pos.x - pos.width / 2 && wx <= pos.x + pos.width / 2 &&
            wy >= pos.y - pos.height / 2 && wy <= pos.y + pos.height / 2) {
            return island;
        }
    }
    return null;
}

function getCellAt(wx, wy) {
    for (const island of Game.state.islands) {
        const pos = getIslandScreenPos(island);
        const startX = pos.x - (island.size * CELL_SIZE) / 2;
        const startY = pos.y - (island.size * CELL_SIZE) / 2;
        
        const col = Math.floor((wx - startX) / CELL_SIZE);
        const row = Math.floor((wy - startY) / CELL_SIZE);
        
        if (row >= 0 && row < island.size && col >= 0 && col < island.size) {
            return { island, row, col };
        }
    }
    return null;
}

// ============================================
// BUILDING SYSTEM
// ============================================
function getBuildingCost(type) {
    const building = BUILDINGS[type];
    if (!building || !building.cost) return {};
    // Count how many of this type exist already
    let count = 0;
    for (const island of Game.state.islands) {
        for (let r = 0; r < island.size; r++) {
            for (let c = 0; c < island.size; c++) {
                if (island.grid[r][c] === type) count++;
            }
        }
    }
    const multiplier = 1 + count * 0.25;
    const scaled = {};
    for (const [res, amount] of Object.entries(building.cost)) {
        scaled[res] = Math.floor(amount * multiplier);
    }
    return scaled;
}

function placeBuilding(island, row, col) {
    if (!Game.selectedBuilding) return;
    if (island.grid[row][col] !== null) {
        showInfo('❌ Deze plek is al bezet!');
        return;
    }
    
    // Monument: max 1 per island
    if (Game.selectedBuilding === 'monument') {
        for (let r = 0; r < island.size; r++) {
            for (let c = 0; c < island.size; c++) {
                if (island.grid[r][c] === 'monument') {
                    showInfo('❌ Er kan maar 1 monument per eiland staan!');
                    return;
                }
            }
        }
    }
    
    const building = BUILDINGS[Game.selectedBuilding];
    const scaledCost = getBuildingCost(Game.selectedBuilding);
    if (!canAfford(scaledCost)) {
        showInfo('❌ Niet genoeg resources!');
        return;
    }
    
    // Deduct scaled cost
    for (const [res, amount] of Object.entries(scaledCost)) {
        Game.state.resources[res] -= amount;
    }
    
    // Place building
    island.grid[row][col] = Game.selectedBuilding;
    Game.state.totalBuildings++;
    
    // Apply provides
    if (building.provides.population) {
        Game.state.maxPopulation += building.provides.population;
        Game.state.resources.population = Math.min(
            Game.state.resources.population + building.provides.population,
            Game.state.maxPopulation
        );
    }
    
    // Track specials
    if (building.special === 'dragon_protection') island.hasTower = true;
    if (building.special === 'wind_protection') island.hasTemple = true;
    
    // Particles
    const pos = getIslandScreenPos(island);
    const cellX = pos.x - (island.size * CELL_SIZE) / 2 + col * CELL_SIZE + CELL_SIZE / 2;
    const cellY = pos.y - (island.size * CELL_SIZE) / 2 + row * CELL_SIZE + CELL_SIZE / 2;
    spawnParticles(cellX, cellY, '#88ff88', 8);
    
    // Calculate and show synergy info
    const synergies = calculateSynergies(island, row, col);
    if (synergies.length > 0) {
        showInfo('✨ Synergieën: ' + synergies.join(', '));
    } else {
        showInfo(`✅ ${building.name} geplaatst!`);
    }
    
    saveGame();
    updateUI();
}

function canAfford(cost) {
    for (const [res, amount] of Object.entries(cost)) {
        if ((Game.state.resources[res] || 0) < amount) return false;
    }
    return true;
}

function calculateSynergies(island, row, col) {
    const buildingType = island.grid[row][col];
    const building = BUILDINGS[buildingType];
    const neighbors = getNeighbors(island, row, col);
    const synergies = [];
    
    for (const neighbor of neighbors) {
        if (building.synergies[neighbor]) {
            synergies.push(`${BUILDINGS[neighbor].icon} ${building.synergies[neighbor]}`);
        }
    }
    
    return synergies;
}

function getNeighbors(island, row, col) {
    const neighbors = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < island.size && nc >= 0 && nc < island.size) {
            if (island.grid[nr][nc]) {
                neighbors.push(island.grid[nr][nc]);
            }
        }
    }
    
    return neighbors;
}

function calculateIncome() {
    const income = { gold: 0, wood: 0, stone: 0, food: 0, scales: 0, wool: 0, leather: 0, iron: 0 };
    
    for (const island of Game.state.islands) {
        for (let r = 0; r < island.size; r++) {
            for (let c = 0; c < island.size; c++) {
                const type = island.grid[r][c];
                if (!type) continue;
                
                const building = BUILDINGS[type];
                
                // Base income
                for (const [res, amount] of Object.entries(building.income || {})) {
                    income[res] += amount;
                }
                
                // Synergy bonuses
                const neighbors = getNeighbors(island, r, c);
                for (const neighbor of neighbors) {
                    if (type === 'farm' && neighbor === 'windmill') income.food += 2;
                    if (type === 'farm' && neighbor === 'house') income.food += 1;
                    if (type === 'farm' && neighbor === 'mansion') income.food += 2;
                    if (type === 'market' && neighbor === 'house') income.gold += 2;
                    if (type === 'market' && neighbor === 'mansion') income.gold += 5;
                    if (type === 'market' && neighbor === 'tavern') income.gold += 2;
                    if (type === 'lumbermill' && neighbor === 'workshop') income.wood += 1;
                    if (type === 'quarry' && neighbor === 'workshop') income.stone += 1;
                    if (type === 'tavern' && neighbor === 'market') income.gold += 1;
                    if (type === 'sheep_stable' && neighbor === 'farm') income.food += 2;
                    if (type === 'sheep_stable' && neighbor === 'windmill') income.wool += 1;
                    if (type === 'cow_stable' && neighbor === 'farm') income.food += 2;
                    if (type === 'cow_stable' && neighbor === 'windmill') income.leather += 1;
                    if (type === 'smelterij' && neighbor === 'quarry') income.iron += 2;
                    if (type === 'smelterij' && neighbor === 'workshop') income.iron += 1;
                    if (type === 'bakkerij' && neighbor === 'farm') income.gold += 2;
                    if (type === 'bakkerij' && neighbor === 'house') income.gold += 1;
                    if (type === 'bakkerij' && neighbor === 'mansion') income.gold += 2;
                    if (type === 'veiling_huis' && neighbor === 'market') income.gold += 2;
                    // alchemist_lab is interactive - no passive synergy
                }
                
                // Gildehuis bonus: +50% income for buildings adjacent to gildehuis (minimum +1)
                if (neighbors.includes('gildehuis') && building.income) {
                    for (const [res, amount] of Object.entries(building.income)) {
                        if (amount > 0) income[res] += Math.max(1, Math.floor(amount * 0.5));
                    }
                }
                
                // Penalties
                for (const neighbor of neighbors) {
                    if (type === 'farm' && neighbor === 'quarry') income.food -= 1;
                    if (type === 'lumbermill' && neighbor === 'farm') income.food -= 1;
                }
            }
        }
    }
    
    // Population food consumption
    income.food -= Math.floor(Game.state.resources.population * 0.5);
    
    // Base gold income from population (people work and produce gold)
    income.gold += Math.max(1, Math.floor(Game.state.resources.population * 0.5));
    
    // Pet dragons produce scales (2 per dragon)
    if (Game.state.petDragons) {
        income.scales += Game.state.petDragons.length * 2;
    }
    
    return income;
}

// ============================================
// BRIDGES
// ============================================
function buildBridge(island1, island2) {
    const existingBridge = Game.state.bridges.find(
        b => (b.from === island1.id && b.to === island2.id) ||
             (b.from === island2.id && b.to === island1.id)
    );
    
    if (existingBridge) {
        showInfo('❌ Er is al een brug tussen deze eilanden!');
        return;
    }
    
    const cost = { gold: 20, wood: 25 };
    if (!canAfford(cost)) {
        showInfo('❌ Niet genoeg resources! (20💰 + 25🪵)');
        return;
    }
    
    Game.state.resources.gold -= cost.gold;
    Game.state.resources.wood -= cost.wood;
    
    Game.state.bridges.push({
        id: Math.random().toString(36).substr(2, 9),
        from: island1.id,
        to: island2.id,
        health: 100,
    });
    
    showInfo('🌉 Brug gebouwd! Kwetsbaar voor wind - bouw tempels ter bescherming.');
    saveGame();
    updateUI();
}

function toggleBridgeMode() {
    Game.bridgeMode = !Game.bridgeMode;
    Game.bridgeStart = null;
    
    if (Game.bridgeMode) {
        showInfo('🌉 Brug modus: Klik op twee eilanden om ze te verbinden.');
    } else {
        showInfo('Brug modus uitgeschakeld.');
    }
}

// ============================================
// NEW ISLANDS
// ============================================
function getIslandCost() {
    const numIslands = Game.state.islands.length;
    const multiplier = 1 + (numIslands - 1) * 0.4;
    return {
        gold: Math.floor(50 * multiplier),
        stone: Math.floor(20 * multiplier),
    };
}

function buyNewIsland() {
    const cost = getIslandCost();
    if (!canAfford(cost)) {
        showInfo(`❌ Niet genoeg resources! (${cost.gold}💰 + ${cost.stone}🪨)`);
        return;
    }
    
    // Enter island placement mode
    Game.placingIsland = true;
    showInfo(`🏝️ Klik ergens op een lege plek om je eiland te plaatsen! (${cost.gold}💰 + ${cost.stone}🪨)`);
}

function placeIslandAt(worldX, worldY) {
    const cost = getIslandCost();
    
    // Convert world position to grid position (snap to grid)
    const gridX = Math.round(worldX / 320);
    const gridY = Math.round(worldY / 320);
    
    // Check if position is already taken
    const usedPositions = Game.state.islands.map(i => `${i.x},${i.y}`);
    if (usedPositions.includes(`${gridX},${gridY}`)) {
        showInfo('❌ Hier staat al een eiland!');
        return;
    }
    
    // Deduct cost
    Game.state.resources.gold -= cost.gold;
    Game.state.resources.stone -= cost.stone;
    
    const newIsland = createIsland(gridX, gridY, 'normal');
    Game.state.islands.push(newIsland);
    
    Game.placingIsland = false;
    showInfo('🏝️ Nieuw eiland geplaatst!');
    saveGame();
    updateUI();
}

// ============================================
// DEMOLISH SYSTEM
// ============================================
function handleDemolish(worldPos) {
    // 1. Try to demolish a building on a cell
    const cell = getCellAt(worldPos.x, worldPos.y);
    if (cell && cell.island.grid[cell.row][cell.col]) {
        demolishBuilding(cell.island, cell.row, cell.col);
        return;
    }
    
    // 2. Try to demolish a bridge (click near midpoint)
    for (const bridge of Game.state.bridges) {
        const fromIsland = Game.state.islands.find(i => i.id === bridge.from);
        const toIsland = Game.state.islands.find(i => i.id === bridge.to);
        if (!fromIsland || !toIsland) continue;
        
        const fromPos = getIslandScreenPos(fromIsland);
        const toPos = getIslandScreenPos(toIsland);
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        const dist = Math.sqrt((worldPos.x - midX) ** 2 + (worldPos.y - midY) ** 2);
        
        if (dist < 30) {
            demolishBridge(bridge);
            return;
        }
    }
    
    // 3. Try to demolish an empty island (not the start island)
    const island = getIslandAt(worldPos.x, worldPos.y);
    if (island && island.type !== 'start') {
        demolishIsland(island);
        return;
    }
    
    showInfo('🔴 Klik op een gebouw, brug of leeg eiland om te slopen.');
}

function demolishBuilding(island, row, col) {
    const type = island.grid[row][col];
    const building = BUILDINGS[type];
    
    // Refund resources
    for (const [res, amount] of Object.entries(building.cost)) {
        Game.state.resources[res] += amount;
    }
    
    // Remove population if building provided it
    if (building.provides.population) {
        Game.state.maxPopulation -= building.provides.population;
        Game.state.resources.population = Math.min(Game.state.resources.population, Game.state.maxPopulation);
    }
    
    // Remove pet dragons if demolishing a dragon stable or drakennest
    if ((type === 'dragon_stable' || type === 'drakennest') && Game.state.petDragons) {
        Game.state.petDragons = Game.state.petDragons.filter(
            p => !(p.islandId === island.id && p.row === row && p.col === col)
        );
    }
    
    // Bank penalty: lose 20% gold when demolished
    if (type === 'bank') {
        const loss = Math.floor(Game.state.resources.gold * 0.2);
        Game.state.resources.gold -= loss;
        showEventModal('🏦 Bank Verwoest!', 'Je verliest een deel van je spaargeld!', [{ text: `-${loss} goud`, negative: true }]);
    }
    
    // Clear drakennest timer
    if (type === 'drakennest' && Game.state.nestTimers) {
        const key = `${island.id}_${row}_${col}`;
        delete Game.state.nestTimers[key];
    }
    
    // Clear specials
    if (building.special === 'dragon_protection') island.hasTower = false;
    if (building.special === 'wind_protection') island.hasTemple = false;
    
    // Re-check if island still has tower/temple (might have multiple)
    for (let r = 0; r < island.size; r++) {
        for (let c = 0; c < island.size; c++) {
            if (r === row && c === col) continue;
            const b = island.grid[r][c];
            if (b === 'tower') island.hasTower = true;
            if (b === 'temple') island.hasTemple = true;
        }
    }
    
    // Particles
    const pos = getIslandScreenPos(island);
    const cellX = pos.x - (island.size * CELL_SIZE) / 2 + col * CELL_SIZE + CELL_SIZE / 2;
    const cellY = pos.y - (island.size * CELL_SIZE) / 2 + row * CELL_SIZE + CELL_SIZE / 2;
    spawnParticles(cellX, cellY, '#ff6644', 10);
    
    island.grid[row][col] = null;
    Game.state.totalBuildings--;
    
    showInfo(`🔴 ${building.name} gesloopt! Resources teruggekregen.`);
    saveGame();
    updateUI();
}

function demolishBridge(bridge) {
    // Refund bridge cost
    Game.state.resources.gold += 20;
    Game.state.resources.wood += 25;
    
    Game.state.bridges = Game.state.bridges.filter(b => b.id !== bridge.id);
    
    showInfo('🔴 Brug gesloopt! 20💰 + 25🪵 teruggekregen.');
    saveGame();
    updateUI();
}

function demolishIsland(island) {
    // Check if island has buildings on it
    let hasBuildings = false;
    for (let r = 0; r < island.size; r++) {
        for (let c = 0; c < island.size; c++) {
            if (island.grid[r][c]) {
                hasBuildings = true;
                break;
            }
        }
        if (hasBuildings) break;
    }
    
    if (hasBuildings) {
        showInfo('❌ Sloop eerst alle gebouwen op dit eiland!');
        return;
    }
    
    // Remove all bridges connected to this island
    const connectedBridges = Game.state.bridges.filter(
        b => b.from === island.id || b.to === island.id
    );
    for (const bridge of connectedBridges) {
        Game.state.resources.gold += 20;
        Game.state.resources.wood += 25;
    }
    Game.state.bridges = Game.state.bridges.filter(
        b => b.from !== island.id && b.to !== island.id
    );
    
    // Refund island cost
    Game.state.resources.gold += 50;
    Game.state.resources.stone += 20;
    
    Game.state.islands = Game.state.islands.filter(i => i.id !== island.id);
    
    const bridgeRefund = connectedBridges.length > 0 ? ` + ${connectedBridges.length} brug(gen)` : '';
    showInfo(`🔴 Eiland gesloopt${bridgeRefund}! Resources teruggekregen.`);
    saveGame();
    updateUI();
}

// ============================================
// INCOME TIMER (every 10 seconds)
// ============================================
function tickIncome(dt) {
    // Schools speed up income timer (+0.5s speed per school)
    let schoolCount = 0;
    if (Game.state) {
        for (const isl of Game.state.islands) {
            for (let r = 0; r < isl.size; r++) {
                for (let c = 0; c < isl.size; c++) {
                    if (isl.grid[r][c] === 'school') schoolCount++;
                }
            }
        }
    }
    const speedMultiplier = 1 + schoolCount * 0.05;
    Game.incomeTimer -= dt * speedMultiplier;
    
    if (Game.incomeTimer <= 0) {
        Game.incomeTimer = 10;
        collectIncome();
    }
}

function collectIncome() {
    const income = calculateIncome();
    Game.state.resources.gold += income.gold;
    Game.state.resources.wood += income.wood;
    Game.state.resources.stone += income.stone;
    Game.state.resources.food += income.food;
    Game.state.resources.scales = (Game.state.resources.scales || 0) + income.scales;
    Game.state.resources.wool = (Game.state.resources.wool || 0) + income.wool;
    Game.state.resources.leather = (Game.state.resources.leather || 0) + income.leather;
    Game.state.resources.iron = (Game.state.resources.iron || 0) + income.iron;
    
    // Clamp resources (don't go below 0)
    Game.state.resources.gold = Math.max(0, Game.state.resources.gold);
    Game.state.resources.wood = Math.max(0, Game.state.resources.wood);
    Game.state.resources.stone = Math.max(0, Game.state.resources.stone);
    Game.state.resources.food = Math.max(0, Game.state.resources.food);
    Game.state.resources.scales = Math.max(0, Game.state.resources.scales);
    Game.state.resources.wool = Math.max(0, Game.state.resources.wool);
    Game.state.resources.leather = Math.max(0, Game.state.resources.leather);
    Game.state.resources.iron = Math.max(0, Game.state.resources.iron);
    
    // Bank interest
    let bankCount = 0;
    for (const isl of Game.state.islands) {
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'bank') bankCount++;
            }
        }
    }
    if (bankCount > 0) {
        const interest = Math.min(50 * bankCount, Math.floor(Game.state.resources.gold * 0.05 * bankCount));
        Game.state.resources.gold += interest;
        if (interest > 0) showEventModal('🏦 Bank Rente', `Je banken genereren rente!`, [{ text: `+${interest} goud`, negative: false }]);
    }
    
    // Haven random resources
    let havenCount = 0;
    for (const isl of Game.state.islands) {
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'haven') havenCount++;
            }
        }
    }
    for (let h = 0; h < havenCount; h++) {
        const roll = Math.random();
        if (roll < 0.5) {
            const resources = ['wood', 'stone', 'food', 'iron', 'wool', 'leather'];
            const res = resources[Math.floor(Math.random() * resources.length)];
            const amount = 3 + Math.floor(Math.random() * 8);
            Game.state.resources[res] = (Game.state.resources[res] || 0) + amount;
        }
    }
    
    // Wensput random events
    let wensputCount = 0;
    for (const isl of Game.state.islands) {
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'wensput') wensputCount++;
            }
        }
    }
    for (let w = 0; w < wensputCount; w++) {
        if (Math.random() < 0.4) {
            const roll = Math.random();
            if (roll < 0.6) {
                const bonus = 5 + Math.floor(Math.random() * 20);
                const resources = ['gold', 'wood', 'stone', 'food', 'scales', 'iron'];
                const res = resources[Math.floor(Math.random() * resources.length)];
                Game.state.resources[res] = (Game.state.resources[res] || 0) + bonus;
                showEventModal('🪙 Wensput', `De wensput geeft je een geschenk!`, [{ text: `+${bonus} ${res}`, negative: false }]);
            } else {
                const loss = 3 + Math.floor(Math.random() * 10);
                Game.state.resources.gold = Math.max(0, Game.state.resources.gold - loss);
                showEventModal('🪙 Wensput', `De wensput eist een offer...`, [{ text: `-${loss} goud`, negative: true }]);
            }
        }
    }
    
    // Monument gold bonus (applied per island)
    for (const isl of Game.state.islands) {
        let hasMonument = false;
        let islandGold = 0;
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'monument') hasMonument = true;
                const t = isl.grid[r][c];
                if (t && BUILDINGS[t] && BUILDINGS[t].income && BUILDINGS[t].income.gold) {
                    islandGold += BUILDINGS[t].income.gold;
                }
            }
        }
        if (hasMonument) {
            const bonus = Math.floor(islandGold * 0.1);
            Game.state.resources.gold += bonus;
        }
    }
    
    // Drakennest auto-breeding
    if (!Game.state.nestTimers) Game.state.nestTimers = {};
    for (const isl of Game.state.islands) {
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'drakennest') {
                    const key = `${isl.id}_${r}_${c}`;
                    if (!Game.state.nestTimers[key]) Game.state.nestTimers[key] = 0;
                    Game.state.nestTimers[key] += 10;
                    
                    // Check for adjacent dragon_stable for speed boost
                    const nbrs = getNeighbors(isl, r, c);
                    const hasStable = nbrs.includes('dragon_stable');
                    const breedTime = hasStable ? 240 : 300; // 4 or 5 minutes
                    
                    if (Game.state.nestTimers[key] >= breedTime) {
                        Game.state.nestTimers[key] = 0;
                        if (!Game.state.petDragons) Game.state.petDragons = [];
                        Game.state.petDragons.push({
                            id: Math.random().toString(36).substr(2, 9),
                            islandId: isl.id,
                            row: r, col: c,
                            name: 'Baby Draakje',
                        });
                        showEventModal('🪺 Drakennest', 'Een nieuw draakje is uitgebroed!', [{ text: '+1 draakje', negative: false }]);
                    }
                }
            }
        }
    }
    
    // Food shortage -> lose population
    if (Game.state.resources.food <= 0 && income.food < 0) {
        Game.state.resources.population = Math.max(1, Game.state.resources.population - 1);
        showEventModal(
            '🍽️ Hongersnood!',
            'Je volk heeft niet genoeg voedsel! Een bewoner is vertrokken.',
            [{ text: '-1 Bevolking', negative: true }]
        );
    }
    
    // Wind events
    Game.state.windLevel += Math.random() * 5;
    if (Game.state.windLevel >= 80) {
        triggerWindEvent();
        Game.state.windLevel = 0;
    }
    
    // Dragon events (sheep stables increase dragon attack speed)
    let sheepStables = 0;
    for (const isl of Game.state.islands) {
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'sheep_stable') sheepStables++;
            }
        }
    }
    Game.state.dragonTimer += Math.random() * 6 * (1 + sheepStables * 0.3);
    if (Game.state.dragonTimer >= 70) {
        triggerDragonEvent();
        Game.state.dragonTimer = 0;
    }
    
    // Random positive events
    if (Math.random() < 0.05) {
        triggerPositiveEvent();
    }
    
    // Trader spawn (25% base kans + veiling_huis boost)
    let veilingCount = 0;
    for (const isl of Game.state.islands) {
        for (let r = 0; r < isl.size; r++) {
            for (let c = 0; c < isl.size; c++) {
                if (isl.grid[r][c] === 'veiling_huis') veilingCount++;
            }
        }
    }
    if (!Game.trader) {
        const traderChance = Math.min(1, 0.10 + veilingCount * 0.15);
        if (Math.random() < traderChance) spawnTrader();
    }
    
    // Bot growth and challenges
    tickBots();
    tryBotChallenge();
    
    // Spawn income particles on buildings
    spawnIncomeParticles();
    
    // Auto-save
    saveGame();
    
    updateUI();
}

function spawnIncomeParticles() {
    for (const island of Game.state.islands) {
        for (let r = 0; r < island.size; r++) {
            for (let c = 0; c < island.size; c++) {
                if (island.grid[r][c]) {
                    const pos = getIslandScreenPos(island);
                    const cellX = pos.x - (island.size * CELL_SIZE) / 2 + c * CELL_SIZE + CELL_SIZE / 2;
                    const cellY = pos.y - (island.size * CELL_SIZE) / 2 + r * CELL_SIZE + CELL_SIZE / 2;
                    spawnParticles(cellX, cellY, '#ffdd44', 3);
                }
            }
        }
    }
}

// ============================================
// BRIDGE PROTECTION NETWORK
// ============================================
function getConnectedIslandIds(islandId) {
    const visited = new Set();
    const queue = [islandId];
    visited.add(islandId);
    
    while (queue.length > 0) {
        const current = queue.shift();
        for (const bridge of Game.state.bridges) {
            if (bridge.health <= 0) continue;
            let neighbor = null;
            if (bridge.from === current) neighbor = bridge.to;
            if (bridge.to === current) neighbor = bridge.from;
            if (neighbor && !visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return visited;
}

function isIslandWindProtected(island) {
    if (island.hasTemple) return true;
    const connected = getConnectedIslandIds(island.id);
    for (const id of connected) {
        const other = Game.state.islands.find(i => i.id === id);
        if (other && other.hasTemple) return true;
    }
    return false;
}

function isIslandDragonProtected(island) {
    if (island.hasTower) return true;
    const connected = getConnectedIslandIds(island.id);
    for (const id of connected) {
        const other = Game.state.islands.find(i => i.id === id);
        if (other && other.hasTower) return true;
    }
    return false;
}

// ============================================
// EVENTS
// ============================================
function triggerWindEvent() {
    const unprotectedBridges = Game.state.bridges.filter(bridge => {
        const fromIsland = Game.state.islands.find(i => i.id === bridge.from);
        const toIsland = Game.state.islands.find(i => i.id === bridge.to);
        return !(fromIsland && isIslandWindProtected(fromIsland)) && !(toIsland && isIslandWindProtected(toIsland));
    });
    
    if (unprotectedBridges.length > 0) {
        const targetBridge = unprotectedBridges[Math.floor(Math.random() * unprotectedBridges.length)];
        targetBridge.health -= 50 + Math.floor(Math.random() * 30);
        
        if (targetBridge.health <= 0) {
            Game.state.bridges = Game.state.bridges.filter(b => b.id !== targetBridge.id);
            showEventModal(
                '🌬️ Stormwind!',
                'Een hevige storm heeft een brug vernietigd! Bouw tempels om eilanden te beschermen.',
                [{ text: 'Brug vernietigd!', negative: true }]
            );
        } else {
            showEventModal(
                '🌬️ Windstoten!',
                `Een sterke wind beschadigt een brug. (${targetBridge.health}% over)`,
                [{ text: `Brug beschadigd: ${targetBridge.health}%`, negative: true }]
            );
        }
    } else if (Game.state.bridges.length > 0) {
        showEventModal(
            '🌬️ Storm afgewend!',
            'Tempels in je brugnetwerk beschermen alles tegen de storm!',
            [{ text: 'Beschermd door brugnetwerk!', negative: false }]
        );
    } else {
        const occupied = [];
        for (const island of Game.state.islands) {
            if (isIslandWindProtected(island)) continue;
            for (let r = 0; r < island.size; r++) {
                for (let c = 0; c < island.size; c++) {
                    if (island.grid[r][c] && island.grid[r][c] !== 'temple') {
                        occupied.push({ island, r, c });
                    }
                }
            }
        }
        
        if (occupied.length > 0 && Math.random() < 0.3) {
            const target = occupied[Math.floor(Math.random() * occupied.length)];
            const type = target.island.grid[target.r][target.c];
            const buildingDef = BUILDINGS[type];
            const buildingName = buildingDef.name;
            
            // Handle special building destruction effects
            if (type === 'bank') {
                const loss = Math.floor(Game.state.resources.gold * 0.2);
                Game.state.resources.gold -= loss;
            }
            if (buildingDef.provides && buildingDef.provides.population) {
                Game.state.maxPopulation -= buildingDef.provides.population;
                Game.state.resources.population = Math.min(Game.state.resources.population, Game.state.maxPopulation);
            }
            if ((type === 'dragon_stable' || type === 'drakennest') && Game.state.petDragons) {
                Game.state.petDragons = Game.state.petDragons.filter(
                    p => !(p.islandId === target.island.id && p.row === target.r && p.col === target.c)
                );
            }
            if (type === 'drakennest' && Game.state.nestTimers) {
                delete Game.state.nestTimers[`${target.island.id}_${target.r}_${target.c}`];
            }
            if (type === 'tower') target.island.hasTower = false;
            if (type === 'temple') target.island.hasTemple = false;
            
            target.island.grid[target.r][target.c] = null;
            Game.state.totalBuildings--;
            
            // Re-check tower/temple
            for (let r = 0; r < target.island.size; r++) {
                for (let c = 0; c < target.island.size; c++) {
                    if (target.island.grid[r][c] === 'tower') target.island.hasTower = true;
                    if (target.island.grid[r][c] === 'temple') target.island.hasTemple = true;
                }
            }
            
            showEventModal(
                '🌬️ Verwoestende Storm!',
                `De wind heeft je ${buildingName} weggeblazen!`,
                [{ text: `${buildingName} verloren!`, negative: true }]
            );
        }
    }
}

function hasDragonStable() {
    for (const island of Game.state.islands) {
        for (let r = 0; r < island.size; r++) {
            for (let c = 0; c < island.size; c++) {
                if (island.grid[r][c] === 'dragon_stable') return { island, row: r, col: c };
            }
        }
    }
    return null;
}

function triggerDragonEvent() {
    // Show alert during flight
    const alert = document.getElementById('dragon-alert');
    alert.classList.remove('hidden');
    
    // Check for dragon stable FIRST - 10% chance to befriend, max 2 per stable
    const stable = hasDragonStable();
    if (stable && Math.random() < 0.10) {
        if (!Game.state.petDragons) Game.state.petDragons = [];
        const petsInStable = Game.state.petDragons.filter(
            p => p.islandId === stable.island.id && p.row === stable.row && p.col === stable.col
        ).length;
        
        if (petsInStable < 2) {
            const dragonNames = ['Vonk', 'Blitz', 'Ember', 'Flam', 'Puff', 'Drakos', 'Smokey', 'Smaug Jr.', 'Flauw', 'Groentje'];
            const name = dragonNames[Math.floor(Math.random() * dragonNames.length)];
            
            // Calculate stable landing position BEFORE spawning dragon
            const stablePos = getIslandScreenPos(stable.island);
            const landCol = Math.max(0, stable.col - 1);
            const cellX = stablePos.x - (stable.island.size * CELL_SIZE) / 2 + landCol * CELL_SIZE + CELL_SIZE / 2;
            const cellY = stablePos.y - (stable.island.size * CELL_SIZE) / 2 + stable.row * CELL_SIZE + CELL_SIZE / 2;
            const screenX = cellX * Game.camera.zoom + Game.camera.x;
            const screenY = cellY * Game.camera.zoom + Game.camera.y;
            
            // Spawn dragon directly targeting the stable
            spawnDragon();
            Game.dragon.landX = screenX;
            Game.dragon.landY = screenY;
            Game.dragon.flyOutTime = 0; // Don't fly out - stay at stable
            Game.dragon.landTime = 4;
            
            // Add pet dragon AFTER animation finishes
            const stableRef = { islandId: stable.island.id, row: stable.row, col: stable.col };
            setTimeout(() => {
                alert.classList.add('hidden');
                Game.state.petDragons.push({
                    name: name,
                    islandId: stableRef.islandId,
                    row: stableRef.row,
                    col: stableRef.col,
                });
                showEventModal(
                    '🐲 Draakje bevriend!',
                    `Het draakje "${name}" is je vriend geworden en woont nu in je drakenstal!`,
                    [{ text: `🐲 +1 Pet Draakje: ${name}`, negative: false }]
                );
                saveGame();
                updateUI();
            }, 10000);
            return;
        }
    }
    
    // Spawn dragon for non-taming events
    spawnDragon();
    
    const unprotectedIslands = Game.state.islands.filter(i => !isIslandDragonProtected(i));
    
    if (unprotectedIslands.length === 0) {
        setTimeout(() => {
            alert.classList.add('hidden');
            showEventModal(
                '🐉 Draakje afgeschrikt!',
                'Je wachttorens hebben het draakje weggejaagd!',
                [{ text: 'Beschermd!', negative: false }]
            );
        }, 10000);
        return;
    }
    
    const stealOptions = ['gold', 'wood', 'stone', 'food'];
    const stolen = stealOptions[Math.floor(Math.random() * stealOptions.length)];
    const amount = 10 + Math.floor(Math.random() * 20);
    const actualStolen = Math.min(amount, Game.state.resources[stolen]);
    Game.state.resources[stolen] -= actualStolen;
    
    const resNames = { gold: 'Goud', wood: 'Hout', stone: 'Steen', food: 'Voedsel' };
    const resIcons = { gold: '💰', wood: '🪵', stone: '🪨', food: '🌾' };
    
    // Show modal after dragon flies away
    setTimeout(() => {
        alert.classList.add('hidden');
        showEventModal(
            '🐉 Draakje aanval!',
            'Een draakje heeft resources gestolen! Bouw wachttorens om ze af te schrikken.',
            [{ text: `${resIcons[stolen]} -${actualStolen} ${resNames[stolen]}`, negative: true }]
        );
        updateUI();
    }, 10000);
}

function spawnDragon() {
    // Pick a random island as the target to land on
    const islands = Game.state.islands;
    const targetIsland = islands[Math.floor(Math.random() * islands.length)];
    const targetPos = getIslandScreenPos(targetIsland);
    
    // Convert island world position to screen position
    const screenX = targetPos.x * Game.camera.zoom + Game.camera.x;
    const screenY = targetPos.y * Game.camera.zoom + Game.camera.y - 30;
    
    Game.dragon = {
        x: -80,
        y: screenY - 60,
        landX: screenX,
        landY: screenY,
        phase: 'flying_in',  // flying_in -> landing -> flying_out
        timer: 0,
        flyInTime: 4,
        landTime: 3,
        flyOutTime: 3,
    };
}

function updateDragon(dt) {
    if (!Game.dragon) return;
    const d = Game.dragon;
    d.timer += dt;
    
    if (d.phase === 'flying_in') {
        const progress = Math.min(d.timer / d.flyInTime, 1);
        const ease = 1 - Math.pow(1 - progress, 2);
        d.x = -80 + (d.landX - (-80)) * ease;
        // Wavy flight path - swoops up and down like a real dragon
        const baseY = (d.landY - 80) + (d.landY - (d.landY - 80)) * ease;
        d.y = baseY + Math.sin(progress * Math.PI * 3) * 25 + Math.sin(progress * Math.PI * 7) * 8;
        
        if (d.timer >= d.flyInTime) {
            d.phase = 'landing';
            d.timer = 0;
            d.x = d.landX;
            d.y = d.landY;
        }
    } else if (d.phase === 'landing') {
        // Gently bob while perched
        d.x = d.landX + Math.sin(d.timer * 1.5) * 2;
        d.y = d.landY + Math.sin(d.timer * 2) * 3;
        
        if (d.timer >= d.landTime) {
            if (d.flyOutTime <= 0) {
                // Tamed - dragon stays at stable and disappears
                Game.dragon = null;
                return;
            }
            d.phase = 'flying_out';
            d.timer = 0;
        }
    } else if (d.phase === 'flying_out') {
        const progress = Math.min(d.timer / d.flyOutTime, 1);
        const ease = progress * progress;
        const w = Game.canvas.width;
        d.x = d.landX + (w + 80 - d.landX) * ease;
        // Wavy flight going up and away
        const baseY = d.landY + (-80 - d.landY) * ease;
        d.y = baseY + Math.sin(progress * Math.PI * 3) * 20 + Math.sin(progress * Math.PI * 5) * 10;
        
        if (d.timer >= d.flyOutTime) {
            Game.dragon = null;
        }
    }
}

function drawDragon(ctx) {
    if (!Game.dragon) return;
    const d = Game.dragon;
    
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Flip when flying out (going right)
    if (d.phase === 'flying_out') {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.scale(-1, 1);
        ctx.fillText('🐉', 0, 0);
        ctx.restore();
    } else {
        ctx.fillText('🐉', d.x, d.y);
    }
    
    ctx.restore();
}

function triggerPositiveEvent() {
    const events = [
        {
            title: '🎁 Handelaars!',
            text: 'Reizende handelaars brengen geschenken!',
            effect: () => {
                Game.state.resources.gold += 15;
                Game.state.resources.wood += 10;
            },
            effects: [{ text: '+15💰 +10🪵', negative: false }],
        },
        {
            title: '🌈 Goede Oogst!',
            text: 'Het weer is perfect voor de boerderijen!',
            effect: () => { Game.state.resources.food += 20; },
            effects: [{ text: '+20🌾 Voedsel', negative: false }],
        },
        {
            title: '⛏️ Ertsader gevonden!',
            text: 'Mijnwerkers hebben een rijke ertsader ontdekt!',
            effect: () => { Game.state.resources.stone += 15; },
            effects: [{ text: '+15🪨 Steen', negative: false }],
        },
        {
            title: '👥 Nieuwe Bewoners!',
            text: 'Reizigers willen zich in je koninkrijk vestigen!',
            effect: () => {
                if (Game.state.resources.population < Game.state.maxPopulation) {
                    Game.state.resources.population += 1;
                }
            },
            effects: [{ text: '+1👥 Bevolking', negative: false }],
        },
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    showEventModal(event.title, event.text, event.effects);
}

// ============================================
// TRADER SYSTEM
// ============================================
const TRADER_OFFERS = [
    { name: 'Goudpakket', give: { wood: 30 }, receive: { gold: 50 }, icon: '💰', stock: 5 },
    { name: 'Houtpakket', give: { gold: 25 }, receive: { wood: 40 }, icon: '🪵', stock: 5 },
    { name: 'Steenpakket', give: { gold: 30 }, receive: { stone: 35 }, icon: '🪨', stock: 5 },
    { name: 'Voedselpakket', give: { gold: 20 }, receive: { food: 30 }, icon: '🌾', stock: 8 },
    { name: 'Drakenvoer', give: { food: 40 }, receive: { scales: 8 }, icon: '🐲', stock: 3 },
    { name: 'Schubbenhandel', give: { scales: 10 }, receive: { gold: 80 }, icon: '✨', stock: 3 },
    { name: 'Schubbenpoeder', give: { scales: 5 }, receive: { wood: 30, stone: 20 }, icon: '🧪', stock: 4 },
    { name: 'Drakenvuur Steen', give: { scales: 8 }, receive: { stone: 50 }, icon: '🔥', stock: 2 },
    { name: 'Bouwerspakket', give: { gold: 40, food: 20 }, receive: { wood: 30, stone: 30 }, icon: '🧱', stock: 3 },
    { name: 'Luxe Feestmaal', give: { gold: 60 }, receive: { food: 50, wood: 10 }, icon: '🍖', stock: 4 },
    { name: 'Oud Artefact', give: { scales: 5, gold: 30 }, receive: { stone: 60 }, icon: '🏺', stock: 2 },
    { name: 'Drakenei', give: { scales: 20, gold: 50 }, receive: { food: 100, gold: 100 }, icon: '🥚', stock: 1 },
    { name: 'Magische Stenen', give: { wood: 50 }, receive: { stone: 45 }, icon: '💎', stock: 3 },
    { name: 'Handelaarszegen', give: { gold: 80 }, receive: { wood: 40, stone: 40, food: 40 }, icon: '🙏', stock: 2 },
    { name: 'Schubben Elixir', give: { scales: 15 }, receive: { food: 60, gold: 60 }, icon: '⚗️', stock: 2 },
    { name: 'IJzerpakket', give: { gold: 35 }, receive: { iron: 15 }, icon: '⚙️', stock: 4 },
    { name: 'Smederij Deal', give: { iron: 10 }, receive: { gold: 60 }, icon: '🔥', stock: 3 },
    { name: 'Wolhandel', give: { wool: 15 }, receive: { gold: 50 }, icon: '🧶', stock: 3 },
    { name: 'Leerhandel', give: { leather: 15 }, receive: { gold: 50 }, icon: '👜', stock: 3 },
    { name: 'Wapenpakket', give: { iron: 8, leather: 8 }, receive: { gold: 80 }, icon: '⚔️', stock: 2 },
    { name: 'Textiel Deal', give: { wool: 10 }, receive: { leather: 8, gold: 20 }, icon: '🪡', stock: 3 },
    { name: 'Smelterij Kit', give: { gold: 50, stone: 30 }, receive: { iron: 20 }, icon: '🛠️', stock: 2 },
];

function spawnTrader() {
    // Pick random island to place trader
    const islands = Game.state.islands;
    const island = islands[Math.floor(Math.random() * islands.length)];
    
    // Pick 3-4 random offers (deep copy with stock)
    const numOffers = 3 + Math.floor(Math.random() * 2);
    const shuffled = [...TRADER_OFFERS].sort(() => Math.random() - 0.5);
    const offers = shuffled.slice(0, numOffers).map(o => ({ ...o, stockLeft: o.stock }));
    
    Game.trader = {
        islandId: island.id,
        offers: offers,
        timeLeft: 180, // 3 minutes in seconds
    };
    
    showInfo('🧙 Een handelaar is gearriveerd! Klik op hem om te handelen.');
}

function updateTrader(dt) {
    if (!Game.trader) return;
    Game.trader.timeLeft -= dt;
    if (Game.trader.timeLeft <= 0) {
        Game.trader = null;
        showInfo('🧙 De handelaar is vertrokken...');
    }
}

function getTraderScreenPos() {
    if (!Game.trader) return null;
    const island = Game.state.islands.find(i => i.id === Game.trader.islandId);
    if (!island) { Game.trader = null; return null; }
    const pos = getIslandScreenPos(island);
    // Position trader to the right of the island
    const gridSize = island.size * CELL_SIZE;
    return { x: pos.x + gridSize / 2 + 25, y: pos.y - 15 };
}

function isClickOnTrader(worldX, worldY) {
    if (!Game.trader) return false;
    const pos = getTraderScreenPos();
    if (!pos) return false;
    const dist = Math.sqrt((worldX - pos.x) ** 2 + (worldY - pos.y) ** 2);
    return dist < 25;
}

function openTraderShop() {
    if (!Game.trader) return;
    const modal = document.getElementById('trader-modal');
    const list = document.getElementById('trader-offers');
    list.innerHTML = '';
    
    const minutes = Math.floor(Game.trader.timeLeft / 60);
    const seconds = Math.floor(Game.trader.timeLeft % 60);
    document.getElementById('trader-timer').textContent = `Vertrekt over: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const resIcons = { gold: '💰', wood: '🪵', stone: '🪨', food: '🌾', scales: '🐲', wool: '🧶', leather: '👜', iron: '⚙️' };
    
    for (let i = 0; i < Game.trader.offers.length; i++) {
        const offer = Game.trader.offers[i];
        const soldOut = offer.stockLeft <= 0;
        const canBuy = !soldOut && canAffordTrade(offer.give);
        
        const giveText = Object.entries(offer.give).map(([r, a]) => `${resIcons[r] || ''}${a}`).join(' + ');
        const receiveText = Object.entries(offer.receive).map(([r, a]) => `${resIcons[r] || ''}${a}`).join(' + ');
        
        const item = document.createElement('div');
        item.className = 'trader-offer' + (canBuy ? '' : ' disabled');
        item.innerHTML = `
            <span class="offer-icon">${offer.icon}</span>
            <div class="offer-details">
                <span class="offer-name">${offer.name}</span>
                <span class="offer-trade">Betaal: ${giveText} → Krijg: ${receiveText}</span>
            </div>
            <span class="offer-stock">${soldOut ? 'Uitverkocht' : offer.stockLeft + ' left'}</span>
            <button class="btn-trade" ${canBuy ? '' : 'disabled'}>${soldOut ? '✗' : 'Koop'}</button>
        `;
        
        if (canBuy) {
            item.querySelector('.btn-trade').addEventListener('click', () => executeTrade(i));
        }
        
        list.appendChild(item);
    }
    
    modal.classList.remove('hidden');
}

function canAffordTrade(cost) {
    for (const [res, amount] of Object.entries(cost)) {
        if ((Game.state.resources[res] || 0) < amount) return false;
    }
    return true;
}

function executeTrade(offerIndex) {
    if (!Game.trader || offerIndex >= Game.trader.offers.length) return;
    const offer = Game.trader.offers[offerIndex];
    
    if (offer.stockLeft <= 0) {
        showInfo('❌ Uitverkocht!');
        return;
    }
    
    if (!canAffordTrade(offer.give)) {
        showInfo('❌ Niet genoeg resources!');
        return;
    }
    
    // Deduct cost
    for (const [res, amount] of Object.entries(offer.give)) {
        Game.state.resources[res] -= amount;
    }
    
    // Add rewards
    for (const [res, amount] of Object.entries(offer.receive)) {
        Game.state.resources[res] = (Game.state.resources[res] || 0) + amount;
    }
    
    // Decrease stock
    offer.stockLeft--;
    
    showInfo(`✅ ${offer.name} gekocht!`);
    saveGame();
    updateUI();
    
    // Refresh the shop
    openTraderShop();
}

function closeTraderShop() {
    document.getElementById('trader-modal').classList.add('hidden');
}

// ============================================
// BOT UI FUNCTIONS
// ============================================
function openBotPanel() {
    if (!Game.state) return;
    initBots();
    
    const list = document.getElementById('bot-list');
    list.innerHTML = '';
    
    const diffLabels = { easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Moeilijk' };
    
    // Player stats for comparison
    const playerPop = Game.state.resources.population || 0;
    const playerBuildings = Game.state.totalBuildings || 0;
    const playerIslands = Game.state.islands.length;
    const playerGold = Math.floor(Game.state.resources.gold || 0);
    const playerTotalRes = ['gold','wood','stone','food','iron','wool','leather','scales'].reduce((a, r) => a + Math.floor(Game.state.resources[r] || 0), 0);
    
    // Show player row
    const playerRow = document.createElement('div');
    playerRow.className = 'bot-card bot-card-player';
    playerRow.innerHTML = `
        <div class="bot-icon">🏰</div>
        <div class="bot-info">
            <div class="bot-name">Jij <span class="bot-difficulty" style="background:rgba(100,150,255,0.3);color:#aaccff">Speler</span></div>
            <div class="bot-stats">
                <span>👥 ${playerPop}</span>
                <span>🏠 ${playerBuildings}</span>
                <span>🏝️ ${playerIslands}</span>
                <span>💰 ${playerGold}</span>
                <span>📊 ${playerTotalRes} totaal</span>
            </div>
        </div>
    `;
    list.appendChild(playerRow);
    
    for (const bot of Game.state.bots) {
        const totalRes = Object.values(bot.resources).reduce((a, b) => a + b, 0);
        const onCooldown = bot.challengeCooldown > 0;
        const cooldownSec = onCooldown ? bot.challengeCooldown * 10 : 0;
        const cooldownMin = Math.floor(cooldownSec / 60);
        const cooldownRemSec = cooldownSec % 60;
        const cooldownText = cooldownMin > 0 ? `${cooldownMin}m${cooldownRemSec > 0 ? cooldownRemSec + 's' : ''}` : `${cooldownSec}s`;
        
        const card = document.createElement('div');
        card.className = 'bot-card';
        card.innerHTML = `
            <div class="bot-icon">${bot.icon}</div>
            <div class="bot-info">
                <div class="bot-name">${bot.name} <span class="bot-difficulty ${bot.difficulty}">${diffLabels[bot.difficulty]}</span></div>
                <div class="bot-stats">
                    <span>👥 ${bot.population}</span>
                    <span>🏠 ${bot.buildings}</span>
                    <span>🏝️ ${bot.islands}</span>
                    <span>💰 ${bot.resources.gold}</span>
                    <span>📊 ${totalRes} totaal</span>
                </div>
            </div>
            <button class="bot-challenge-btn" ${onCooldown ? 'disabled' : ''} onclick="challengeBot('${bot.id}')">
                ${onCooldown ? `⏳ ${cooldownText}` : '⚔️ Uitdagen'}
            </button>
        `;
        list.appendChild(card);
    }
    
    document.getElementById('bot-modal').classList.remove('hidden');
}

function closeBotPanel() {
    document.getElementById('bot-modal').classList.add('hidden');
}

function challengeBot(botId) {
    const bot = Game.state.bots.find(b => b.id === botId);
    if (!bot || bot.challengeCooldown > 0) return;
    
    closeBotPanel();
    
    const result = resolveBattle(bot);
    showBattleResult(bot, result);
}

function showBattleResult(bot, result) {
    const title = document.getElementById('battle-title');
    const text = document.getElementById('battle-text');
    const stats = document.getElementById('battle-stats');
    const effects = document.getElementById('battle-effects');
    
    if (result.playerWins) {
        title.textContent = '🏆 Overwinning!';
        text.textContent = `Je hebt ${bot.name} verslagen en 25% van hun resources gestolen!`;
    } else {
        title.textContent = '💀 Verloren!';
        text.textContent = `${bot.name} heeft gewonnen en 25% van jouw resources meegenomen!`;
    }
    
    stats.innerHTML = `
        <div class="battle-side">
            <div class="label">Jouw kracht</div>
            <div class="strength ${result.playerWins ? 'strength-win' : 'strength-lose'}">${result.playerStrength}</div>
        </div>
        <div style="color:#556;font-size:1.5rem;align-self:center">⚔️</div>
        <div class="battle-side">
            <div class="label">${bot.name}</div>
            <div class="strength ${result.playerWins ? 'strength-lose' : 'strength-win'}">${result.botStrength}</div>
        </div>
    `;
    
    effects.innerHTML = '';
    for (const r of result.results) {
        const div = document.createElement('div');
        div.className = r.negative ? 'battle-effect-negative' : 'battle-effect-positive';
        div.textContent = r.text;
        effects.appendChild(div);
    }
    
    document.getElementById('battle-modal').classList.remove('hidden');
}

function closeBattleModal() {
    document.getElementById('battle-modal').classList.add('hidden');
}

function showBotInvite(bot) {
    const icons = { gold: '💰', wood: '🪵', stone: '🪨', food: '🌾', iron: '⚙️', wool: '🧶', leather: '👜', scales: '🐲' };
    
    document.getElementById('bot-invite-title').textContent = `⚔️ ${bot.icon} ${bot.name} daagt je uit!`;
    document.getElementById('bot-invite-text').textContent = `${bot.name} wil vechten! Bekijk hun stats en beslis of je accepteert.`;
    
    const statsDiv = document.getElementById('bot-invite-stats');
    const totalRes = Object.values(bot.resources).reduce((a, b) => a + b, 0);
    
    const playerPop = Game.state.resources.population || 0;
    const playerBuildings = Game.state.totalBuildings || 0;
    const playerIslands = Game.state.islands.length;
    const playerGold = Math.floor(Game.state.resources.gold || 0);
    const playerTotalRes = ['gold','wood','stone','food','iron','wool','leather','scales'].reduce((a, r) => a + Math.floor(Game.state.resources[r] || 0), 0);
    
    const cmp = (yours, theirs) => yours > theirs ? 'style="color:#88ff88"' : yours < theirs ? 'style="color:#ff8888"' : '';
    
    statsDiv.innerHTML = `
        <div class="bot-invite-stat-row"><span class="label"></span><span class="value">Jij</span><span class="value">${bot.name}</span></div>
        <div class="bot-invite-stat-row"><span class="label">👥 Bevolking</span><span class="value" ${cmp(playerPop, bot.population)}>${playerPop}</span><span class="value" ${cmp(bot.population, playerPop)}>${bot.population}</span></div>
        <div class="bot-invite-stat-row"><span class="label">🏠 Gebouwen</span><span class="value" ${cmp(playerBuildings, bot.buildings)}>${playerBuildings}</span><span class="value" ${cmp(bot.buildings, playerBuildings)}>${bot.buildings}</span></div>
        <div class="bot-invite-stat-row"><span class="label">🏝️ Eilanden</span><span class="value" ${cmp(playerIslands, bot.islands)}>${playerIslands}</span><span class="value" ${cmp(bot.islands, playerIslands)}>${bot.islands}</span></div>
        <div class="bot-invite-stat-row"><span class="label">💰 Goud</span><span class="value" ${cmp(playerGold, bot.resources.gold)}>${playerGold}</span><span class="value" ${cmp(bot.resources.gold, playerGold)}>${bot.resources.gold}</span></div>
        <div class="bot-invite-stat-row"><span class="label">📊 Totaal</span><span class="value" ${cmp(playerTotalRes, totalRes)}>${playerTotalRes}</span><span class="value" ${cmp(totalRes, playerTotalRes)}>${totalRes}</span></div>
    `;
    
    const acceptBtn = document.getElementById('bot-invite-accept');
    const declineBtn = document.getElementById('bot-invite-decline');
    
    acceptBtn.onclick = () => {
        document.getElementById('bot-invite-modal').classList.add('hidden');
        const result = resolveBattle(bot);
        showBattleResult(bot, result);
    };
    
    declineBtn.onclick = () => {
        document.getElementById('bot-invite-modal').classList.add('hidden');
        showInfo(`🚫 Uitdaging van ${bot.name} geweigerd.`);
    };
    
    document.getElementById('bot-invite-modal').classList.remove('hidden');
}

const ALCH_RESOURCES = [
    { key: 'gold', name: 'Goud', icon: '💰' },
    { key: 'wood', name: 'Hout', icon: '🪵' },
    { key: 'stone', name: 'Steen', icon: '🪨' },
    { key: 'food', name: 'Voedsel', icon: '🌾' },
    { key: 'wool', name: 'Wol', icon: '🧶' },
    { key: 'leather', name: 'Leer', icon: '👜' },
    { key: 'iron', name: 'IJzer', icon: '⚙️' },
    { key: 'scales', name: 'Schubben', icon: '🐲' },
];

let currentAlchLab = null; // { island, row, col }

function openAlchemistLab(island, row, col) {
    currentAlchLab = { island, row, col };
    if (!Game.state.alchemistConversions) Game.state.alchemistConversions = [];
    
    const modal = document.getElementById('alchemist-modal');
    modal.classList.remove('hidden');
    
    // Populate dropdowns
    const inputSel = document.getElementById('alch-input-res');
    const outputSel = document.getElementById('alch-output-res');
    inputSel.innerHTML = '';
    outputSel.innerHTML = '';
    
    for (const res of ALCH_RESOURCES) {
        inputSel.innerHTML += `<option value="${res.key}">${res.icon} ${res.name}</option>`;
        outputSel.innerHTML += `<option value="${res.key}">${res.icon} ${res.name}</option>`;
    }
    
    // Default: wood → gold
    inputSel.value = 'wood';
    outputSel.value = 'gold';
    
    // Add event listeners for cost calculation
    inputSel.onchange = updateAlchCost;
    outputSel.onchange = updateAlchCost;
    document.getElementById('alch-input-amount').oninput = updateAlchCost;
    
    updateAlchCost();
    renderAlchActiveList();
}

function getAlchConversionTime(island, row, col) {
    // Base: 180 seconds (3 minutes). Adjacent dragon_stable: 120 seconds (2 minutes)
    const neighbors = getNeighbors(island, row, col);
    return neighbors.includes('dragon_stable') ? 120 : 180;
}

function updateAlchCost() {
    const amount = parseInt(document.getElementById('alch-input-amount').value) || 0;
    const inputRes = document.getElementById('alch-input-res').value;
    const outputRes = document.getElementById('alch-output-res').value;
    
    // Cost: 1 scale per 20 units converted (minimum 1)
    const scalesCost = Math.max(1, Math.floor(amount / 20));
    document.getElementById('alch-scales-cost').textContent = scalesCost;
    
    // Output amount: 80% of input (conversion loss)
    const outputAmount = Math.max(1, Math.floor(amount * 0.8));
    
    // Time display
    const time = currentAlchLab ? getAlchConversionTime(currentAlchLab.island, currentAlchLab.row, currentAlchLab.col) : 180;
    const min = Math.floor(time / 60);
    const sec = time % 60;
    document.getElementById('alch-time').textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    
    // Show output preview
    const outRes = ALCH_RESOURCES.find(r => r.key === outputRes);
    const inRes = ALCH_RESOURCES.find(r => r.key === inputRes);
    
    const startBtn = document.getElementById('alch-start');
    if (inputRes === outputRes) {
        startBtn.textContent = '❌ Zelfde resource!';
        startBtn.disabled = true;
    } else if (amount <= 0) {
        startBtn.textContent = '❌ Vul een hoeveelheid in';
        startBtn.disabled = true;
    } else if ((Game.state.resources[inputRes] || 0) < amount) {
        startBtn.textContent = `❌ Niet genoeg ${inRes.name}`;
        startBtn.disabled = true;
    } else if ((Game.state.resources.scales || 0) < scalesCost) {
        startBtn.textContent = `❌ Niet genoeg schubben`;
        startBtn.disabled = true;
    } else {
        startBtn.textContent = `Start: ${amount} ${inRes.icon} → ${outputAmount} ${outRes.icon}`;
        startBtn.disabled = false;
    }
}

function startAlchemistConversion() {
    if (!currentAlchLab) return;
    if (!Game.state.alchemistConversions) Game.state.alchemistConversions = [];
    
    const inputRes = document.getElementById('alch-input-res').value;
    const outputRes = document.getElementById('alch-output-res').value;
    const amount = parseInt(document.getElementById('alch-input-amount').value) || 0;
    
    if (inputRes === outputRes || amount <= 0) return;
    
    const scalesCost = Math.max(1, Math.floor(amount / 20));
    const outputAmount = Math.max(1, Math.floor(amount * 0.8));
    const time = getAlchConversionTime(currentAlchLab.island, currentAlchLab.row, currentAlchLab.col);
    
    // Check affordability
    if ((Game.state.resources[inputRes] || 0) < amount) {
        showInfo('❌ Niet genoeg input resources!');
        return;
    }
    if ((Game.state.resources.scales || 0) < scalesCost) {
        showInfo('❌ Niet genoeg schubben!');
        return;
    }
    
    // Deduct input resources and scales
    Game.state.resources[inputRes] -= amount;
    Game.state.resources.scales -= scalesCost;
    
    // Create conversion entry
    Game.state.alchemistConversions.push({
        labIslandId: currentAlchLab.island.id,
        labRow: currentAlchLab.row,
        labCol: currentAlchLab.col,
        inputRes: inputRes,
        inputAmount: amount,
        outputRes: outputRes,
        outputAmount: outputAmount,
        timeLeft: time,
        totalTime: time,
    });
    
    const inRes = ALCH_RESOURCES.find(r => r.key === inputRes);
    const outRes = ALCH_RESOURCES.find(r => r.key === outputRes);
    showInfo(`⚗️ Conversie gestart: ${amount} ${inRes.icon} → ${outputAmount} ${outRes.icon} (${Math.floor(time/60)}min)`);
    
    saveGame();
    updateUI();
    updateAlchCost();
    renderAlchActiveList();
}

function renderAlchActiveList() {
    const list = document.getElementById('alch-active-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!Game.state.alchemistConversions || Game.state.alchemistConversions.length === 0) {
        list.innerHTML = '<p style="color:#667;font-size:0.8rem;text-align:center">Geen actieve conversies</p>';
        return;
    }
    
    for (const conv of Game.state.alchemistConversions) {
        const inRes = ALCH_RESOURCES.find(r => r.key === conv.inputRes);
        const outRes = ALCH_RESOURCES.find(r => r.key === conv.outputRes);
        const min = Math.floor(conv.timeLeft / 60);
        const sec = Math.floor(conv.timeLeft % 60);
        const progress = Math.floor((1 - conv.timeLeft / conv.totalTime) * 100);
        
        const item = document.createElement('div');
        item.className = 'alch-active-item';
        item.innerHTML = `
            <span>${conv.inputAmount} ${inRes.icon} → ${conv.outputAmount} ${outRes.icon}</span>
            <span class="alch-progress">${progress}% (${min}:${sec.toString().padStart(2, '0')})</span>
        `;
        list.appendChild(item);
    }
}

function tickAlchemistConversions(dt) {
    if (!Game.state.alchemistConversions || Game.state.alchemistConversions.length === 0) return;
    
    let changed = false;
    for (let i = Game.state.alchemistConversions.length - 1; i >= 0; i--) {
        const conv = Game.state.alchemistConversions[i];
        conv.timeLeft -= dt;
        if (conv.timeLeft <= 0) {
            Game.state.resources[conv.outputRes] = (Game.state.resources[conv.outputRes] || 0) + conv.outputAmount;
            const inRes = ALCH_RESOURCES.find(r => r.key === conv.inputRes);
            const outRes = ALCH_RESOURCES.find(r => r.key === conv.outputRes);
            showEventModal('⚗️ Conversie Klaar!', `${conv.inputAmount} ${inRes.icon} → ${conv.outputAmount} ${outRes.icon}`, [{ text: `+${conv.outputAmount} ${outRes.icon} ${outRes.name}`, negative: false }]);
            Game.state.alchemistConversions.splice(i, 1);
            changed = true;
        }
    }
    
    if (changed) {
        saveGame();
        updateUI();
    }
    
    // Update active list display if modal is open
    if (!document.getElementById('alchemist-modal').classList.contains('hidden')) {
        renderAlchActiveList();
    }
}

function closeAlchemistLab() {
    document.getElementById('alchemist-modal').classList.add('hidden');
    currentAlchLab = null;
}

function drawTrader(ctx) {
    if (!Game.trader) return;
    const pos = getTraderScreenPos();
    if (!pos) return;
    
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Bobbing animation
    const bob = Math.sin(Game.floatOffset * 2) * 3;
    ctx.fillText('🧙', pos.x, pos.y + bob);
    
    // Timer indicator
    const minutes = Math.floor(Game.trader.timeLeft / 60);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = minutes <= 2 ? '#ff6666' : '#aaffaa';
    ctx.fillText(`${minutes}min`, pos.x, pos.y + 18);
    
    ctx.restore();
}

// ============================================
// UI
// ============================================
function showEventModal(title, text, effects) {
    if (Game.muteNotifications) return;
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const effectsHtml = effects.map(e => 
        `<span class="${e.negative ? 'effect-negative' : 'effect-positive'}">${e.text}</span>`
    ).join(' ');
    
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-text">${text}</div>
        <div class="toast-effects">${effectsHtml}</div>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function closeEventModal() {
    // Legacy - no longer needed but kept for compatibility
    updateUI();
}

function showInfo(text) {
    document.getElementById('info-content').innerHTML = `<p>${text}</p>`;
}

function updateUI() {
    if (!Game.state) return;
    
    document.getElementById('gold-value').textContent = Math.floor(Game.state.resources.gold);
    document.getElementById('wood-value').textContent = Math.floor(Game.state.resources.wood);
    document.getElementById('stone-value').textContent = Math.floor(Game.state.resources.stone);
    document.getElementById('food-value').textContent = Math.floor(Game.state.resources.food);
    document.getElementById('scales-value').textContent = Math.floor(Game.state.resources.scales || 0);
    document.getElementById('wool-value').textContent = Math.floor(Game.state.resources.wool || 0);
    document.getElementById('leather-value').textContent = Math.floor(Game.state.resources.leather || 0);
    document.getElementById('iron-value').textContent = Math.floor(Game.state.resources.iron || 0);
    document.getElementById('pop-value').textContent = `${Game.state.resources.population}/${Game.state.maxPopulation}`;
    
    // Timer display
    const timerEl = document.getElementById('timer-value');
    if (timerEl) timerEl.textContent = Math.ceil(Game.incomeTimer) + 's';
    
    // Wind indicator
    const windEl = document.getElementById('wind-indicator');
    if (Game.state.windLevel > 50) {
        windEl.classList.remove('hidden');
        document.getElementById('wind-text').textContent = 
            Game.state.windLevel > 70 ? 'Storm nadert!' : 'Wind neemt toe...';
    } else {
        windEl.classList.add('hidden');
    }
    
    // Update building affordability and dynamic costs
    const icons = { gold: '💰', wood: '🪵', stone: '🪨', scales: '🐲', wool: '🧶', food: '🌾', leather: '👜', iron: '⚙️' };
    document.querySelectorAll('.building-card').forEach(card => {
        const type = card.dataset.type;
        if (!type) return;
        const building = BUILDINGS[type];
        if (!building) return;
        
        // Get dynamic cost
        let dynamicCost;
        if (type === 'new_island') {
            dynamicCost = getIslandCost();
        } else if (building.special === 'bridge' || building.special === 'demolish') {
            dynamicCost = building.cost;
        } else {
            dynamicCost = getBuildingCost(type);
        }
        
        // Update cost display
        const costEl = card.querySelector('.b-cost');
        if (costEl) {
            costEl.textContent = Object.entries(dynamicCost)
                .map(([r, a]) => `${icons[r] || ''}${a}`).join(' ');
        }
        
        if (!canAfford(dynamicCost)) {
            card.style.opacity = '0.4';
            card.style.pointerEvents = 'auto';
        } else {
            card.style.opacity = '1';
        }
    });
}

function renderBuildingMenu() {
    const list = document.getElementById('building-list');
    list.innerHTML = '';
    
    for (const [type, building] of Object.entries(BUILDINGS)) {
        const card = document.createElement('div');
        card.className = 'building-card';
        card.dataset.type = type;
        
        const costText = Object.entries(building.cost)
            .map(([r, a]) => {
                const icons = { gold: '💰', wood: '🪵', stone: '🪨', scales: '🐲', wool: '🧶', leather: '👜', iron: '⚙️', food: '🌾' };
                return `${icons[r] || ''}${a}`;
            }).join(' ');
        
        card.innerHTML = `
            <span class="b-icon">${building.icon}</span>
            <span class="b-name">${building.name}</span>
            <span class="b-cost">${costText}</span>
        `;
        
        card.addEventListener('click', () => {
            showBuildingInfo(type);
            selectBuilding(type, card);
        });
        card.addEventListener('mouseenter', () => showBuildingInfo(type));
        
        list.appendChild(card);
    }
}

function selectBuilding(type, card) {
    // Special items trigger immediately
    if (type === 'new_island') {
        buyNewIsland();
        return;
    }
    
    if (type === 'bridge') {
        Game.selectedBuilding = 'bridge';
        Game.bridgeMode = false;
        Game.bridgeStart = null;
        document.querySelectorAll('.building-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        toggleBridgeMode();
        return;
    }
    
    // Toggle off if already selected
    if (Game.selectedBuilding === type) {
        Game.selectedBuilding = null;
        card.classList.remove('selected');
        showInfo('Geen gebouw geselecteerd.');
        return;
    }
    
    Game.bridgeMode = false;
    Game.bridgeStart = null;
    
    document.querySelectorAll('.building-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    Game.selectedBuilding = type;
    
    if (type === 'demolish') {
        showInfo('🔴 Sloopmodus: Klik op een gebouw, brug of leeg eiland om te slopen.');
    }
}

function showBuildingInfo(type) {
    const b = BUILDINGS[type];
    let html = `<p><strong>${b.icon} ${b.name}</strong></p>`;
    html += `<p>${b.description}</p>`;
    
    if (b.income && Object.keys(b.income).length > 0) {
        const incomeText = Object.entries(b.income).map(([r, a]) => {
            const icons = { gold: '💰', wood: '🪵', stone: '🪨', food: '🌾' };
            return `${icons[r]}${a > 0 ? '+' : ''}${a}`;
        }).join(' ');
        html += `<p style="color:#aaddff">Inkomen/10s: ${incomeText}</p>`;
    }
    
    const synergies = Object.entries(b.synergies);
    if (synergies.length > 0) {
        html += `<p class="info-bonus">Synergieën: ${synergies.map(([k, v]) => `${BUILDINGS[k]?.icon || ''}${v}`).join(', ')}</p>`;
    }
    
    const penalties = Object.entries(b.penalties);
    if (penalties.length > 0) {
        html += `<p class="info-penalty">Nadelen: ${penalties.map(([k, v]) => `${BUILDINGS[k]?.icon || ''}${v}`).join(', ')}</p>`;
    }
    
    document.getElementById('info-content').innerHTML = html;
}

// ============================================
// RENDERING
// ============================================
function gameLoop(timestamp) {
    if (!timestamp) timestamp = performance.now();
    if (!Game.lastTimestamp) Game.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - Game.lastTimestamp) / 1000, 0.1);
    Game.lastTimestamp = timestamp;
    
    Game.floatOffset += 0.02;
    
    // Update income timer
    if (Game.state) {
        tickIncome(dt);
        tickAlchemistConversions(dt);
    }
    
    updateParticles();
    updateWindParticles();
    updateDragon(dt);
    updateTrader(dt);
    render();
    Game.animationFrame = requestAnimationFrame(gameLoop);
}

function render() {
    const ctx = Game.ctx;
    const w = Game.canvas.width;
    const h = Game.canvas.height;
    
    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    
    // Stars background
    drawStars(ctx, w, h);
    
    // Draw wind particles
    drawWindParticles(ctx);
    
    ctx.save();
    ctx.translate(Game.camera.x, Game.camera.y);
    ctx.scale(Game.camera.zoom, Game.camera.zoom);
    
    // Draw bridges
    drawBridges(ctx);
    
    // Draw islands
    for (const island of Game.state.islands) {
        drawIsland(ctx, island);
    }
    
    // Draw trader
    drawTrader(ctx);
    
    // Draw particles
    drawParticles(ctx);
    
    ctx.restore();
    
    // Draw dragon animation
    drawDragon(ctx);
    
    // Draw income timer and preview
    drawHUD(ctx, w, h);
}

function drawStars(ctx, w, h) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const seed = 12345;
    for (let i = 0; i < 100; i++) {
        const x = ((seed * (i + 1) * 7) % w);
        const y = ((seed * (i + 1) * 13) % h);
        const size = (i % 3) + 0.5;
        const twinkle = Math.sin(Game.floatOffset * 2 + i) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawBridges(ctx) {
    for (const bridge of Game.state.bridges) {
        const fromIsland = Game.state.islands.find(i => i.id === bridge.from);
        const toIsland = Game.state.islands.find(i => i.id === bridge.to);
        if (!fromIsland || !toIsland) continue;
        
        const fromPos = getIslandScreenPos(fromIsland);
        const toPos = getIslandScreenPos(toIsland);
        
        // Draw rope bridge
        ctx.save();
        const healthColor = bridge.health > 50 ? 
            `rgba(200, 160, 80, ${bridge.health / 100})` : 
            `rgba(255, 80, 80, ${bridge.health / 100})`;
        
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = 5;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -Game.floatOffset * 20;
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        
        // Slight curve
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2 + 15;
        ctx.quadraticCurveTo(midX, midY, toPos.x, toPos.y);
        ctx.stroke();
        ctx.restore();
        
        // Health indicator
        if (bridge.health < 100) {
            ctx.fillStyle = bridge.health > 50 ? '#ffaa00' : '#ff4444';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${bridge.health}%`, midX, midY - 12);
        }
    }
}

function drawIsland(ctx, island) {
    const pos = getIslandScreenPos(island);
    const gridSize = island.size * CELL_SIZE;
    const totalWidth = gridSize + ISLAND_PADDING * 2;
    const totalHeight = gridSize + ISLAND_PADDING * 2;
    const left = pos.x - totalWidth / 2;
    const top = pos.y - totalHeight / 2;
    const startX = pos.x - gridSize / 2;
    const startY = pos.y - gridSize / 2;
    
    // Island shadow (below)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(pos.x + 5, pos.y + totalHeight / 2 + 18, totalWidth / 2 - 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Island base - nice rounded floating rock shape
    ctx.save();
    const grad = ctx.createRadialGradient(pos.x, pos.y - 10, 10, pos.x, pos.y + 20, totalWidth / 1.5);
    grad.addColorStop(0, '#4a7a4a');
    grad.addColorStop(0.6, '#2d5a2d');
    grad.addColorStop(1, '#1a3a1a');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    // Top surface - rounded rectangle
    const radius = 14;
    ctx.moveTo(left + radius, top);
    ctx.lineTo(left + totalWidth - radius, top);
    ctx.quadraticCurveTo(left + totalWidth, top, left + totalWidth, top + radius);
    ctx.lineTo(left + totalWidth, top + totalHeight - radius);
    ctx.quadraticCurveTo(left + totalWidth, top + totalHeight, left + totalWidth - radius, top + totalHeight);
    // Bottom rock shape
    ctx.lineTo(left + totalWidth - 20, top + totalHeight + 20);
    ctx.quadraticCurveTo(pos.x, top + totalHeight + 35, left + 20, top + totalHeight + 20);
    ctx.lineTo(left + radius, top + totalHeight);
    ctx.quadraticCurveTo(left, top + totalHeight, left, top + totalHeight - radius);
    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
    ctx.closePath();
    ctx.fill();
    
    // Border glow
    ctx.strokeStyle = 'rgba(100, 220, 100, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    
    // Grass top edge
    ctx.save();
    ctx.fillStyle = '#5a9a5a';
    ctx.beginPath();
    ctx.roundRect(left + 3, top + 3, totalWidth - 6, 8, [6, 6, 0, 0]);
    ctx.fill();
    ctx.restore();
    
    // Grid cells
    for (let r = 0; r < island.size; r++) {
        for (let c = 0; c < island.size; c++) {
            const cx = startX + c * CELL_SIZE;
            const cy = startY + r * CELL_SIZE;
            
            const isHovered = Game.hoveredCell && 
                Game.hoveredCell.island.id === island.id && 
                Game.hoveredCell.row === r && 
                Game.hoveredCell.col === c;
            
            // Cell background
            const isDemolishHover = isHovered && Game.selectedBuilding === 'demolish' && island.grid[r][c];
            ctx.fillStyle = isDemolishHover ? 
                'rgba(255, 60, 60, 0.35)' :
                isHovered ? 
                'rgba(120, 230, 120, 0.25)' : 
                'rgba(50, 100, 50, 0.25)';
            ctx.beginPath();
            ctx.roundRect(cx + 2, cy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
            ctx.fill();
            
            // Cell border
            ctx.strokeStyle = isHovered ? 
                'rgba(120, 230, 120, 0.4)' : 
                'rgba(100, 180, 100, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Building
            const building = island.grid[r][c];
            if (building) {
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#ffffff';
                ctx.font = '22px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    BUILDINGS[building].icon,
                    cx + CELL_SIZE / 2,
                    cy + CELL_SIZE / 2
                );
                // Draw pet dragons around the stable
                if ((building === 'dragon_stable' || building === 'drakennest') && Game.state.petDragons) {
                    const pets = Game.state.petDragons.filter(
                        p => p.islandId === island.id && p.row === r && p.col === c
                    );
                    for (let pi = 0; pi < pets.length; pi++) {
                        ctx.font = '12px sans-serif';
                        const angle = (pi / Math.max(pets.length, 1)) * Math.PI * 2 + Game.floatOffset;
                        const dx = Math.cos(angle) * 18;
                        const dy = Math.sin(angle) * 14;
                        ctx.fillText('🐉', cx + CELL_SIZE / 2 + dx, cy + CELL_SIZE / 2 + dy);
                    }
                }
            } else if (isHovered && Game.selectedBuilding && 
                       Game.selectedBuilding !== 'bridge' && 
                       Game.selectedBuilding !== 'new_island' &&
                       Game.selectedBuilding !== 'demolish') {
                // Ghost building preview
                ctx.globalAlpha = 0.4;
                ctx.font = '22px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    BUILDINGS[Game.selectedBuilding].icon,
                    cx + CELL_SIZE / 2,
                    cy + CELL_SIZE / 2
                );
                ctx.globalAlpha = 1;
            }
        }
    }
    
    // Island label
    ctx.globalAlpha = 1;
    ctx.fillStyle = island.type === 'start' ? 'rgba(255, 220, 100, 0.8)' : 'rgba(200, 220, 255, 0.7)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(island.name || 'Eiland', pos.x, top - 8);
    
    // Protection indicators (network-aware)
    const dragonProt = isIslandDragonProtected(island);
    const windProt = isIslandWindProtected(island);
    const indicators = [];
    if (dragonProt) indicators.push(island.hasTower ? '🛡️' : '🛡️*');
    if (windProt) indicators.push(island.hasTemple ? '⛩️' : '⛩️*');
    if (indicators.length > 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(indicators.join(' '), left + totalWidth + 5, top + 18);
    }
}

function drawHUD(ctx, w, h) {
    if (!Game.state) return;
    const income = calculateIncome();
    
    ctx.save();
    
    // Income bar at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(10, h - 35, 380, 28, 6);
    ctx.fill();
    
    ctx.fillStyle = '#99aabb';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    
    const timerSec = Math.ceil(Game.incomeTimer);
    let incomeText = `⏱️ ${timerSec}s  |  💰${income.gold >= 0 ? '+' : ''}${income.gold}  🪵${income.wood >= 0 ? '+' : ''}${income.wood}  🪨${income.stone >= 0 ? '+' : ''}${income.stone}  🌾${income.food >= 0 ? '+' : ''}${income.food}`;
    if (income.scales > 0) incomeText += `  🐲+${income.scales}`;
    if (income.wool > 0) incomeText += `  🧶+${income.wool}`;
    if (income.leather > 0) incomeText += `  👜+${income.leather}`;
    if (income.iron > 0) incomeText += `  ⚙️+${income.iron}`;
    ctx.fillText(incomeText, 20, h - 17);
    
    // Timer progress bar
    const barWidth = 380;
    const progress = 1 - (Game.incomeTimer / 10);
    ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
    ctx.beginPath();
    ctx.roundRect(10, h - 38, barWidth * progress, 3, 2);
    ctx.fill();
    
    ctx.restore();
}

// ============================================
// PARTICLES
// ============================================
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        Game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 2,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            color,
            size: 2 + Math.random() * 3,
        });
    }
}

function updateParticles() {
    Game.particles = Game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= p.decay;
        return p.life > 0;
    });
}

function drawParticles(ctx) {
    for (const p of Game.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function updateWindParticles() {
    if (!Game.state) return;
    
    if (Game.state.windLevel > 30 && Math.random() < Game.state.windLevel / 200) {
        Game.windParticles.push({
            x: -20,
            y: Math.random() * Game.canvas.height,
            speed: 2 + Math.random() * 3 + Game.state.windLevel / 30,
            size: 1 + Math.random() * 2,
            life: 1,
        });
    }
    
    Game.windParticles = Game.windParticles.filter(p => {
        p.x += p.speed;
        p.y += Math.sin(p.x / 50) * 0.5;
        p.life -= 0.005;
        return p.x < Game.canvas.width + 20 && p.life > 0;
    });
}

function drawWindParticles(ctx) {
    ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
    for (const p of Game.windParticles) {
        ctx.globalAlpha = p.life * 0.4;
        ctx.fillRect(p.x, p.y, p.size * 8, p.size);
    }
    ctx.globalAlpha = 1;
}

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', init);

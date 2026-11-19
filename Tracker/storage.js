function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
}

// build a DOM element safely (textContent keeps player names from running as HTML)
function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}

// played / wins for every player, calculated from the saved games
function getStats(players, games) {
    const stats = {};
    players.forEach(p => stats[p] = { played: 0, wins: 0 });
    games.forEach(g => {
        Object.keys(g.scores).forEach(name => {
            if (!stats[name]) stats[name] = { played: 0, wins: 0 };
            stats[name].played++;
        });
        if (g.winner) {
            if (!stats[g.winner]) stats[g.winner] = { played: 0, wins: 0 };
            stats[g.winner].wins++;
        }
    });
    return stats;
}
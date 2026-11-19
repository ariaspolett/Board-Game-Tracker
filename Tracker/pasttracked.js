let players = load("catan.players", []);
let games = load("catan.games", []);

function allNames() {
    return Object.keys(getStats(players, games));
}

function renderPlayerPicker() {
    const select = document.getElementById("playerSelect");
    const previous = select.value;
    select.innerHTML = "";
    allNames().forEach(n => { const o = el("option", n); o.value = n; select.appendChild(o); });
    if (previous) select.value = previous;
    renderPlayerStats();
}

function renderPlayerStats() {
    const name = document.getElementById("playerSelect").value;
    const out = document.getElementById("playerStats");
    if (!name) { out.textContent = "No players yet."; return; }
    const s = getStats(players, games)[name];
    out.textContent = name + ": " + s.wins + " won out of " + s.played + " played";
}

function renderLeaderboard() {
    const stats = getStats(players, games);
    const rows = Object.entries(stats).sort((a, b) => b[1].wins - a[1].wins || b[1].played - a[1].played);
    const body = document.getElementById("leaderboard");
    body.innerHTML = "";
    rows.forEach(([name, s]) => {
        const tr = document.createElement("tr");
        const rate = s.played ? Math.round((s.wins / s.played) * 100) + "%" : "-";
        [name, s.played, s.wins, rate].forEach(v => tr.appendChild(el("td", String(v))));
        body.appendChild(tr);
    });
}

function renderHistory() {
    const box = document.getElementById("history");
    box.innerHTML = "";
    if (!games.length) { box.appendChild(el("p", "No games recorded yet.")); return; }

    [...games].reverse().forEach(g => {
        const card = el("div", undefined, "info-card");
        card.appendChild(el("h3", g.date + " - Winner: " + g.winner));

        const list = el("ul");
        Object.entries(g.scores).sort((a, b) => b[1] - a[1])
            .forEach(([name, pts]) => list.appendChild(el("li", name + ": " + pts + " pts")));
        card.appendChild(list);

        const del = el("button", "Delete", "small-btn");
        del.type = "button";
        del.addEventListener("click", () => {
            if (!confirm("Delete this game?")) return;
            games = games.filter(x => x.id !== g.id);
            save("catan.games", games);
            renderAll();
        });
        card.appendChild(del);
        box.appendChild(card);
    });
}

function renderAll() {
    renderPlayerPicker();
    renderLeaderboard();
    renderHistory();
}

document.getElementById("playerSelect").addEventListener("change", renderPlayerStats);

// ---------- export / import ----------
document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ players, games }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "catan-games.json";
    a.click();
    URL.revokeObjectURL(a.href);
});

document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", async e => {
    const msg = document.getElementById("backupMsg");
    const file = e.target.files[0];
    if (!file) return;
    try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data.players) || !Array.isArray(data.games)) throw new Error("bad format");

        data.players.forEach(p => {
            if (!players.some(x => x.toLowerCase() === String(p).toLowerCase())) players.push(String(p));
        });
        const known = new Set(games.map(g => g.id));
        let added = 0;
        data.games.forEach(g => {
            if (g && g.id && g.scores && g.winner && !known.has(g.id)) { games.push(g); added++; }
        });
        games.sort((a, b) => a.id - b.id);

        save("catan.players", players);
        save("catan.games", games);
        renderAll();
        msg.textContent = "Imported " + added + " new game(s).";
    } catch {
        msg.textContent = "That file doesn't look like a Catan export.";
    }
    e.target.value = "";
});

renderAll();
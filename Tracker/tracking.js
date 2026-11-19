let known = load("catan.players", []);
let current = load("catan.current", { scores: {} });   // { scores: { Sam: 4, Alex: 6 } }

function saveCurrent() { save("catan.current", current); }

function topScorer() {
    const entries = Object.entries(current.scores);
    if (!entries.length) return "";
    return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function render() {
    const names = Object.keys(current.scores);

    // autocomplete list of players we've seen before
    const list = document.getElementById("knownPlayers");
    list.innerHTML = "";
    known.forEach(n => { const o = document.createElement("option"); o.value = n; list.appendChild(o); });

    // scoreboard rows
    const board = document.getElementById("scoreboard");
    board.innerHTML = "";
    names.forEach(name => {
        const row = el("div", undefined, "score-row");
        row.appendChild(el("span", name, "score-name"));

        const minus = el("button", "-", "small-btn");
        minus.type = "button";
        minus.addEventListener("click", () => changeScore(name, -1));

        row.appendChild(minus);
        row.appendChild(el("span", String(current.scores[name]), "score-pts"));

        const plus = el("button", "+", "small-btn");
        plus.type = "button";
        plus.addEventListener("click", () => changeScore(name, +1));
        row.appendChild(plus);

        const remove = el("button", "Remove", "small-btn");
        remove.type = "button";
        remove.addEventListener("click", () => {
            delete current.scores[name];
            saveCurrent();
            render();
        });
        row.appendChild(remove);

        if (current.scores[name] >= 10) row.classList.add("at-ten");
        board.appendChild(row);
    });
    document.getElementById("emptyMsg").style.display = names.length >= 2 ? "none" : "block";

    // winner dropdown, defaulting to the top scorer
    const select = document.getElementById("winnerSelect");
    const previous = select.value;
    select.innerHTML = "";
    names.forEach(n => { const o = el("option", n); o.value = n; select.appendChild(o); });
    select.value = names.includes(previous) ? previous : topScorer();
}

function changeScore(name, delta) {
    current.scores[name] = Math.max(0, Math.min(25, current.scores[name] + delta));
    saveCurrent();
    render();
}

document.getElementById("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const msg = document.getElementById("addMsg");
    const input = document.getElementById("playerName");
    const name = input.value.trim();
    msg.textContent = "";
    if (!name) return;

    if (Object.keys(current.scores).some(n => n.toLowerCase() === name.toLowerCase())) {
        msg.textContent = name + " is already in this game.";
    } else if (Object.keys(current.scores).length >= 6) {
        msg.textContent = "Catan supports up to 6 players with expansions.";
    } else {
        current.scores[name] = 0;
        if (!known.some(k => k.toLowerCase() === name.toLowerCase())) {
            known.push(name);
            save("catan.players", known);
        }
        saveCurrent();
    }
    input.value = "";
    render();
});

document.getElementById("finishBtn").addEventListener("click", () => {
    const msg = document.getElementById("finishMsg");
    const winner = document.getElementById("winnerSelect").value;
    msg.textContent = "";

    if (Object.keys(current.scores).length < 2) { msg.textContent = "Need at least 2 players."; return; }
    if (!winner) { msg.textContent = "Pick a winner."; return; }
    if (current.scores[winner] < 10) { msg.textContent = "The winner needs 10 or more points."; return; }

    const games = load("catan.games", []);        // re-read in case another tab added games
    games.push({
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        scores: { ...current.scores },
        winner
    });
    save("catan.games", games);

    current = { scores: {} };
    saveCurrent();
    render();
    msg.textContent = "Game saved! See it under Past Games.";
});

document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Cancel this game? Scores will be cleared.")) return;
    current = { scores: {} };
    saveCurrent();
    render();
});

render();
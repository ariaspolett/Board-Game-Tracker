/* hexbg.js - animated Catan-style hexagon background.
   Add this ONE line before </body> on every page:
       <script src="../hexbg.js"></script>
   (use "hexbg.js" with no "../" for a page in the project root)

   What it does:
   - draws a grid of hex tiles on a canvas behind the page
   - tiles gently pulse, and random tiles glow in Catan resource colors
   - tiles near the mouse or finger light up
   - picks light or dark lines to match the page's background color
   - holds still for people who have "reduce motion" turned on
*/
(function () {
    "use strict";

    var RESOURCES = ["#b5482f", "#2f6b3a", "#e8b93c", "#8fcf6a", "#7d8590"];
    var SIZE = 36;          // hex radius in pixels (bigger = fewer, larger tiles)
    var LIT_MS = 4500;      // how long a glowing tile takes to fade in and out
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var canvas = document.createElement("canvas");
    canvas.id = "hex-bg";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");

    var tiles = [];
    var width = 0;
    var height = 0;
    var mouse = { x: -9999, y: -9999 };
    var lineRGB = "255,255,255";
    var nextSpawn = 0;

    // light lines on dark pages, dark lines on light pages
    function detectLineColor() {
        var bg = getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/[\d.]+/g);
        if (!m || (m.length === 4 && parseFloat(m[3]) === 0)) return;
        var lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
        lineRGB = lum > 0.6 ? "43,29,14" : "255,255,255";
    }

    function build() {
        var dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        tiles = [];
        var w = Math.sqrt(3) * SIZE;     // tile width (pointy-top hexagons)
        var rowH = SIZE * 1.5;           // distance between rows
        var rows = Math.ceil(height / rowH) + 2;
        var cols = Math.ceil(width / w) + 2;

        for (var r = -1; r < rows; r++) {
            for (var c = -1; c < cols; c++) {
                tiles.push({
                    x: c * w + (Math.abs(r) % 2 ? w / 2 : 0),
                    y: r * rowH,
                    phase: Math.random() * Math.PI * 2,
                    litAt: -LIT_MS,
                    color: RESOURCES[0]
                });
            }
        }
        draw(performance.now());
    }

    function hexPath(x, y, s) {
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
            var a = (Math.PI / 180) * (60 * i - 30);
            var px = x + s * Math.cos(a);
            var py = y + s * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    function draw(now) {
        ctx.clearRect(0, 0, width, height);

        // every so often, light up one random tile in a resource color
        if (!reduceMotion && now > nextSpawn && tiles.length) {
            var pick = tiles[Math.floor(Math.random() * tiles.length)];
            if (now - pick.litAt > LIT_MS) {
                pick.litAt = now;
                pick.color = RESOURCES[Math.floor(Math.random() * RESOURCES.length)];
            }
            nextSpawn = now + 300 + Math.random() * 500;
        }

        ctx.lineWidth = 2;
        for (var i = 0; i < tiles.length; i++) {
            var t = tiles[i];
            var pulse = reduceMotion ? 0 : Math.sin(now * 0.0007 + t.phase);
            var lineAlpha = 0.08 + 0.04 * pulse;
            var fillAlpha = 0;

            var age = now - t.litAt;
            if (!reduceMotion && age >= 0 && age < LIT_MS) {
                fillAlpha = Math.sin(Math.PI * (age / LIT_MS)) * 0.32;
            }

            // tiles near the pointer light up
            var dx = t.x - mouse.x;
            var dy = t.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                var k = 1 - dist / 150;
                lineAlpha += k * 0.25;
                fillAlpha = Math.max(fillAlpha, k * 0.14);
            }

            hexPath(t.x, t.y, SIZE - 2);
            if (fillAlpha > 0.005) {
                ctx.globalAlpha = fillAlpha;
                ctx.fillStyle = t.color;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = "rgba(" + lineRGB + "," + lineAlpha + ")";
            ctx.stroke();
        }
    }

    function loop(now) {
        draw(now);
        requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (reduceMotion) draw(0);
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
    });

    detectLineColor();
    build();
    if (!reduceMotion) requestAnimationFrame(loop);
})();

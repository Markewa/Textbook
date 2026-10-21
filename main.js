(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const typeset = (node) => {
    const run = () => window.MathJax && MathJax.typesetPromise ? MathJax.typesetPromise(node ? [node] : undefined).catch(() => {}) : null;
    if (window.MathJax && MathJax.typesetPromise) run();
    else window.addEventListener("load", () => setTimeout(run, 300), { once: true });
  };

  /* ---------- table of contents ---------- */
  const toc = $("#toc"), tocBtn = $("#tocToggle");
  tocBtn.addEventListener("click", () => {
    const closed = toc.classList.toggle("closed");
    tocBtn.setAttribute("aria-expanded", String(!closed));
  });
  const links = $$(".toc a");
  const byId = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.remove("on"));
          const a = byId.get(en.target.id);
          if (a) a.classList.add("on");
        }
      });
    }, { rootMargin: "0px 0px -70% 0px" });
    $$("section.sec[id]").forEach(s => io.observe(s));
  }

  /* ---------- quizzes ---------- */
  const session = {};           // quiz id -> {score, total, done}
  const quizTitles = {};
  const onQuizDone = [];
  $$(".quiz").forEach(quiz => {
    const qid = quiz.dataset.quiz;
    quizTitles[qid] = quiz.dataset.title;
    const items = $$(".qitem", quiz);
    const top = document.createElement("div");
    top.className = "quiz-top";
    top.innerHTML = `<strong>${quiz.dataset.title}</strong><span class="score" aria-live="polite">0 of ${items.length} answered · 0 correct</span>`;
    quiz.prepend(top);
    const foot = document.createElement("div");
    foot.className = "quiz-foot";
    foot.innerHTML = `<button type="button" class="ghost" data-act="reset">Start again</button><button type="button" data-act="save" hidden>Save result</button><span data-msg></span>`;
    quiz.append(foot);
    const scoreEl = $(".score", top), msg = $("[data-msg]", foot), saveBtn = $("[data-act=save]", foot);
    let answered = 0, correct = 0;
    session[qid] = { score: 0, total: items.length, done: false };

    items.forEach((item, qi) => {
      const p = item.querySelector("p");
      p.insertAdjacentHTML("afterbegin", `<span class="qn">${qi + 1}.</span>`);
      $$(".opts > li", item).forEach(li => {
        const why = li.querySelector(".why");
        why.hidden = true;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML = `<span class="ltr">${li.dataset.k}</span><span class="otext"></span>`;
        const otext = btn.querySelector(".otext");
        Array.from(li.childNodes).forEach(n => { if (n !== why) otext.appendChild(n); });
        otext.appendChild(why);
        li.prepend(btn);
        btn.addEventListener("click", () => {
          if (item.dataset.done) return;
          item.dataset.done = "1";
          const ok = li.dataset.k === item.dataset.answer;
          answered++; if (ok) correct++;
          $$(".opts > li", item).forEach(o => {
            o.querySelector("button").disabled = true;
            o.querySelector(".why").hidden = false;
            if (o.dataset.k === item.dataset.answer) o.classList.add("ok");
            else if (o === li) o.classList.add("no");
            else o.classList.add("dim");
          });
          scoreEl.textContent = `${answered} of ${items.length} answered · ${correct} correct`;
          session[qid].score = correct;
          if (answered === items.length) {
            session[qid].done = true;
            msg.textContent = `Finished: ${correct} / ${items.length}.`;
            onQuizDone.forEach(f => f(qid, correct, items.length, saveBtn, msg));
          }
          renderMine();
        });
      });
    });
    $("[data-act=reset]", foot).addEventListener("click", () => {
      answered = 0; correct = 0;
      session[qid] = { score: 0, total: items.length, done: false };
      items.forEach(item => {
        delete item.dataset.done;
        $$(".opts > li", item).forEach(o => {
          o.classList.remove("ok", "no", "dim");
          o.querySelector("button").disabled = false;
          o.querySelector(".why").hidden = true;
        });
      });
      scoreEl.textContent = `0 of ${items.length} answered · 0 correct`;
      msg.textContent = ""; saveBtn.hidden = true;
      renderMine();
      quiz.scrollIntoView({ block: "start" });
    });
  });

  /* ---------- results (saved in this browser) ---------- */
  const STORE = "counting-steps-results";
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { saved = null; }
  const fmtDate = s => { try { return new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  function renderMine() {
    const tb = $("#myTable tbody");
    tb.innerHTML = "";
    ["entry", "m1", "m2"].forEach(q => {
      const s = session[q], sv = saved && saved.scores && saved.scores[q];
      const tr = document.createElement("tr");
      const cells = [quizTitles[q] || q,
        s.done ? `${s.score} / ${s.total}` : (s.score ? `${s.score} so far` : "—"),
        sv ? `${sv.best} / ${sv.total}` : "—",
        sv ? `${sv.attempts}` : "—",
        sv ? fmtDate(sv.at) : "—"];
      cells.forEach((c, i) => { const td = document.createElement("td"); td.textContent = c; if (i) td.className = "n"; tr.appendChild(td); });
      tb.appendChild(tr);
    });
  }
  renderMine();

  onQuizDone.push((qid, score, total, saveBtn, msg) => {
    const body = JSON.parse(JSON.stringify(saved || { scores: {} }));
    const prev = body.scores[qid];
    body.scores[qid] = { last: score, best: Math.max(score, prev ? prev.best : 0), total, attempts: (prev ? prev.attempts : 0) + 1, at: new Date().toISOString() };
    try {
      localStorage.setItem(STORE, JSON.stringify(body));
      saved = body;
      msg.textContent += " Saved in this browser — see My results.";
    } catch (e) {
      msg.textContent += " Your browser does not allow saving, so the score is kept only until you close the page.";
    }
    renderMine();
  });

  const clearBtn = $("#resClear");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    try { localStorage.removeItem(STORE); } catch (e) {}
    saved = null; renderMine();
  });

  /* ---------- Figure 0.1: growth chart ---------- */
  const gSvg = $("#growthChart");
  const series = [
    { name: "log₂ n", f: n => Math.log2(n), col: "var(--good)" },
    { name: "n", f: n => n, col: "var(--ink-2)" },
    { name: "n log₂ n", f: n => n * Math.log2(n), col: "var(--accent)" },
    { name: "n²", f: n => n * n, col: "var(--mark)" },
    { name: "2ⁿ", f: n => 2 ** n, col: "var(--bad)" },
  ];
  function drawGrowth(log) {
    gSvg.innerHTML = "";
    const L = 52, R = 540, T = 14, B = 296, N = 20;
    const ymax = log ? 2 ** 20 : 400;
    const ys = v => log ? B - (Math.log10(Math.max(v, 1)) / Math.log10(ymax)) * (B - T) : B - (v / ymax) * (B - T);
    const xs = n => L + ((n - 1) / (N - 1)) * (R - L);
    const ticks = log ? [1, 10, 100, 1000, 1e4, 1e5, 1e6] : [0, 100, 200, 300, 400];
    ticks.forEach(t => {
      el("line", { x1: L, x2: R, y1: ys(t), y2: ys(t), class: "ax" }, gSvg);
      const tx = el("text", { x: L - 6, y: ys(t) + 4, "text-anchor": "end", class: "axl" }, gSvg);
      tx.textContent = t >= 1000 ? (t >= 1e6 ? "10⁶" : t >= 1e5 ? "10⁵" : t >= 1e4 ? "10⁴" : "10³") : String(t);
    });
    [1, 5, 10, 15, 20].forEach(n => { const tx = el("text", { x: xs(n), y: B + 18, "text-anchor": "middle", class: "axl" }, gSvg); tx.textContent = n; });
    const xl = el("text", { x: R, y: B + 32, "text-anchor": "end", class: "axl" }, gSvg); xl.textContent = "n";
    const clipId = "gclip";
    const defs = el("defs", {}, gSvg);
    const cp = el("clipPath", { id: clipId }, defs);
    el("rect", { x: L, y: T, width: R - L, height: B - T }, cp);
    series.forEach((s, si) => {
      let d = "", lastY = null, lastN = N;
      for (let n = 1; n <= N; n += 0.25) {
        const y = ys(s.f(n));
        d += (d ? "L" : "M") + xs(n).toFixed(1) + "," + y.toFixed(1);
        if (y >= T && lastY === null) lastN = n;
        if (y < T && lastY === null) lastY = n;
      }
      el("path", { d, class: "cv", stroke: s.col, "clip-path": `url(#${clipId})` }, gSvg);
      // label at the right end, or where the curve leaves the chart
      let nLab = N, yLab = ys(s.f(N));
      if (yLab < T) { nLab = lastY - 0.25; yLab = T + 10; }
      const offsets = log ? [0, 0, 0, 0, 0] : [9, -5, 0, 0, 0];
      const tx = el("text", { x: Math.min(xs(nLab) + 6, 630), y: Math.max(yLab + offsets[si], T + 8), class: "lab-t", fill: s.col }, gSvg);
      tx.textContent = s.name;
    });
  }
  drawGrowth(false);
  $("#gLin").addEventListener("click", () => { drawGrowth(false); $("#gLin").setAttribute("aria-pressed", "true"); $("#gLog").setAttribute("aria-pressed", "false"); });
  $("#gLog").addEventListener("click", () => { drawGrowth(true); $("#gLog").setAttribute("aria-pressed", "true"); $("#gLin").setAttribute("aria-pressed", "false"); });

  /* ---------- Figure 1.1: staircase ---------- */
  (function () {
    const s = $("#stairFig"), n = 6, cell = 30, x0 = 52, y0 = 20;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= n + 1; j++) {
        const blue = j <= i;
        el("circle", { cx: x0 + (j - 1) * cell + cell / 2, cy: y0 + (i - 1) * cell + cell / 2, r: 10, fill: blue ? "var(--accent)" : "var(--rule)" }, s);
      }
      const t = el("text", { x: x0 - 10, y: y0 + (i - 1) * cell + cell / 2 + 4, "text-anchor": "end", class: "axl" }, s);
      t.textContent = "i = " + i;
    }
    el("rect", { x: x0 - 2, y: y0 - 2, width: (n + 1) * cell + 4, height: n * cell + 4, fill: "none", stroke: "var(--ink-2)", "stroke-dasharray": "4 3" }, s);
    const tx = (x, y, str, cls, fill) => { const t = el("text", { x, y, class: cls || "lab-t", fill: fill || "var(--ink)" }, s); t.textContent = str; };
    const X = x0 + (n + 1) * cell + 26;
    tx(X, 50, "blue: 1 + 2 + … + 6 = 21", "lab-t", "var(--accent)");
    tx(X, 74, "grey: the same staircase, upside down", "axl");
    tx(X, 110, "together: 6 × 7 = 42 dots", "lab-t");
    tx(X, 134, "so 1 + … + n = n(n+1)/2", "lab-t", "var(--mark)");
    tx(X, 170, "TriangleCount(6) runs its", "axl");
    tx(X, 186, "inner loop exactly 21 times", "axl");
  })();

  /* ---------- tree drawing helper ---------- */
  function drawTree(svg, root, children, label, colorOf, W, levelH, r) {
    // compute leaf order positions
    const nodes = [];
    let leafX = 0;
    (function walk(v, depth) {
      const ch = children(v);
      const node = { v, depth, kids: [] };
      if (!ch.length) { node.x = leafX++; }
      else {
        ch.forEach(c => node.kids.push(walk(c, depth + 1)));
        node.x = (node.kids[0].x + node.kids[node.kids.length - 1].x) / 2;
      }
      nodes.push(node);
      return node;
    })(root, 0);
    const span = Math.max(leafX - 1, 1);
    const pad = r + 6;
    const px = x => pad + (x / span) * (W - 2 * pad);
    const py = d => r + 8 + d * levelH;
    nodes.forEach(nd => nd.kids.forEach(k => el("line", { x1: px(nd.x), y1: py(nd.depth), x2: px(k.x), y2: py(k.depth), class: "edge" }, svg)));
    nodes.forEach(nd => {
      const c = colorOf(nd.v);
      el("circle", { cx: px(nd.x), cy: py(nd.depth), r, fill: c.fill, stroke: c.stroke, class: "node" }, svg);
      const t = el("text", { x: px(nd.x), y: py(nd.depth), class: "ntext" }, svg);
      t.textContent = label(nd.v);
    });
    return nodes;
  }

  /* Figure 2.1: Hanoi(4) */
  (function () {
    const s = $("#hanoiTree");
    drawTree(s, 4, v => v > 1 ? [v - 1, v - 1] : [], v => String(v),
      () => ({ fill: "var(--accent-soft)", stroke: "var(--accent)" }), 510, 62, 14);
    [["level 0: 1 call", 1], ["level 1: 2 calls", 2], ["level 2: 4 calls", 4], ["level 3: 8 calls", 8]].forEach((a, d) => {
      const t = el("text", { x: 636, y: 14 + 8 + d * 62 + 4, "text-anchor": "end", class: "axl" }, s);
      t.textContent = a[0];
    });
  })();

  /* Figure 2.2: FibRec(5) */
  (function () {
    const s = $("#fibTree");
    const pal = {
      5: { fill: "var(--sheet)", stroke: "var(--ink-2)" },
      4: { fill: "var(--sheet)", stroke: "var(--ink-2)" },
      3: { fill: "var(--mark-soft)", stroke: "var(--mark)" },
      2: { fill: "var(--accent-soft)", stroke: "var(--accent)" },
      1: { fill: "var(--good-soft)", stroke: "var(--good)" },
      0: { fill: "var(--bad-soft)", stroke: "var(--bad)" },
    };
    drawTree(s, 5, v => v > 1 ? [v - 1, v - 2] : [], v => "F" + v, v => pal[v], 680, 58, 15);
  })();

  /* Figure 2.3: Fibonacci additions, log scale */
  (function () {
    const s = $("#fibChart");
    const L = 56, R = 600, T = 14, B = 262, N0 = 2, N1 = 30;
    const Fn = n => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };
    const maxV = 1e7;
    const xs = n => L + ((n - N0) / (N1 - N0)) * (R - L);
    const ys = v => B - (Math.log10(Math.max(v, 1)) / Math.log10(maxV)) * (B - T);
    [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7].forEach((t, i) => {
      el("line", { x1: L, x2: R, y1: ys(t), y2: ys(t), class: "ax" }, s);
      const tx = el("text", { x: L - 6, y: ys(t) + 4, "text-anchor": "end", class: "axl" }, s);
      tx.textContent = i < 3 ? String(t) : "10" + "⁰¹²³⁴⁵⁶⁷"[i];
    });
    [2, 10, 20, 30].forEach(n => { const tx = el("text", { x: xs(n), y: B + 18, "text-anchor": "middle", class: "axl" }, s); tx.textContent = n; });
    const xl = el("text", { x: R, y: B + 32, "text-anchor": "end", class: "axl" }, s); xl.textContent = "n";
    let d1 = "", d2 = "";
    for (let n = N0; n <= N1; n++) {
      const a = Fn(n + 1) - 1, b = n - 1;
      d1 += (d1 ? "L" : "M") + xs(n) + "," + ys(a);
      d2 += (d2 ? "L" : "M") + xs(n) + "," + ys(b);
      el("circle", { cx: xs(n), cy: ys(a), r: 2.6, fill: "var(--bad)" }, s);
      el("circle", { cx: xs(n), cy: ys(b), r: 2.6, fill: "var(--accent)" }, s);
    }
    el("path", { d: d1, class: "cv", stroke: "var(--bad)" }, s);
    el("path", { d: d2, class: "cv", stroke: "var(--accent)" }, s);
    const t1 = el("text", { x: xs(N1) - 4, y: ys(Fn(31) - 1) - 10, "text-anchor": "end", class: "lab-t", fill: "var(--bad)" }, s); t1.textContent = "naive: F(n+1) − 1 = 1 346 268 at n = 30";
    const t2 = el("text", { x: xs(N1) - 4, y: ys(29) - 10, "text-anchor": "end", class: "lab-t", fill: "var(--accent)" }, s); t2.textContent = "memo / iterative: n − 1";
  })();

  /* ---------- counter labs ---------- */
  const flog = (n, b) => { let k = 0; while (b ** (k + 1) <= n) k++; return k; };
  const popc = n => n.toString(2).split("").filter(c => c === "1").length;
  const randArr = n => { const a = []; const used = new Set(); while (a.length < n) { const v = Math.floor(Math.random() * 100000); if (!used.has(v)) { used.add(v); a.push(v); } } return a; };
  const lab1 = {
    max: { ns: [1, 2, 5, 10, 100, 1000], run: n => { const a = randArr(n); let c = 0, m = a[0]; for (let i = 1; i < n; i++) { c++; if (a[i] > m) m = a[i]; } return c; }, f: n => n - 1 },
    uniqW: { ns: [2, 3, 5, 10, 100, 500], run: n => { const a = randArr(n); let c = 0; outer: for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) { c++; if (a[i] === a[j]) break outer; } return c; }, f: n => n * (n - 1) / 2 },
    tri: { ns: [1, 2, 3, 6, 10, 100], run: n => { let c = 0; for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j++) c++; return c; }, f: n => n * (n + 1) / 2 },
    mat: { ns: [1, 2, 3, 5, 10, 40], run: n => { let c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) c++; return c; }, f: n => n ** 3 },
    dbl: { ns: [1, 2, 7, 8, 10, 1000, 1024, 1025], run: n => { let c = 0, i = 1; while (i <= n) { c++; i *= 2; } return c; }, f: n => flog(n, 2) + 1 },
    sel: { ns: [1, 2, 5, 10, 100, 500], run: n => { const a = randArr(n); let c = 0; for (let i = 0; i < n - 1; i++) { let m = i; for (let j = i + 1; j < n; j++) { c++; if (a[j] < a[m]) m = j; } [a[i], a[m]] = [a[m], a[i]]; } return c; }, f: n => n * (n - 1) / 2 },
    poly: { ns: [0, 1, 2, 5, 10, 100], run: n => { let c = 0; for (let i = 0; i <= n; i++) { for (let j = 1; j <= i; j++) c++; c++; } return c; }, f: n => (n + 1) * (n + 2) / 2 },
    horner: { ns: [0, 1, 2, 5, 10, 100], run: n => { let c = 0; for (let i = n - 1; i >= 0; i--) c++; return c; }, f: n => n },
  };
  const lab2 = {
    fact: { ns: [0, 1, 2, 5, 10, 50], run: n => { let c = 0; const F = k => k === 0 ? 1 : (c++, F(k - 1) * k); F(n); return c; }, f: n => n },
    hanoi: { ns: [1, 2, 3, 5, 10, 16], run: n => { let c = 0; const H = k => { if (k === 1) { c++; return; } H(k - 1); c++; H(k - 1); }; H(n); return c; }, f: n => 2 ** n - 1 },
    binrec: { ns: [1, 2, 3, 8, 15, 16, 1000, 1024], run: n => { let c = 0; const B = k => k === 1 ? 1 : (c++, B(Math.floor(k / 2)) + 1); B(n); return c; }, f: n => flog(n, 2) },
    recmax: { ns: [1, 2, 5, 10, 100, 1000], run: n => { const a = randArr(n); let c = 0; const M = k => { if (k === 1) return a[0]; const m = M(k - 1); c++; return a[k - 1] > m ? a[k - 1] : m; }; M(n); return c; }, f: n => n - 1 },
    pow: { ns: [1, 2, 3, 7, 8, 15, 16, 100, 1000, 1023, 1024], run: n => { let c = 0; const P = k => { if (k === 0) return 1; const h = P(Math.floor(k / 2)); if (k % 2 === 0) { c++; return h; } c += 2; return h; }; P(n); return c; }, f: n => flog(n, 2) + 1 + popc(n) },
    fib: { ns: [0, 1, 2, 5, 10, 15, 20, 25], run: n => { let c = 0; const F = k => k <= 1 ? k : (c++, F(k - 1) + F(k - 2)); F(n); return c; }, f: n => { let a = 0, b = 1; for (let i = 0; i < n + 1; i++) [a, b] = [b, a + b]; return a - 1; } },
    draw: { ns: [0, 1, 2, 3, 5, 8], run: n => { let c = 0; const D = k => { c++; if (k > 0) { D(k - 1); D(k - 1); D(k - 1); } }; D(n); return c; }, f: n => (3 ** (n + 1) - 1) / 2 },
  };
  function wireLab(selId, btnId, tableId, defs) {
    const go = () => {
      const d = defs[$(selId).value];
      const tb = $(tableId + " tbody");
      tb.innerHTML = "";
      d.ns.forEach(n => {
        const got = d.run(n), want = d.f(n), ok = got === want;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="n">${n}</td><td class="n">${got.toLocaleString("en-US")}</td><td class="n">${want.toLocaleString("en-US")}</td><td><span class="${ok ? "ok-pill" : "no-pill"}">${ok ? "match" : "differs"}</span></td>`;
        tb.appendChild(tr);
      });
    };
    $(btnId).addEventListener("click", go);
    $(selId).addEventListener("change", go);
    go();
  }
  wireLab("#lab1Alg", "#lab1Run", "#lab1Table", lab1);
  wireLab("#lab2Alg", "#lab2Run", "#lab2Table", lab2);

  /* open the section named in the link */
  if (location.hash.length > 1) {
    const t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(() => t.scrollIntoView(), 400);
  }
})();

(async function () {
  // ---------- load & clean ----------
  const raw = await d3.text("data/incidents.csv");
  const rows = d3.csvParse(raw.replace(/^﻿/, "")).filter(r => r.Date && r.Category);
  const MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };

  // grouping of the free-text "Affected agentic AI" column into vendor families (first match wins)
  const VENDORS = [
    ["Coding agents & dev tools", /codex|cursor|github|copilot cli|(?<!anthropic )mcp|a2a|postmark|coding assist|dev agent|developers using|cline|replit|flowise|langsmith|langchain|metagpt|lovable|figma|amazon q|visual studio|cortex|ai-generated/i],
    ["Anthropic", /claude|anthropic/i],
    ["OpenAI", /chatgpt|openai|gpt/i],
    ["xAI", /grok|^xai/i],
    ["Google", /gemini|bard|google/i],
    ["Microsoft", /microsoft|bing|semantic kernel|sharepoint|copilot/i],
    ["Meta", /^meta/i],
    ["Companion apps", /character\.?ai|replika|chai chatbot|nomi|glimpse|secret desires|tigerweb/i],
  ];
  const OTHER = "Other / non-vendor";
  const vendorOf = name => (VENDORS.find(([, re]) => re.test(name)) || [OTHER])[0];

  const incidents = rows.map(r => {
    const [mon, yy] = r.Date.split("-");
    const year = 2000 + +yy, month = MONTHS[mon];
    return {
      system: r["Affected agentic AI"], cls: r.Class, cat: r.Category,
      vendor: vendorOf(r["Affected agentic AI"]),
      label: `${mon} 20${yy}`, t: year * 12 + month,
      bin: (year - 2021) * 2 + (month >= 6 ? 1 : 0),
    };
  });
  const NBINS = d3.max(incidents, d => d.bin) + 1;

  // ---------- axes: rows grouped by class, then by total ----------
  const CLASS_ORDER = ["Safety/guardrail failure", "Security exploit", "Data exposure"];
  const CLASS_LABEL = { "Safety/guardrail failure": "Safety / guardrail failure", "Security exploit": "Security exploit", "Data exposure": "Data exposure" };
  const catTotal = d3.rollup(incidents, v => v.length, d => d.cat);
  const catClass = new Map(incidents.map(d => [d.cat, d.cls]));
  const cats = [...catTotal.keys()].sort((a, b) =>
    CLASS_ORDER.indexOf(catClass.get(a)) - CLASS_ORDER.indexOf(catClass.get(b)) || catTotal.get(b) - catTotal.get(a));
  const vTotal = d3.rollup(incidents, v => v.length, d => d.vendor);
  const vendors = [...vTotal.keys()].filter(v => v !== OTHER).sort((a, b) => vTotal.get(b) - vTotal.get(a)).concat(vTotal.has(OTHER) ? [OTHER] : []);
  const VSHORT = { "Coding agents & dev tools": ["Coding agents", "& dev tools"], "Companion apps": ["Companion", "apps"], [OTHER]: ["Other /", "non-vendor"] };

  const cellCount = d3.rollup(incidents, v => v.length, d => d.cat, d => d.vendor);
  const maxCell = d3.max([...cellCount.values()], m => d3.max([...m.values()]));

  // ---------- layout ----------
  const W = 1100, labelW = 200, cw = 68, ch = 24, groupGap = 22, headH = 64;
  const barX = labelW + vendors.length * cw + 14, barW = 64;
  const spX = barX + barW + 44, bw = 14, spW = NBINS * bw;
  const totalW = spX + spW + 8;
  const rowY = {}; let y = headH; let prevClass = null; const groupTop = {}, groupBot = {};
  cats.forEach(c => {
    const k = catClass.get(c);
    if (prevClass && k !== prevClass) y += groupGap;
    if (k !== prevClass) groupTop[k] = y;
    rowY[c] = y; groupBot[k] = y + ch; y += ch; prevClass = k;
  });
  const bodyBottom = y;
  const colTotH = 34, H = bodyBottom + colTotH + 34;

  const color = d3.scaleSequentialSqrt([0, maxCell], d3.interpolateRgb("#ece7da", "#243b53"));
  const dark = t => (t / maxCell) > 0.28;   // switch to light text on dark cells
  const spMax = d3.max(incidents.length ? [...d3.rollup(incidents, v => v.length, d => d.cat, d => d.bin).values()] : [], m => d3.max([...m.values()]));
  const sy = d3.scaleLinear([0, spMax], [0, ch - 4]);

  const svg = d3.select("#chart").append("svg").attr("viewBox", `0 0 ${totalW} ${H}`).attr("role", "img");
  const xCol = v => labelW + vendors.indexOf(v) * cw;

  // ---------- column headers (clickable) ----------
  const heads = svg.append("g");
  vendors.forEach(v => {
    const g = heads.append("g").attr("class", "vhead").style("cursor", "pointer").on("click", () => toggle({ vendor: v }));
    (VSHORT[v] || [v]).forEach((ln, i, a) =>
      g.append("text").attr("x", xCol(v) + cw / 2).attr("y", headH - 12 - (a.length - 1 - i) * 13).attr("text-anchor", "middle").attr("font-size", 12).text(ln));
  });
  svg.append("text").attr("x", spX).attr("y", headH - 26).attr("font-size", 12).text("Incidents per half-year");
  svg.append("text").attr("x", spX).attr("y", headH - 12).attr("font-size", 11).attr("class", "faint").text("same scale in every row");
  svg.append("text").attr("x", barX).attr("y", headH - 12).attr("font-size", 12).text("Row total");

  // ---------- class labels (separation by space) ----------
  CLASS_ORDER.forEach(k => {
    const n = d3.sum(incidents, d => d.cls === k);
    svg.append("text").attr("x", 0).attr("y", groupTop[k] - 6).attr("font-size", 12).attr("font-style", "italic").attr("class", "faint")
      .text(`${CLASS_LABEL[k]} · ${n}`);
  });

  // ---------- rows ----------
  const rowG = svg.selectAll("g.row").data(cats).join("g").attr("class", "row").attr("data-cat", d => d)
    .attr("transform", d => `translate(0,${rowY[d]})`);

  rowG.append("text").attr("x", labelW - 10).attr("y", ch / 2 + 4).attr("text-anchor", "end").attr("font-size", 13).style("cursor", "pointer")
    .text(d => d).on("click", (e, d) => toggle({ cat: d }));

  // cells
  const cellData = cats.flatMap(c => vendors.map(v => ({ cat: c, vendor: v, n: (cellCount.get(c) || new Map()).get(v) || 0 })));
  const cellSel = svg.append("g").attr("id", "cells");
  const cells = cellSel.selectAll("g.cell").data(cellData.filter(d => d.n > 0)).join("g").attr("class", "cell row")
    .attr("data-cat", d => d.cat)
    .attr("transform", d => `translate(${xCol(d.vendor)},${rowY[d.cat]})`)
    .on("mouseenter", (e, d) => hover(d)).on("mouseleave", () => hover(null))
    .on("click", (e, d) => toggle({ cat: d.cat, vendor: d.vendor }));
  cells.append("title").text(d => `${d.cat} × ${d.vendor}: ${d.n}`);
  cells.append("rect").attr("class", "fill").attr("x", 1).attr("y", 1).attr("width", cw - 2).attr("height", ch - 2);
  const labels = cells.append("text").attr("class", "num").attr("x", cw / 2).attr("y", ch / 2 + 4).attr("text-anchor", "middle").attr("font-size", 12);
  const dotsG = cells.append("g").attr("class", "dots").style("display", "none");
  dotsG.each(function (d) {
    const per = 6, step = 8, r = 2.6;
    const rowsNeeded = Math.ceil(d.n / per);
    const g = d3.select(this);
    d3.range(d.n).forEach(i => {
      const col = i % per, rw = Math.floor(i / per);
      const w = Math.min(per, d.n - rw * per);
      g.append("circle").attr("r", r).attr("cx", cw / 2 + (col - (w - 1) / 2) * step)
        .attr("cy", ch / 2 + (rw - (rowsNeeded - 1) / 2) * 7);
    });
  });

  // row-total bars
  const bx = d3.scaleLinear([0, d3.max([...catTotal.values()])], [0, barW]);
  rowG.append("rect").attr("x", barX).attr("y", 8).attr("height", ch - 16).attr("width", d => bx(catTotal.get(d))).attr("fill", "var(--faint)");
  rowG.append("text").attr("x", d => barX + bx(catTotal.get(d)) + 4).attr("y", ch / 2 + 4).attr("font-size", 11).attr("class", "faint").text(d => catTotal.get(d));

  // small multiples: gray = all, dark overlay = highlighted subset
  const spG = rowG.append("g").attr("transform", `translate(${spX},0)`);
  spG.append("line").attr("x1", 0).attr("x2", spW).attr("y1", ch - 2).attr("y2", ch - 2).attr("stroke", "var(--rule)");
  const binCounts = d3.rollup(incidents, v => v.length, d => d.cat, d => d.bin);
  spG.each(function (cat) {
    const g = d3.select(this);
    d3.range(NBINS).forEach(b => {
      const n = (binCounts.get(cat) || new Map()).get(b) || 0;
      if (n) g.append("rect").attr("class", "all").attr("x", b * bw + 1).attr("width", bw - 2).attr("y", ch - 2 - sy(n)).attr("height", sy(n)).attr("fill", "var(--rule)");
      g.append("rect").attr("class", "sub").attr("data-bin", b).attr("x", b * bw + 1).attr("width", bw - 2).attr("y", ch - 2).attr("height", 0).attr("fill", "var(--accent)");
    });
  });

  // shared time axis
  const ax = svg.append("g").attr("transform", `translate(${spX},${bodyBottom + 2})`);
  d3.range(0, NBINS, 2).forEach(b => {
    ax.append("line").attr("x1", b * bw).attr("x2", b * bw).attr("y1", 0).attr("y2", 4).attr("stroke", "var(--faint)");
    ax.append("text").attr("x", b * bw).attr("y", 17).attr("font-size", 11).attr("class", "faint").attr("text-anchor", "middle").text(2021 + b / 2);
  });

  // data-driven annotation on the chart itself
  const sec = incidents.filter(d => d.cls === "Security exploit");
  const late = sec.filter(d => d.t >= 2025 * 12).length;
  svg.append("text").attr("x", spX).attr("y", groupBot["Security exploit"] + 16).attr("font-size", 11.5).attr("font-style", "italic")
    .text(`${late} of ${sec.length} security exploits`);
  svg.append("text").attr("x", spX).attr("y", groupBot["Security exploit"] + 30).attr("font-size", 11.5).attr("font-style", "italic")
    .text("are dated 2025 or later");

  // column totals (marginal) under the grid
  const cbx = d3.scaleLinear([0, d3.max([...vTotal.values()])], [0, colTotH - 14]);
  vendors.forEach(v => {
    svg.append("rect").attr("x", xCol(v) + cw / 2 - 5).attr("width", 10).attr("y", bodyBottom + 6).attr("height", cbx(vTotal.get(v))).attr("fill", "var(--faint)");
    svg.append("text").attr("x", xCol(v) + cw / 2).attr("y", bodyBottom + 6 + cbx(vTotal.get(v)) + 12).attr("text-anchor", "middle").attr("font-size", 11).attr("class", "faint").text(vTotal.get(v));
  });

  // ---------- state & rendering ----------
  let sel = {}, mode = "shade";

  function subset(d, f) { return (!f.cat || d.cat === f.cat) && (!f.vendor || d.vendor === f.vendor); }
  function paintSub(f) {
    const counts = f ? d3.rollup(incidents.filter(d => subset(d, f)), v => v.length, d => d.cat, d => d.bin) : new Map();
    spG.selectAll("rect.sub").each(function () {
      const el = d3.select(this), cat = this.parentNode.parentNode.getAttribute("data-cat"), b = +el.attr("data-bin");
      const n = ((counts.get(cat) || new Map()).get(b)) || 0;
      el.attr("y", ch - 2 - sy(n)).attr("height", sy(n));
    });
  }
  function render() {
    cells.select("rect.fill").attr("fill", d => mode === "shade" ? color(d.n) : "none");
    labels.style("display", mode === "shade" ? null : "none")
      .text(d => d.n >= 3 ? d.n : "").style("fill", d => dark(d.n) ? "#fbfaf6" : "var(--ink)");
    dotsG.style("display", mode === "dots" ? null : "none").selectAll("circle").attr("fill", "var(--accent)");
    const active = sel.cat || sel.vendor;
    rowG.classed("dim", d => !!sel.cat && d !== sel.cat);
    cells.classed("dim", d => !!active && !subset(d, sel));
    svg.selectAll(".vhead").classed("dim", function () { return false; });
    svg.selectAll(".vhead text").attr("font-weight", function () { return null; });
    svg.selectAll("rect.selbox").remove();
    if (sel.cat && sel.vendor) cellSel.append("rect").attr("class", "sel selbox").attr("x", xCol(sel.vendor) + 1).attr("y", rowY[sel.cat] + 1).attr("width", cw - 2).attr("height", ch - 2);
    paintSub(active ? sel : null);
    document.getElementById("clear").hidden = !active;
    list();
  }
  function hover(d) { if (d) paintSub({ cat: d.cat, vendor: d.vendor }); else paintSub(sel.cat || sel.vendor ? sel : null); }
  function toggle(f) {
    const same = (f.cat || null) === (sel.cat || null) && (f.vendor || null) === (sel.vendor || null);
    sel = same ? {} : f; render();
  }
  function list() {
    const ol = d3.select("#list").html("");
    const active = sel.cat || sel.vendor;
    const items = active ? incidents.filter(d => subset(d, sel)).sort((a, b) => b.t - a.t) : [];
    d3.select("#detail .hint").text(active
      ? `${items.length} incident${items.length === 1 ? "" : "s"}: ${[sel.cat, sel.vendor].filter(Boolean).join(" × ")}`
      : "Click a cell, a row label or a column label to list the incidents behind it. Hover a cell to see its share of that row's history.");
    ol.selectAll("li").data(items).join("li").html(d => `<span class="d">${d.label}</span>${d.system}${sel.cat ? "" : ` <span class="c">· ${d.cat}</span>`}`);
  }

  d3.select("#mode-shade").on("click", () => setMode("shade"));
  d3.select("#mode-dots").on("click", () => setMode("dots"));
  d3.select("#clear").on("click", () => { sel = {}; render(); });
  function setMode(m) {
    mode = m;
    d3.select("#mode-shade").classed("on", m === "shade").attr("aria-pressed", m === "shade");
    d3.select("#mode-dots").classed("on", m === "dots").attr("aria-pressed", m === "dots");
    render();
  }

  window.__viz = { incidents, cats, vendors, cellCount, vTotal };   // for verification
  render();
})();

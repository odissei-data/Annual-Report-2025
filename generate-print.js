const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const $ = cheerio.load(html);

// ── Extract content ──────────────────────────────────────────────

// Hero stats
const heroStats = [];
$('.hero-stat').each((i, el) => {
  heroStats.push({
    num: $(el).find('[data-count]').attr('data-count') || '',
    suffix: $(el).find('[data-count]').attr('data-suffix') || '',
    label: $(el).find('.hero-stat-label').text().trim()
  });
});

// Numbers band
const numbers = [];
$('.n-cell').each((i, el) => {
  numbers.push({
    num: $(el).find('[data-count]').attr('data-count') || '',
    label: $(el).find('.n-label').text().trim()
  });
});

// Chair
const chairName = $('.chair-name').first().text().trim();
const chairRole = $('.chair-role').first().html() || '';
const chairParas = [];
$('.chair-text p').each((i, el) => { chairParas.push($(el).html()); });
const pullquote = $('.pullquote p').first().html() || '';

// Governance boards
const boards = [];
$('.board-panel').each((i, el) => {
  const title = $(el).find('h4').text().trim();
  const people = [];
  $(el).find('li').each((j, li) => {
    people.push({
      name: $(li).find('.person-name').text().trim(),
      org: $(li).find('.person-org').text().trim()
    });
  });
  boards.push({ title, people });
});

// Workstreams
const workstreams = [];
['#data', '#observatory', '#laboratory', '#hub'].forEach(id => {
  const s = $(id);
  const num = s.find('.ws-num').text().trim();
  const title = s.find('.ws-title').html() || '';
  const lead = s.find('.ws-lead').html() || '';
  const achievements = [];
  s.find('.ws-achievements li').each((i, el) => {
    achievements.push($(el).html());
  });
  const bpTotal = s.find('.bp-amount').text().trim();
  const bpLabel = s.find('.bp-year').text().trim();
  const bpItems = [];
  s.find('.bp-item').each((i, el) => {
    bpItems.push({
      label: $(el).find('.bp-item-label').text().trim(),
      val: $(el).find('.bp-item-val').text().trim(),
      pct: $(el).find('.bp-fill').attr('data-pct') || '0'
    });
  });
  workstreams.push({ num, title, lead, achievements, bpTotal, bpLabel, bpItems });
});

// Research papers
const papers = [];
$('.paper').each((i, el) => {
  papers.push({
    field: $(el).find('.paper-field').text().trim(),
    title: $(el).find('h3').text().trim(),
    body: $(el).find('p').first().html() || '',
    ref: $(el).find('.paper-ref').html() || ''
  });
});

// Testimonials
const testis = [];
$('.testi').each((i, el) => {
  testis.push({
    quote: $(el).find('p').first().html() || '',
    name: $(el).find('strong').first().text().trim(),
    role: $(el).find('.testi-by-text').text().replace($(el).find('strong').first().text(), '').trim(),
    avatar: $(el).find('.testi-avatar').attr('src') || ''
  });
});

// Financials
const finCells = [];
$('.fin-cell').each((i, el) => {
  finCells.push({
    name: $(el).find('.fin-ws-name').text().trim(),
    amt: $(el).find('.fin-ws-amt').text().trim(),
    desc: $(el).find('.fin-ws-desc').text().trim(),
    isTotal: $(el).hasClass('total-cell')
  });
});

const finRows = [];
$('.fin-table tbody tr').each((i, el) => {
  const cells = $(el).find('td');
  finRows.push({
    label: cells.eq(0).text().trim(),
    amt: cells.eq(1).text().trim(),
    isWs: $(el).hasClass('ws-row'),
    isSub: $(el).hasClass('sub'),
    isTotal: $(el).hasClass('total-row')
  });
});

// KPIs
const kpiCells = [];
$('.kpi-cell').each((i, el) => {
  const title = $(el).find('h4').text().trim();
  const items = [];
  $(el).find('.kpi-list li').each((j, li) => { items.push($(li).text().trim()); });
  kpiCells.push({ title, items });
});

// ── Helpers ──────────────────────────────────────────────────────

function fmtNum(n) {
  return Number(n).toLocaleString('en');
}

function wsPage(ws) {
  return `
  <div class="content-page">
    <div class="ws-label">${ws.num}</div>
    <h2 class="ws-title">${ws.title}</h2>
    <p class="ws-lead">${ws.lead}</p>
    <ul class="achievements">
      ${ws.achievements.map(a => `<li>${a}</li>`).join('\n      ')}
    </ul>
    <div class="budget-box">
      <div class="budget-header">
        <span class="budget-label">Actual Expenditure 2025</span>
        <span class="budget-total">${ws.bpTotal}</span>
      </div>
      <div class="budget-sublabel">${ws.bpLabel}</div>
      <table class="budget-table">
        ${ws.bpItems.map(item => `
        <tr>
          <td>${item.label}</td>
          <td class="budget-amt">${item.val}</td>
        </tr>`).join('')}
      </table>
    </div>
  </div>`;
}

// ── Generate HTML ────────────────────────────────────────────────

const print = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ODISSEI Annual Report 2025</title>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Roboto+Slab:wght@300;400;700&display=swap" rel="stylesheet">
<style>
:root {
  --brand:  #006489;
  --teal:   #00b1b7;
  --ink:    #0d1e2c;
  --dark:   #00415a;
  --muted:  #5a7282;
  --rule:   #c8dce8;
  --light:  #eaf2f6;
  --serif:  'Roboto Slab', Georgia, serif;
  --sans:   'Ubuntu', system-ui, sans-serif;
}
@page { size: A4; margin: 0; }
*, *::before, *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
html, body { font-family: var(--sans); font-size: 9.5pt; line-height: 1.65; color: var(--ink); background: white; }
img { display: block; max-width: 100%; }
p { margin-bottom: 0.6em; } p:last-child { margin-bottom: 0; }
ul { list-style: none; }

/* ── COVER ── */
.cover {
  width: 210mm; height: 297mm;
  position: relative; overflow: hidden;
  background: #001e2c;
  display: flex; flex-direction: column; justify-content: space-between;
  page-break-after: always;
}
.cover-bg {
  position: absolute; inset: 0;
  background-image: url('assets/cover_hero.jpg');
  background-size: cover; background-position: center 40%;
  filter: brightness(0.45) saturate(0.8);
}
.cover-slab {
  position: absolute; inset: 0;
  background: linear-gradient(100deg, rgba(0,20,35,0.92) 0%, rgba(0,40,60,0.75) 55%, rgba(0,100,137,0.08) 100%);
}
.cover-top {
  position: relative; z-index: 2;
  padding: 12mm 18mm 6mm;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
}
.cover-logo { height: 32px; }
.cover-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.2); }
.cover-logo-text { font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
.cover-body { position: relative; z-index: 2; padding: 0 18mm; }
.cover-eyebrow { font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--teal); margin-bottom: 5mm; }
.cover-title { font-family: var(--serif); line-height: 1.0; letter-spacing: -0.02em; }
.cover-title-odissei { font-size: 68pt; font-weight: 700; color: #fff; display: block; }
.cover-title-annual { font-size: 32pt; font-weight: 300; font-style: italic; color: rgba(255,255,255,0.85); display: block; }
.cover-title-year { font-size: 40pt; font-weight: 700; color: #fff; display: block; }
.cover-desc { margin-top: 6mm; font-size: 9pt; font-weight: 300; line-height: 1.7; color: rgba(255,255,255,0.6); max-width: 105mm; }
.cover-stats { position: relative; z-index: 2; display: flex; border-top: 1px solid rgba(255,255,255,0.12); }
.cover-stat { flex: 1; padding: 6mm 18mm; border-right: 1px solid rgba(255,255,255,0.08); }
.cover-stat:last-child { border-right: none; }
.cover-stat-num { font-family: var(--serif); font-size: 20pt; font-weight: 700; color: #fff; line-height: 1; }
.cover-stat-label { font-size: 6pt; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-top: 1mm; }

/* ── CONTENT PAGES ── */
.content-page {
  width: 210mm; min-height: 297mm;
  padding: 18mm 18mm 16mm;
  page-break-before: always;
  page-break-inside: avoid;
  position: relative;
}
.content-page.flow { page-break-inside: auto; }

/* Section label */
.section-label { font-size: 7pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--teal); margin-bottom: 3mm; }
.section-num { font-family: var(--serif); font-size: 60pt; font-weight: 700; color: var(--light); position: absolute; top: 10mm; right: 14mm; line-height: 1; pointer-events: none; }

/* Headings */
h2 { font-family: var(--serif); font-size: 22pt; font-weight: 700; color: var(--ink); line-height: 1.15; margin-bottom: 4mm; }
h3 { font-family: var(--serif); font-size: 13pt; font-weight: 700; color: var(--ink); line-height: 1.3; margin-bottom: 2mm; }
h4 { font-size: 8pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--brand); margin-bottom: 2mm; border-bottom: 1.5px solid var(--teal); padding-bottom: 1.5mm; }

/* Rule */
.rule { border: none; border-top: 1.5px solid var(--rule); margin: 5mm 0; }

/* Chair */
.chair-grid { display: grid; grid-template-columns: 55mm 1fr; gap: 10mm; margin-top: 5mm; }
.chair-photo { width: 100%; height: 70mm; object-fit: cover; object-position: top; border-radius: 2px; }
.chair-name { font-family: var(--serif); font-size: 11pt; font-weight: 700; color: var(--ink); margin-top: 2mm; }
.chair-role { font-size: 7.5pt; color: var(--muted); line-height: 1.5; }
.pullquote { border-left: 3px solid var(--teal); padding: 2mm 4mm; margin: 4mm 0; background: var(--light); border-radius: 0 2px 2px 0; }
.pullquote p { font-family: var(--serif); font-size: 9.5pt; font-style: italic; color: var(--brand); line-height: 1.6; margin: 0; }

/* Governance boards */
.boards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 5mm; }
.board-panel { padding: 4mm; background: var(--light); border-radius: 2px; page-break-inside: avoid; }
.person-list li { display: flex; justify-content: space-between; align-items: baseline; padding: 1.2mm 0; border-bottom: 1px solid var(--rule); font-size: 7.5pt; gap: 4mm; }
.person-list li:last-child { border-bottom: none; }
.person-name { font-weight: 500; color: var(--ink); }
.person-org { color: var(--muted); font-size: 7pt; text-align: right; }

/* Workstreams */
.ws-label { font-size: 7pt; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--teal); margin-bottom: 2mm; }
.ws-title { font-family: var(--serif); font-size: 20pt; font-weight: 700; color: var(--ink); line-height: 1.15; margin-bottom: 3mm; }
.ws-lead { font-size: 9pt; color: var(--muted); line-height: 1.7; margin-bottom: 5mm; border-left: 2px solid var(--teal); padding-left: 3mm; }
.achievements { margin-bottom: 6mm; }
.achievements li { position: relative; padding: 1.5mm 0 1.5mm 5mm; border-bottom: 1px solid var(--rule); font-size: 8pt; line-height: 1.55; }
.achievements li::before { content: ''; position: absolute; left: 0; top: 3.5mm; width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }
.budget-box { background: var(--dark); padding: 5mm; border-radius: 2px; page-break-inside: avoid; }
.budget-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1mm; }
.budget-label { font-size: 6.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
.budget-total { font-family: var(--serif); font-size: 18pt; font-weight: 700; color: #fff; }
.budget-sublabel { font-size: 7pt; color: rgba(255,255,255,0.4); margin-bottom: 3mm; }
.budget-table { width: 100%; border-collapse: collapse; }
.budget-table tr { border-top: 1px solid rgba(255,255,255,0.08); }
.budget-table td { padding: 1.5mm 0; font-size: 7.5pt; color: rgba(255,255,255,0.75); }
.budget-amt { text-align: right; font-weight: 600; color: #fff; white-space: nowrap; }

/* Papers */
.papers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 5mm; }
.paper-card { border: 1px solid var(--rule); padding: 5mm; border-radius: 2px; page-break-inside: avoid; }
.paper-field { font-size: 6.5pt; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--teal); margin-bottom: 2mm; }
.paper-card h3 { font-size: 9.5pt; margin-bottom: 2mm; }
.paper-card p { font-size: 7.5pt; line-height: 1.6; color: var(--muted); }
.paper-ref { font-size: 7pt; font-style: italic; color: var(--muted); margin-top: 2mm; border-top: 1px solid var(--rule); padding-top: 2mm; }

/* Testimonials */
.testi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 5mm; }
.testi-card { background: var(--light); padding: 5mm; border-radius: 2px; page-break-inside: avoid; }
.testi-quote { font-family: var(--serif); font-size: 32pt; font-weight: 700; color: var(--teal); line-height: 0.8; margin-bottom: 2mm; }
.testi-card p { font-size: 8pt; line-height: 1.65; color: var(--ink); font-style: italic; }
.testi-by { display: flex; align-items: center; gap: 3mm; margin-top: 4mm; }
.testi-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.testi-name { font-size: 8pt; font-weight: 700; color: var(--ink); }
.testi-role { font-size: 7pt; color: var(--muted); }

/* Financials */
.fin-summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4mm; margin-top: 5mm; margin-bottom: 7mm; }
.fin-cell { padding: 3mm; background: var(--light); border-radius: 2px; text-align: center; page-break-inside: avoid; }
.fin-cell.total { background: var(--dark); }
.fin-cell.total .fin-name, .fin-cell.total .fin-desc { color: rgba(255,255,255,0.6); }
.fin-cell.total .fin-amt { color: #fff; }
.fin-name { font-size: 6.5pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand); margin-bottom: 1mm; }
.fin-amt { font-family: var(--serif); font-size: 11pt; font-weight: 700; color: var(--dark); line-height: 1.1; }
.fin-desc { font-size: 6pt; color: var(--muted); margin-top: 1mm; }
.fin-table { width: 100%; border-collapse: collapse; }
.fin-table th { font-size: 7pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); padding: 2mm 0; border-bottom: 2px solid var(--ink); text-align: left; }
.fin-table th:last-child { text-align: right; }
.fin-table td { padding: 1.8mm 0; font-size: 8pt; border-bottom: 1px solid var(--rule); }
.fin-table td:last-child { text-align: right; font-weight: 500; }
.fin-table tr.ws-row td { font-weight: 700; color: var(--brand); background: var(--light); padding-left: 2mm; }
.fin-table tr.sub td { padding-left: 5mm; color: var(--muted); font-size: 7.5pt; }
.fin-table tr.total-row td { font-weight: 700; font-size: 9pt; color: var(--ink); border-top: 2px solid var(--ink); border-bottom: none; }

/* KPIs */
.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; margin-top: 5mm; }
.kpi-cell { padding: 4mm; border: 1px solid var(--rule); border-radius: 2px; page-break-inside: avoid; }
.kpi-cell h4 { font-size: 7.5pt; }
.kpi-list li { padding: 1.5mm 0 1.5mm 4mm; border-bottom: 1px solid var(--rule); font-size: 7.5pt; color: var(--ink); position: relative; }
.kpi-list li:last-child { border-bottom: none; }
.kpi-list li::before { content: ''; position: absolute; left: 0; top: 3.5mm; width: 4px; height: 4px; border-radius: 50%; background: var(--teal); }

/* Back cover */
.back-cover {
  width: 210mm; height: 297mm;
  background: var(--dark);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  page-break-before: always;
  gap: 6mm;
}
.back-cover img { height: 40px; }
.back-url { font-size: 12pt; color: rgba(255,255,255,0.6); letter-spacing: 0.05em; }
.back-copy { font-size: 7.5pt; color: rgba(255,255,255,0.35); letter-spacing: 0.1em; text-transform: uppercase; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-bg"></div>
  <div class="cover-slab"></div>
  <div class="cover-top">
    <img class="cover-logo" src="assets/odissei_logo_white.png" alt="ODISSEI">
    <div class="cover-sep"></div>
    <span class="cover-logo-text">Annual Report 2025</span>
  </div>
  <div class="cover-body">
    <p class="cover-eyebrow">Dutch National Research Infrastructure for Social Science</p>
    <div class="cover-title">
      <span class="cover-title-odissei">ODISSEI</span>
      <span class="cover-title-annual">Annual Report</span>
      <span class="cover-title-year">2025</span>
    </div>
    <p class="cover-desc">Bringing together sensitive data, computing resources, and expertise to drive collaborative social science and economic research across the Netherlands.</p>
  </div>
  <div class="cover-stats">
    ${heroStats.map(s => `
    <div class="cover-stat">
      <div class="cover-stat-num">${fmtNum(s.num)}${s.suffix}</div>
      <div class="cover-stat-label">${s.label}</div>
    </div>`).join('')}
  </div>
</div>

<!-- CHAIR -->
<div class="content-page flow">
  <p class="section-label">Message from the Chair</p>
  <div class="chair-grid">
    <div>
      <img class="chair-photo" src="assets/daniel_oberski.jpg" alt="Daniel Oberski">
      <div class="chair-name">${chairName}</div>
      <div class="chair-role">${chairRole}</div>
    </div>
    <div>
      <h2>A year of maturation and commitment</h2>
      <div class="pullquote"><p>${pullquote}</p></div>
      ${chairParas.filter((_, i) => i > 0).map(p => `<p>${p}</p>`).join('\n      ')}
    </div>
  </div>
</div>

<!-- GOVERNANCE -->
<div class="content-page flow">
  <span class="section-num">01</span>
  <p class="section-label">Structure</p>
  <h2>Governance</h2>
  <p>ODISSEI is the Dutch National Infrastructure that brings together sensitive data, computing resources and expertise to drive collaborative social science and economic research. It now consists of <strong>45 member organisations</strong>, with 31 already committed to membership through 2031.</p>
  <div class="boards-grid">
    ${boards.map(b => `
    <div class="board-panel">
      <h4>${b.title}</h4>
      <ul class="person-list">
        ${b.people.map(p => `<li><span class="person-name">${p.name}</span><span class="person-org">${p.org}</span></li>`).join('\n        ')}
      </ul>
    </div>`).join('')}
  </div>
</div>

<!-- WORKSTREAMS -->
${workstreams.map(ws => wsPage(ws)).join('\n')}

<!-- RESEARCH SPOTLIGHT -->
<div class="content-page flow">
  <span class="section-num">02</span>
  <p class="section-label">Scientific Impact</p>
  <h2>Research Spotlight</h2>
  <p>Selected publications enabled by ODISSEI's data infrastructure in 2025, demonstrating the breadth and policy relevance of research conducted using ODISSEI facilities.</p>
  <div class="papers-grid">
    ${papers.map(p => `
    <div class="paper-card">
      <p class="paper-field">${p.field}</p>
      <h3>${p.title}</h3>
      <p>${p.body}</p>
      <p class="paper-ref">${p.ref}</p>
    </div>`).join('')}
  </div>
</div>

<!-- TESTIMONIALS -->
<div class="content-page flow">
  <span class="section-num">03</span>
  <p class="section-label">Community</p>
  <h2>From Our Researchers</h2>
  <div class="testi-grid">
    ${testis.map(t => `
    <div class="testi-card">
      <div class="testi-quote">&ldquo;</div>
      <p>${t.quote}</p>
      <div class="testi-by">
        <img class="testi-avatar" src="${t.avatar}" alt="${t.name}">
        <div>
          <div class="testi-name">${t.name}</div>
          <div class="testi-role">${t.role}</div>
        </div>
      </div>
    </div>`).join('')}
  </div>
</div>

<!-- FINANCIALS -->
<div class="content-page flow">
  <span class="section-num">04</span>
  <p class="section-label">Accountability</p>
  <h2>Financial Report 2025</h2>
  <div class="fin-summary">
    ${finCells.map(c => `
    <div class="fin-cell${c.isTotal ? ' total' : ''}">
      <div class="fin-name">${c.name}</div>
      <div class="fin-amt">${c.amt}</div>
      <div class="fin-desc">${c.desc}</div>
    </div>`).join('')}
  </div>
  <table class="fin-table">
    <thead><tr><th>Line Item</th><th>Amount</th></tr></thead>
    <tbody>
      ${finRows.map(r => `<tr class="${r.isWs ? 'ws-row' : r.isSub ? 'sub' : r.isTotal ? 'total-row' : ''}"><td>${r.label}</td><td>${r.amt}</td></tr>`).join('\n      ')}
    </tbody>
  </table>
</div>

<!-- KPIs -->
<div class="content-page flow">
  <span class="section-num">05</span>
  <p class="section-label">Performance</p>
  <h2>Key Performance Indicators</h2>
  <div class="kpi-grid">
    ${kpiCells.map(c => `
    <div class="kpi-cell">
      <h4>${c.title}</h4>
      <ul class="kpi-list">
        ${c.items.map(i => `<li>${i}</li>`).join('\n        ')}
      </ul>
    </div>`).join('')}
  </div>
</div>

<!-- BACK COVER -->
<div class="back-cover">
  <img src="assets/odissei_logo_white.png" alt="ODISSEI">
  <div class="back-url">odissei.nl</div>
  <div class="back-copy">© 2025 ODISSEI — Dutch National Infrastructure for Social Science</div>
</div>

</body>
</html>`;

fs.writeFileSync('print-generated.html', print);
console.log('print-generated.html created');

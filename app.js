/* ============================================================
   Irish Fuel Tax Corridor Simulator
   Real-world data: CSO pump prices, Revenue excise rates,
   Finance Act carbon tax, ICE Brent via ECB EUR/USD
   ============================================================ */

const VAT = 0.23;

/* ── real monthly Brent crude, EUR/bbl ── */
const BRENT = [
  // 2019
  51.9,56.4,58.5,63.5,62.6,56.0,56.9,53.2,57.1,53.7,57.5,60.5,
  // 2020
  58.0,51.4,30.6,24.5,27.9,35.8,37.8,38.1,35.6,34.2,37.0,41.2,
  // 2021
  45.5,51.5,54.8,55.6,56.5,61.6,63.0,60.1,64.0,72.0,71.1,65.6,
  // 2022
  76.4,85.7,101.8,96.4,105.0,111.2,103.0,96.7,90.9,94.4,86.8,76.8,
  // 2023
  77.9,78.4,73.1,74.9,69.9,68.8,72.5,78.7,87.2,85.5,75.4,70.8,
  // 2024
  73.1,75.9,78.5,82.9,76.7,76.1,77.6,72.3,66.1,69.3,69.0,70.6,
  // 2025 Jan-Mar
  74.4,72.5,68.6,
];

/* ── CSO monthly petrol pump price, €/L ── */
const PETROL = [
  1.329,1.339,1.359,1.399,1.399,1.389,1.399,1.369,1.379,1.359,1.359,1.369,
  1.369,1.339,1.229,1.139,1.139,1.199,1.229,1.229,1.219,1.209,1.209,1.249,
  1.279,1.319,1.359,1.379,1.389,1.419,1.439,1.419,1.449,1.519,1.529,1.529,
  1.579,1.639,1.789,1.729,1.819,1.939,1.889,1.799,1.719,1.699,1.679,1.629,
  1.639,1.639,1.599,1.599,1.599,1.589,1.629,1.659,1.699,1.689,1.639,1.599,
  1.619,1.639,1.659,1.689,1.669,1.659,1.669,1.649,1.619,1.629,1.619,1.619,
  1.639,1.629,1.609,
];

/* ── CSO monthly diesel pump price, €/L ── */
const DIESEL = [
  1.299,1.309,1.319,1.349,1.349,1.329,1.329,1.299,1.309,1.299,1.299,1.309,
  1.309,1.279,1.179,1.089,1.069,1.119,1.139,1.139,1.129,1.119,1.119,1.159,
  1.179,1.219,1.259,1.279,1.289,1.319,1.339,1.319,1.349,1.419,1.439,1.449,
  1.499,1.569,1.749,1.699,1.809,1.939,1.889,1.799,1.749,1.779,1.759,1.699,
  1.679,1.639,1.589,1.579,1.559,1.539,1.569,1.609,1.659,1.659,1.619,1.579,
  1.589,1.609,1.629,1.659,1.639,1.629,1.629,1.599,1.569,1.579,1.569,1.569,
  1.589,1.579,1.559,
];

/* ── SEAI annual road-transport consumption, litres ── */
const VOL = {
  petrol: { 2019:2.1e9, 2020:1.7e9, 2021:1.85e9, 2022:1.9e9, 2023:1.8e9, 2024:1.75e9, 2025:1.7e9 },
  diesel: { 2019:4.4e9, 2020:3.8e9, 2021:4.2e9, 2022:4.3e9, 2023:4.4e9, 2024:4.35e9, 2025:4.3e9 },
};

/* ── tax rate functions ── */

// Full (pre-cut) non-carbon excise rates (Revenue MOT Schedule 2)
const FULL = { petrol: 0.54184, diesel: 0.4257 };

// CO₂ factors: petrol 2.314 kg/L, diesel 2.676 kg/L (Revenue Schedule 2A)
function carbonTax(y, m, fuel) {
  const co2 = fuel === "petrol" ? 2.314 : 2.676;
  let r;
  if (y < 2019 || (y === 2019 && m < 9)) r = 20;
  else if (y === 2019 || (y === 2020 && m < 9)) r = 26;
  else if (y === 2020 || (y === 2021 && m < 9)) r = 33.5;
  else if (y === 2021 || (y === 2022 && m < 9)) r = 41;
  else if (y === 2022 || (y === 2023 && m < 9)) r = 48.5;
  else if (y === 2023 || (y === 2024 && m < 9)) r = 56;
  else r = 63.5;
  return (r / 1000) * co2;
}

// Actual excise (with March 2022 cuts and four-step restoration through Aug 2024)
function actualExcise(y, m, fuel) {
  const f = FULL[fuel];
  const isPetrol = fuel === "petrol";
  // Full cut: Mar 2022 – May 2023
  if ((y === 2022 && m >= 2) || (y === 2023 && m <= 4))
    return f - (isPetrol ? 0.20 : 0.15);
  // 1st restoration Jun–Aug 2023: +6c petrol, +5c diesel
  if (y === 2023 && m >= 5 && m <= 7)
    return f - (isPetrol ? 0.14 : 0.10);
  // 2nd restoration Sep 2023–Mar 2024: +7c petrol, +5c diesel
  if ((y === 2023 && m >= 8) || (y === 2024 && m <= 2))
    return f - (isPetrol ? 0.07 : 0.05);
  // 3rd restoration Apr–Jul 2024: +4c petrol, +3c diesel
  if (y === 2024 && m >= 3 && m <= 6)
    return f - (isPetrol ? 0.03 : 0.02);
  // Full rate restored Aug 2024
  return f;
}

/* ── build series ── */

function buildSeries() {
  const rows = [];
  let idx = 0;
  for (let y = 2019; y <= 2025; y++) {
    const mMax = y === 2025 ? 3 : 12;
    for (let m = 0; m < mMax; m++) {
      const petrolCarbon = carbonTax(y, m, "petrol");
      const dieselCarbon = carbonTax(y, m, "diesel");
      const petrolActExcise = actualExcise(y, m, "petrol");
      const dieselActExcise = actualExcise(y, m, "diesel");
      // derive wholesale from observed pump price
      const petrolWholesale = Math.max(0.20, PETROL[idx] / (1 + VAT) - petrolActExcise - petrolCarbon);
      const dieselWholesale = Math.max(0.20, DIESEL[idx] / (1 + VAT) - dieselActExcise - dieselCarbon);
      rows.push({
        y, m, idx,
        label: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m]} ${String(y).slice(2)}`,
        brent: BRENT[idx],
        petrolPump: PETROL[idx],
        dieselPump: DIESEL[idx],
        petrolWholesale, dieselWholesale,
        petrolCarbon, dieselCarbon,
        petrolActExcise, dieselActExcise,
      });
      idx++;
    }
  }
  return rows;
}

const DATA = buildSeries();

/* ── state ── */

const S = {
  fuel: "petrol",
  lo: 55,
  hi: 75,
  coeff: 0.50,
  scenarioBrent: 75,
};

/* ── DOM ── */

const $ = (id) => document.getElementById(id);

const DOM = {
  lo: $("lowerBound"), loV: $("lowerValue"),
  hi: $("upperBound"), hiV: $("upperValue"),
  coeff: $("adjustmentCoefficient"), coeffV: $("coefficientValue"),
  metricPumpGap: $("metricPumpGap"), metricFill: $("metricFill"),
  metricDriver: $("metricDriver"), metricVol: $("metricVol"),
  corridorChart: $("corridorChart"), pumpChart: $("pumpChart"),
  compPumpChart: $("compPumpChart"), compExciseChart: $("compExciseChart"),
  compFiscalChart: $("compFiscalChart"),
  h2hFiscalActual: $("h2hFiscalActual"), h2hFiscalCorridor: $("h2hFiscalCorridor"),
  h2hConsumerActual: $("h2hConsumerActual"), h2hConsumerCorridor: $("h2hConsumerCorridor"),
  h2hPeakActual: $("h2hPeakActual"), h2hPeakCorridor: $("h2hPeakCorridor"),
  h2hMonthsActual: $("h2hMonthsActual"), h2hMonthsCorridor: $("h2hMonthsCorridor"),
  h2hEfficiencyActual: $("h2hEfficiencyActual"), h2hEfficiencyCorridor: $("h2hEfficiencyCorridor"),
  insightText: $("insightText"),
  // Section 3
  scenarioBrent: $("scenarioBrent"), scenarioBrentV: $("scenarioBrentValue"),
  breakdownBrent: $("breakdownBrent"),
  s3Status: $("s3Status"), s3Excise: $("s3Excise"),
  s3PumpSaving: $("s3PumpSaving"), s3FillSaving: $("s3FillSaving"),
  s3FiscalMonth: $("s3FiscalMonth"), s3FiscalYear: $("s3FiscalYear"),
  responseCurve: $("responseCurve"), breakdownChart: $("breakdownChart"),
};

/* ── helpers ── */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sum = (a) => a.reduce((s, v) => s + v, 0);
const avg = (a) => a.length ? sum(a) / a.length : 0;
const stdev = (a) => { const m = avg(a); return Math.sqrt(avg(a.map(v => (v - m) ** 2))); };

function fmtCurrency(v) {
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e9) return `${s}€${(a / 1e9).toFixed(2)}bn`;
  if (a >= 100e6) return `${s}€${(a / 1e6).toFixed(0)}m`;
  if (a >= 1e6) return `${s}€${(a / 1e6).toFixed(1)}m`;
  if (a >= 1e3) return `${s}€${(a / 1e3).toFixed(0)}k`;
  return `${s}€${a.toFixed(0)}`;
}
function fmtCents(v) { return `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)} c/L`; }
function fmtPct(v) { return `${v.toFixed(0)}%`; }
function fmtEuro(v) { return `€${v.toFixed(2)}`; }

/* ── corridor excise calculation ── */

function corridorExcise(brent, fuel) {
  const full = FULL[fuel];
  const gap = Math.max(0, brent - S.hi) - Math.max(0, S.lo - brent);
  const shift = -gap * (S.coeff / 100);
  return clamp(full + shift, 0, full * 1.5);
}

/* ── compute section 1 (all data) ── */

function computeSection1() {
  const f = S.fuel;
  return DATA.map(r => {
    const w = r[f + "Wholesale"];
    const c = r[f + "Carbon"];
    const full = FULL[f];
    const baselinePump = (w + full + c) * (1 + VAT);
    const corrExcise = corridorExcise(r.brent, f);
    const corrPump = (w + corrExcise + c) * (1 + VAT);
    return { ...r, baselinePump, corrExcise, corrPump };
  });
}

/* ── compute section 2 (2021-2024 comparison) ── */

function computeSection2() {
  const f = S.fuel;
  const window = DATA.filter(r => r.y >= 2021 && r.y <= 2024);

  return window.map(r => {
    const w = r[f + "Wholesale"];
    const c = r[f + "Carbon"];
    const full = FULL[f];
    const actExcise = r[f + "ActExcise"];
    const corrExc = corridorExcise(r.brent, f);

    const noIntPump = (w + full + c) * (1 + VAT);
    const actPump = (w + actExcise + c) * (1 + VAT);
    const corrPump = (w + corrExc + c) * (1 + VAT);

    const vol = (VOL[f][r.y] || VOL[f][2024]) / 12;

    // fiscal cost = revenue forgone vs full excise (positive = costs money)
    const actFiscalCost = (full - actExcise) * (1 + VAT) * vol;
    const corrFiscalCost = (full - corrExc) * (1 + VAT) * vol;

    // consumer saving vs no intervention
    const actConsumerSaving = Math.max(0, noIntPump - actPump) * vol;
    const corrConsumerSaving = Math.max(0, noIntPump - corrPump) * vol;

    return {
      ...r, noIntPump, actPump, corrPump,
      actExcise, corrExcise: corrExc, fullExcise: full,
      actFiscalCost, corrFiscalCost,
      actConsumerSaving, corrConsumerSaving,
      actPeakCut: Math.max(0, noIntPump - actPump),
      corrPeakCut: Math.max(0, noIntPump - corrPump),
      actActive: Math.abs(actExcise - full) > 0.001 ? 1 : 0,
      corrActive: Math.abs(corrExc - full) > 0.001 ? 1 : 0,
    };
  });
}

/* ── wholesale-to-Brent regression (fitted from historical data) ── */

function fitWholesaleModel(fuel) {
  const xs = DATA.map(d => d.brent);
  const ys = DATA.map(d => d[fuel + "Wholesale"]);
  const n = xs.length;
  const mx = avg(xs), my = avg(ys);
  const num = sum(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const den = sum(xs.map(x => (x - mx) ** 2));
  const beta = den > 0 ? num / den : 0;
  const alpha = my - beta * mx;
  return { alpha, beta };
}

const wholesaleModel = {
  petrol: fitWholesaleModel("petrol"),
  diesel: fitWholesaleModel("diesel"),
};

function estimateWholesale(brent, fuel) {
  const m = wholesaleModel[fuel];
  return Math.max(0.20, m.alpha + m.beta * brent);
}

// Carbon tax for 2026: €71/tonne (Budget 2026 trajectory to €100 by 2030)
const CARBON_2026 = {
  petrol: (71 / 1000) * 2.314,  // 16.43 c/L
  diesel: (71 / 1000) * 2.676,  // 19.00 c/L
};

// Consumption for 2026 scenario (projected)
const VOL_2026 = { petrol: 1.65e9, diesel: 4.25e9 };

/* ── compute section 3 (2026 scenario at a given Brent) ── */

function computeSection3(brent) {
  const f = S.fuel;
  const full = FULL[f];
  const w = estimateWholesale(brent, f);
  const c = CARBON_2026[f];
  const corrExc = corridorExcise(brent, f);

  const baselinePump = (w + full + c) * (1 + VAT);
  const corrPump = (w + corrExc + c) * (1 + VAT);
  const pumpDelta = corrPump - baselinePump;
  const monthlyVol = VOL_2026[f] / 12;

  const fiscalPerMonth = (full - corrExc) * (1 + VAT) * monthlyVol;
  const consumerPerMonth = Math.max(0, baselinePump - corrPump) * monthlyVol;

  let status;
  if (brent > S.hi) status = "Cutting excise";
  else if (brent < S.lo) status = "Raising excise";
  else status = "Dormant";

  return {
    brent, wholesale: w, carbon: c,
    fullExcise: full, corrExcise: corrExc,
    baselinePump, corrPump, pumpDelta,
    fiscalPerMonth, fiscalPerYear: fiscalPerMonth * 12,
    consumerPerMonth, status,
  };
}

/* ── render everything ── */

function render() {
  // labels
  DOM.loV.textContent = `€${S.lo}`;
  DOM.hiV.textContent = `€${S.hi}`;
  DOM.coeffV.textContent = S.coeff.toFixed(2);

  // Section 1
  const s1 = computeSection1();
  // Average gap across all months (includes dormant months at zero)
  const avgGap = avg(s1.map(d => d.corrPump - d.baselinePump));
  // Volatility = stdev of month-to-month price changes, not levels
  const baseChanges = s1.slice(1).map((d, i) => d.baselinePump - s1[i].baselinePump);
  const corrChanges = s1.slice(1).map((d, i) => d.corrPump - s1[i].corrPump);
  const volB = stdev(baseChanges);
  const volC = stdev(corrChanges);
  const volChange = volB > 0 ? (1 - volC / volB) * 100 : 0;

  DOM.metricPumpGap.textContent = fmtCents(avgGap);
  // Show actual value — negative gap = saving, positive gap = cost
  const fillVal = -avgGap * 50;
  const driverVal = -avgGap * 1300;
  DOM.metricFill.textContent = fillVal >= 0 ? fmtEuro(fillVal) : `-${fmtEuro(Math.abs(fillVal))}`;
  DOM.metricDriver.textContent = driverVal >= 0 ? fmtEuro(driverVal) : `-${fmtEuro(Math.abs(driverVal))}`;
  // Show volatility change — positive = reduced, negative = increased
  if (volChange >= 0) {
    DOM.metricVol.textContent = fmtPct(volChange);
    DOM.metricVol.title = "Pump-price volatility reduced";
  } else {
    DOM.metricVol.textContent = `+${fmtPct(Math.abs(volChange))}`;
    DOM.metricVol.title = "Pump-price volatility increased with these settings";
  }

  drawCorridorChart(s1);
  drawPumpChart(s1);

  // Section 2
  const s2 = computeSection2();
  const totalActFiscal = sum(s2.map(d => d.actFiscalCost));
  const totalCorrFiscal = sum(s2.map(d => d.corrFiscalCost));
  const totalActConsumer = sum(s2.map(d => d.actConsumerSaving));
  const totalCorrConsumer = sum(s2.map(d => d.corrConsumerSaving));
  const peakActCut = Math.max(...s2.map(d => d.actPeakCut));
  const peakCorrCut = Math.max(...s2.map(d => d.corrPeakCut));
  const monthsAct = sum(s2.map(d => d.actActive));
  const monthsCorr = sum(s2.map(d => d.corrActive));
  // Net fiscal cost per €1 of consumer relief — the corridor can score better
  // because months below the lower bound generate extra revenue, partially
  // offsetting the cost of cutting during spikes.
  // For actual policy, excise was only ever cut (never raised), so ratio = 1:1.
  // For corridor, if it raises excise in cheap months, net cost < gross cost → ratio < 1.
  const effAct = totalActConsumer > 0 ? totalActFiscal / totalActConsumer : 0;
  const effCorr = totalCorrConsumer > 0 ? totalCorrFiscal / totalCorrConsumer : 0;

  DOM.h2hFiscalActual.textContent = fmtCurrency(totalActFiscal);
  DOM.h2hFiscalCorridor.textContent = fmtCurrency(totalCorrFiscal);
  DOM.h2hConsumerActual.textContent = fmtCurrency(totalActConsumer);
  DOM.h2hConsumerCorridor.textContent = fmtCurrency(totalCorrConsumer);
  DOM.h2hPeakActual.textContent = fmtCents(-peakActCut);
  DOM.h2hPeakCorridor.textContent = fmtCents(-peakCorrCut);
  DOM.h2hMonthsActual.textContent = monthsAct;
  DOM.h2hMonthsCorridor.textContent = monthsCorr;
  DOM.h2hEfficiencyActual.textContent = effAct > 0 ? `${(effAct * 100).toFixed(0)}c` : "—";
  DOM.h2hEfficiencyCorridor.textContent = totalCorrFiscal > 0 && totalCorrConsumer > 0 ? `${(effCorr * 100).toFixed(0)}c` : totalCorrFiscal < 0 ? "net gain" : "—";

  drawCompPumpChart(s2);
  drawCompExciseChart(s2);
  drawCompFiscalChart(s2);

  // Insight
  const fiscalDiff = totalCorrFiscal - totalActFiscal;
  const consumerDiff = totalCorrConsumer - totalActConsumer;
  let insight = "";
  if (fiscalDiff < 0) {
    insight = `With this corridor, the Exchequer would have spent ${fmtCurrency(Math.abs(fiscalDiff))} less than the actual 2022 cuts`;
    if (consumerDiff > 0) insight += `, while delivering ${fmtCurrency(consumerDiff)} more in consumer savings.`;
    else if (consumerDiff < 0) insight += `, though consumers would have received ${fmtCurrency(Math.abs(consumerDiff))} less in total relief.`;
    else insight += ".";
  } else {
    insight = `With this corridor, the Exchequer would have spent ${fmtCurrency(fiscalDiff)} more than the actual cuts`;
    if (consumerDiff > 0) insight += `, but consumers would have gained ${fmtCurrency(consumerDiff)} more in total savings.`;
    else insight += ".";
  }
  if (monthsCorr < monthsAct) {
    insight += ` The corridor would have been active for ${monthsCorr} months versus ${monthsAct} months of actual intervention, switching off automatically as oil prices fell.`;
  } else if (monthsCorr > monthsAct) {
    insight += ` The corridor would have been active for ${monthsCorr} months versus ${monthsAct}, providing a longer but more graduated response.`;
  }
  DOM.insightText.textContent = insight;

  // Section 3
  renderSection3();
}

function renderSection3() {
  DOM.scenarioBrentV.textContent = `€${S.scenarioBrent}/bbl`;
  DOM.breakdownBrent.textContent = S.scenarioBrent;

  const sc = computeSection3(S.scenarioBrent);

  DOM.s3Status.textContent = sc.status;
  DOM.s3Status.style.color = sc.status === "Cutting excise" ? "var(--green)"
    : sc.status === "Raising excise" ? "var(--amber)" : "var(--muted)";
  DOM.s3Excise.textContent = `${(sc.corrExcise * 100).toFixed(1)} c/L`;
  DOM.s3PumpSaving.textContent = fmtCents(sc.pumpDelta);
  const fillSave = -sc.pumpDelta * 50;
  DOM.s3FillSaving.textContent = fillSave >= 0 ? fmtEuro(fillSave) : `-${fmtEuro(Math.abs(fillSave))}`;
  DOM.s3FiscalMonth.textContent = fmtCurrency(sc.fiscalPerMonth);
  DOM.s3FiscalYear.textContent = fmtCurrency(sc.fiscalPerYear);

  drawResponseCurve();
  drawBreakdownChart(sc);
}

/* ============================================================
   CHARTS — vanilla SVG
   ============================================================ */

/* ── Section 1: Brent with corridor band ── */

function drawCorridorChart(data) {
  const svg = DOM.corridorChart;
  const W = 960, H = 340;
  const mg = { t: 22, r: 20, b: 38, l: 50 };
  const iW = W - mg.l - mg.r, iH = H - mg.t - mg.b;

  const bVals = data.map(d => d.brent);
  const mn = Math.min(...bVals, S.lo) * 0.88;
  const mx = Math.max(...bVals, S.hi) * 1.06;
  const x = i => mg.l + (i / (data.length - 1 || 1)) * iW;
  const y = v => mg.t + iH - ((v - mn) / (mx - mn || 1)) * iH;

  // corridor band
  const bandTop = y(S.hi), bandBot = y(S.lo);
  const band = `<rect x="${mg.l}" y="${Math.min(bandTop, bandBot)}" width="${iW}" height="${Math.abs(bandBot - bandTop)}" rx="6" fill="rgba(12,122,95,0.08)" stroke="rgba(12,122,95,0.18)" stroke-dasharray="6 4"/>`;

  // color segments: green above upper, amber below lower, slate inside
  const segments = buildColorSegments(data, x, y, S.lo, S.hi);

  svg.innerHTML = `
    ${grid(W, H, mg, 4)}
    ${band}
    <line x1="${mg.l}" x2="${mg.l + iW}" y1="${y(S.hi)}" y2="${y(S.hi)}" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.5"/>
    <line x1="${mg.l}" x2="${mg.l + iW}" y1="${y(S.lo)}" y2="${y(S.lo)}" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.5"/>
    ${boundLabels(y, mg, iW)}
    ${segments}
    ${xticks(data, x, H)}
    ${yticks(mn, mx, y, mg.l - 10, "€/bbl")}
    ${leg([{c:"#3f4c5c",l:"Brent crude"},{c:"var(--green)",l:"Above → excise cut"},{c:"var(--amber)",l:"Below → excise rise"}], mg.l + 8, mg.t + 6)}
  `;
}

function buildColorSegments(data, x, y, lo, hi) {
  let out = "";
  for (let i = 0; i < data.length - 1; i++) {
    const c = data[i].brent > hi ? "var(--green)" : data[i].brent < lo ? "var(--amber)" : "#3f4c5c";
    const w = data[i].brent > hi ? 4 : data[i].brent < lo ? 4 : 2.5;
    out += `<line x1="${x(i)}" y1="${y(data[i].brent)}" x2="${x(i+1)}" y2="${y(data[i+1].brent)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  return out;
}

function boundLabels(y, mg, iW) {
  const yHi = y(S.hi), yLo = y(S.lo);
  const xPos = mg.l + iW - 4;
  // avoid collision: if labels closer than 16px, offset them
  const gap = yLo - yHi;
  let hiY = yHi - 6, loY = yLo + 14;
  if (gap < 20) {
    const mid = (yHi + yLo) / 2;
    hiY = mid - 10;
    loY = mid + 12;
  }
  return `
    <text class="axis-label" x="${xPos}" y="${hiY}" fill="var(--green)" font-size="10" font-weight="700" text-anchor="end">Upper €${S.hi}</text>
    <text class="axis-label" x="${xPos}" y="${loY}" fill="var(--amber)" font-size="10" font-weight="700" text-anchor="end">Lower €${S.lo}</text>
  `;
}

/* ── Section 1: Pump price baseline vs corridor ── */

function drawPumpChart(data) {
  const svg = DOM.pumpChart;
  const W = 960, H = 300;
  const mg = { t: 20, r: 16, b: 38, l: 50 };
  const iW = W - mg.l - mg.r, iH = H - mg.t - mg.b;

  const all = data.flatMap(d => [d.baselinePump, d.corrPump]);
  const mn = Math.min(...all) * 0.96, mx = Math.max(...all) * 1.02;
  const x = i => mg.l + (i / (data.length - 1 || 1)) * iW;
  const y = v => mg.t + iH - ((v - mn) / (mx - mn || 1)) * iH;

  // fill between — only shade where corridor saves money (corrPump < baselinePump)
  const fillSegments = buildFillBetween(data, x, y);

  svg.innerHTML = `
    ${grid(W, H, mg, 4)}
    ${fillSegments}
    <path d="${lp(data.map((d,i)=>[x(i),y(d.baselinePump)]))}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>
    <path d="${lp(data.map((d,i)=>[x(i),y(d.corrPump)]))}" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round"/>
    ${xticks(data, x, H)}
    ${yticks(mn, mx, y, mg.l - 10, "€/L")}
    ${leg([{c:"var(--blue)",l:"Baseline (full excise)"},{c:"var(--green)",l:"Corridor"}], mg.l + 8, mg.t + 6)}
  `;
}

function buildFillBetween(data, x, y) {
  let out = "";
  for (let i = 0; i < data.length - 1; i++) {
    const saving = data[i].corrPump <= data[i].baselinePump || data[i+1].corrPump <= data[i+1].baselinePump;
    const color = saving ? "rgba(12,122,95,0.12)" : "rgba(215,125,48,0.10)";
    out += `<polygon points="${x(i)},${y(data[i].baselinePump)} ${x(i+1)},${y(data[i+1].baselinePump)} ${x(i+1)},${y(data[i+1].corrPump)} ${x(i)},${y(data[i].corrPump)}" fill="${color}"/>`;
  }
  return out;
}

/* ── Section 2: Comparison pump price ── */

function drawCompPumpChart(data) {
  const svg = DOM.compPumpChart;
  const W = 960, H = 320;
  const mg = { t: 20, r: 16, b: 38, l: 50 };
  const iW = W - mg.l - mg.r, iH = H - mg.t - mg.b;

  const all = data.flatMap(d => [d.noIntPump, d.actPump, d.corrPump]);
  const mn = Math.min(...all) * 0.96, mx = Math.max(...all) * 1.02;
  const x = i => mg.l + (i / (data.length - 1 || 1)) * iW;
  const y = v => mg.t + iH - ((v - mn) / (mx - mn || 1)) * iH;

  svg.innerHTML = `
    ${grid(W, H, mg, 4)}
    <path d="${lp(data.map((d,i)=>[x(i),y(d.noIntPump)]))}" fill="none" stroke="#999" stroke-width="2" stroke-dasharray="6 4"/>
    <path d="${lp(data.map((d,i)=>[x(i),y(d.actPump)]))}" fill="none" stroke="var(--blue)" stroke-width="3.5" stroke-linecap="round"/>
    <path d="${lp(data.map((d,i)=>[x(i),y(d.corrPump)]))}" fill="none" stroke="var(--green)" stroke-width="3.5" stroke-linecap="round"/>
    ${xticks(data, x, H)}
    ${yticks(mn, mx, y, mg.l - 10, "€/L")}
    ${leg([{c:"#999",l:"No intervention"},{c:"var(--blue)",l:"Actual 2022 cuts"},{c:"var(--green)",l:"Corridor"}], mg.l + 8, mg.t + 6)}
  `;
}

/* ── Section 2: Excise rate comparison ── */

function drawCompExciseChart(data) {
  const svg = DOM.compExciseChart;
  const W = 470, H = 280;
  const mg = { t: 18, r: 12, b: 38, l: 50 };
  const iW = W - mg.l - mg.r, iH = H - mg.t - mg.b;

  const all = data.flatMap(d => [d.fullExcise, d.actExcise, d.corrExcise]);
  const mn = Math.min(...all) * 0.88, mx = Math.max(...all) * 1.08;
  const x = i => mg.l + (i / (data.length - 1 || 1)) * iW;
  const y = v => mg.t + iH - ((v - mn) / (mx - mn || 1)) * iH;

  svg.innerHTML = `
    ${grid(W, H, mg, 4)}
    <path d="${lp(data.map((d,i)=>[x(i),y(d.fullExcise)]))}" fill="none" stroke="#bbb" stroke-width="1.5" stroke-dasharray="4 4"/>
    <path d="${lp(data.map((d,i)=>[x(i),y(d.actExcise)]))}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>
    <path d="${lp(data.map((d,i)=>[x(i),y(d.corrExcise)]))}" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round"/>
    ${xticks(data, x, H)}
    ${yticks(mn, mx, y, mg.l - 10, "€/L")}
    ${leg([{c:"#bbb",l:"Full rate"},{c:"var(--blue)",l:"Actual"},{c:"var(--green)",l:"Corridor"}], mg.l + 8, mg.t + 4)}
  `;
}

/* ── Section 2: Cumulative fiscal cost ── */

function drawCompFiscalChart(data) {
  const svg = DOM.compFiscalChart;
  const W = 470, H = 280;
  const mg = { t: 18, r: 12, b: 38, l: 58 };
  const iW = W - mg.l - mg.r, iH = H - mg.t - mg.b;

  // cumulative
  let cumAct = 0, cumCorr = 0;
  const cum = data.map(d => {
    cumAct += d.actFiscalCost;
    cumCorr += d.corrFiscalCost;
    return { ...d, cumAct, cumCorr };
  });

  const all = cum.flatMap(d => [d.cumAct, d.cumCorr]);
  const mn = Math.min(0, ...all) * 1.1;
  const mx = Math.max(0, ...all) * 1.1 || 1;
  const x = i => mg.l + (i / (cum.length - 1 || 1)) * iW;
  const y = v => mg.t + iH - ((v - mn) / (mx - mn || 1)) * iH;

  // fill between
  const fwd = cum.map((d, i) => `${x(i)},${y(d.cumAct)}`).join(" ");
  const rev = cum.map((d, i) => `${x(cum.length - 1 - i)},${y(cum[cum.length - 1 - i].cumCorr)}`).join(" ");

  svg.innerHTML = `
    ${grid(W, H, mg, 4)}
    <polygon points="${fwd} ${rev}" fill="rgba(12,122,95,0.08)"/>
    <path d="${lp(cum.map((d,i)=>[x(i),y(d.cumAct)]))}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>
    <path d="${lp(cum.map((d,i)=>[x(i),y(d.cumCorr)]))}" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round"/>
    ${xticks(cum, x, H)}
    ${yticksMil(mn, mx, y, mg.l - 10, "€m")}
    ${leg([{c:"var(--blue)",l:"Actual cuts"},{c:"var(--green)",l:"Corridor"}], mg.l + 8, mg.t + 4)}
  `;
}

/* ── Section 3: Response curve ── */

function drawResponseCurve() {
  const svg = DOM.responseCurve;
  const W = 960, H = 340;
  const mg = { t: 22, r: 56, b: 38, l: 50 };
  const iW = W - mg.l - mg.r, iH = H - mg.t - mg.b;

  // Compute pump prices across Brent range €40-€160
  const pts = [];
  for (let b = 40; b <= 160; b += 1) {
    const sc = computeSection3(b);
    pts.push({ brent: b, baseline: sc.baselinePump, corridor: sc.corrPump, excise: sc.corrExcise });
  }

  const pAll = pts.flatMap(p => [p.baseline, p.corridor]);
  const pMn = Math.min(...pAll) * 0.96, pMx = Math.max(...pAll) * 1.02;
  const eAll = pts.map(p => p.excise);
  const eMn = Math.min(...eAll) * 0.88, eMx = Math.max(...eAll) * 1.08;

  const x = b => mg.l + ((b - 40) / 120) * iW;
  const yP = v => mg.t + iH - ((v - pMn) / (pMx - pMn || 1)) * iH;
  const yE = v => mg.t + iH - ((v - eMn) / (eMx - eMn || 1)) * iH;

  // Fill between baseline and corridor where corridor saves
  let fill = "";
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].corridor <= pts[i].baseline) {
      fill += `<polygon points="${x(pts[i].brent)},${yP(pts[i].baseline)} ${x(pts[i+1].brent)},${yP(pts[i+1].baseline)} ${x(pts[i+1].brent)},${yP(pts[i+1].corridor)} ${x(pts[i].brent)},${yP(pts[i].corridor)}" fill="rgba(12,122,95,0.10)"/>`;
    }
  }

  // Corridor band shading
  const bandL = x(S.lo), bandR = x(S.hi);
  const band = `<rect x="${bandL}" y="${mg.t}" width="${bandR - bandL}" height="${iH}" fill="rgba(109,112,109,0.06)" stroke="rgba(109,112,109,0.15)" stroke-dasharray="4 4"/>`;

  // Scenario marker
  const sx = x(S.scenarioBrent);
  const marker = `
    <line x1="${sx}" y1="${mg.t}" x2="${sx}" y2="${mg.t + iH}" stroke="var(--amber)" stroke-width="2" stroke-dasharray="6 3"/>
    <circle cx="${sx}" cy="${yP(computeSection3(S.scenarioBrent).corrPump)}" r="6" fill="var(--green)" stroke="#fff" stroke-width="2"/>
    <circle cx="${sx}" cy="${yP(computeSection3(S.scenarioBrent).baselinePump)}" r="6" fill="var(--blue)" stroke="#fff" stroke-width="2"/>
    <text class="axis-label" x="${sx}" y="${mg.t - 6}" text-anchor="middle" fill="var(--amber)" font-weight="700">€${S.scenarioBrent}</text>
  `;

  // Brent x-axis ticks
  let bTicks = "";
  for (let b = 40; b <= 160; b += 10) {
    bTicks += `<text class="tick" x="${x(b)}" y="${H - 10}" text-anchor="middle">€${b}</text>`;
  }

  svg.innerHTML = `
    ${grid(W, H, mg, 4)}
    ${band}
    ${fill}
    <path d="${lp(pts.map(p=>[x(p.brent),yP(p.baseline)]))}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round"/>
    <path d="${lp(pts.map(p=>[x(p.brent),yP(p.corridor)]))}" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round"/>
    <path d="${lp(pts.map(p=>[x(p.brent),yE(p.excise)]))}" fill="none" stroke="var(--amber)" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    ${marker}
    ${bTicks}
    ${yticks(pMn, pMx, yP, mg.l - 10, "€/L pump")}
    ${yticksRight(eMn, eMx, yE, W - mg.r + 10, "€/L excise")}
    ${leg([{c:"var(--blue)",l:"Baseline pump"},{c:"var(--green)",l:"Corridor pump"},{c:"var(--amber)",l:"Excise rate (right)"}], mg.l + 8, mg.t + 6)}
  `;
}

/* ── Section 3: Breakdown bar ── */

function drawBreakdownChart(sc) {
  const svg = DOM.breakdownChart;
  const W = 960, H = 200;
  const mg = { t: 18, r: 20, b: 30, l: 80 };
  const iW = W - mg.l - mg.r;
  const barH = 40;

  const full = sc.fullExcise;
  const maxPump = Math.max(sc.baselinePump, sc.corrPump) * 1.05;
  const scale = v => (v / maxPump) * iW;

  function stackedBar(yPos, label, wholesale, excise, carbon, vatBase) {
    const vatAmt = vatBase * VAT;
    const wW = scale(wholesale), eW = scale(excise), cW = scale(carbon), vW = scale(vatAmt);
    let xPos = mg.l;
    const total = wholesale + excise + carbon + vatAmt;
    return `
      <text class="tick" x="${mg.l - 8}" y="${yPos + barH / 2 + 4}" text-anchor="end" font-weight="700">${label}</text>
      <rect x="${xPos}" y="${yPos}" width="${wW}" height="${barH}" rx="4" fill="#8b7355"/>
      <rect x="${xPos += wW}" y="${yPos}" width="${eW}" height="${barH}" rx="0" fill="var(--blue)"/>
      <rect x="${xPos += eW}" y="${yPos}" width="${cW}" height="${barH}" rx="0" fill="var(--slate)"/>
      <rect x="${xPos += cW}" y="${yPos}" width="${vW}" height="${barH}" rx="4" fill="#bbb"/>
      <text class="tick" x="${xPos + vW + 6}" y="${yPos + barH / 2 + 4}" text-anchor="start" font-weight="700">${fmtEuro(total)}/L</text>
    `;
  }

  const baseVatBase = sc.wholesale + full + sc.carbon;
  const corrVatBase = sc.wholesale + sc.corrExcise + sc.carbon;

  const bar1 = stackedBar(mg.t, "Baseline", sc.wholesale, full, sc.carbon, baseVatBase);
  const bar2 = stackedBar(mg.t + barH + 20, "Corridor", sc.wholesale, sc.corrExcise, sc.carbon, corrVatBase);

  // Legend
  const ly = mg.t + barH * 2 + 52;
  const items = [
    { c: "#8b7355", l: "Wholesale" },
    { c: "var(--blue)", l: "Excise" },
    { c: "var(--slate)", l: "Carbon tax" },
    { c: "#bbb", l: "VAT" },
  ];
  const legend = items.map((it, i) => {
    const lx = mg.l + i * 140;
    return `<circle cx="${lx}" cy="${ly}" r="5" fill="${it.c}"/><text class="legend-label" x="${lx + 10}" y="${ly + 4}">${it.l}</text>`;
  }).join("");

  svg.innerHTML = `${bar1}${bar2}${legend}`;
}

/* ── chart primitives ── */

function lp(pts) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
}

function grid(W, H, mg, n) {
  let o = "";
  for (let i = 0; i <= n; i++) {
    const yy = mg.t + ((H - mg.t - mg.b) / n) * i;
    o += `<line x1="${mg.l}" x2="${W - mg.r}" y1="${yy}" y2="${yy}" stroke="rgba(37,33,30,0.10)" stroke-dasharray="3 6"/>`;
  }
  return o;
}

function xticks(data, sx, H) {
  const maxTicks = 8;
  const step = Math.max(1, Math.ceil(data.length / maxTicks));
  let o = "";
  for (let i = 0; i < data.length; i += step) {
    o += `<text class="tick" x="${sx(i)}" y="${H - 10}" text-anchor="middle">${data[i].label}</text>`;
  }
  return o;
}

function yticks(mn, mx, sy, xPos, label) {
  let o = `<text class="axis-label" x="${xPos}" y="12" text-anchor="start">${label}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = mn + ((mx - mn) / 4) * i;
    o += `<text class="tick" x="${xPos}" y="${sy(v) + 4}" text-anchor="end">${v >= 10 ? Math.round(v) : v.toFixed(2)}</text>`;
  }
  return o;
}

function yticksRight(mn, mx, sy, xPos, label) {
  let o = `<text class="axis-label" x="${xPos}" y="12" text-anchor="end">${label}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = mn + ((mx - mn) / 4) * i;
    o += `<text class="tick" x="${xPos}" y="${sy(v) + 4}" text-anchor="start">${v >= 10 ? Math.round(v) : v.toFixed(2)}</text>`;
  }
  return o;
}

function yticksMil(mn, mx, sy, xPos, label) {
  let o = `<text class="axis-label" x="${xPos}" y="12" text-anchor="start">${label}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = mn + ((mx - mn) / 4) * i;
    const display = Math.round(v / 1e6);
    o += `<text class="tick" x="${xPos}" y="${sy(v) + 4}" text-anchor="end">${display}</text>`;
  }
  return o;
}

function leg(items, sx, sy) {
  return items.map((it, i) => `
    <circle cx="${sx}" cy="${sy + i * 18}" r="4" fill="${it.c}"/>
    <text class="legend-label" x="${sx + 10}" y="${sy + i * 18 + 4}">${it.l}</text>
  `).join("");
}

/* ── bind controls ── */

let rafId = 0;
function scheduleRender() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(render);
}

DOM.lo.addEventListener("input", e => {
  S.lo = +e.target.value;
  if (S.lo >= S.hi) { S.hi = S.lo + 1; DOM.hi.value = S.hi; }
  scheduleRender();
});

DOM.hi.addEventListener("input", e => {
  S.hi = +e.target.value;
  if (S.hi <= S.lo) { S.lo = S.hi - 1; DOM.lo.value = S.lo; }
  scheduleRender();
});

DOM.coeff.addEventListener("input", e => {
  S.coeff = +e.target.value;
  scheduleRender();
});

document.querySelectorAll("[data-fuel]").forEach(btn => {
  btn.addEventListener("click", () => {
    S.fuel = btn.dataset.fuel;
    document.querySelectorAll("[data-fuel]").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    scheduleRender();
  });
});

// Section 3 controls
DOM.scenarioBrent.addEventListener("input", e => {
  S.scenarioBrent = +e.target.value;
  document.querySelectorAll(".preset").forEach(p => {
    p.classList.toggle("active", +p.dataset.brent === S.scenarioBrent);
  });
  scheduleRender();
});

document.querySelectorAll(".preset[data-brent]").forEach(btn => {
  btn.addEventListener("click", () => {
    S.scenarioBrent = +btn.dataset.brent;
    DOM.scenarioBrent.value = S.scenarioBrent;
    document.querySelectorAll(".preset").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    scheduleRender();
  });
});

/* ── go ── */
render();

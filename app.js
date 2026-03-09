/* ============================================================
   Irish Fuel Tax Corridor Simulator — Real-world data edition
   Sources:
     • Brent crude (EUR/bbl): ICE/FRED monthly averages, converted at ECB EUR/USD
     • Irish pump prices: CSO series CPM09 (petrol) / CPM10 (diesel)
     • Mineral oil tax rates: Revenue Commissioners
     • Carbon tax per tonne: Finance Acts 2019-2024
     • Fuel consumption: SEAI National Energy Balance / CSO
   ============================================================ */

const VAT_RATE = 0.23;

/* ---------- real monthly Brent crude, EUR per barrel ---------- */
const BRENT_EUR = [
  // 2019 Jan-Dec
  51.9, 56.4, 58.5, 63.5, 62.6, 56.0, 56.9, 53.2, 57.1, 53.7, 57.5, 60.5,
  // 2020 Jan-Dec
  58.0, 51.4, 30.6, 24.5, 27.9, 35.8, 37.8, 38.1, 35.6, 34.2, 37.0, 41.2,
  // 2021 Jan-Dec
  45.5, 51.5, 54.8, 55.6, 56.5, 61.6, 63.0, 60.1, 64.0, 72.0, 71.1, 65.6,
  // 2022 Jan-Dec
  76.4, 85.7, 101.8, 96.4, 105.0, 111.2, 103.0, 96.7, 90.9, 94.4, 86.8, 76.8,
  // 2023 Jan-Dec
  77.9, 78.4, 73.1, 74.9, 69.9, 68.8, 72.5, 78.7, 87.2, 85.5, 75.4, 70.8,
  // 2024 Jan-Dec
  73.1, 75.9, 78.5, 82.9, 76.7, 76.1, 77.6, 72.3, 66.1, 69.3, 69.0, 70.6,
  // 2025 Jan-Mar
  74.4, 72.5, 68.6,
];

/* ---------- actual Irish retail petrol price, EUR per litre ---------- */
const PETROL_PUMP = [
  // 2019
  1.329, 1.339, 1.359, 1.399, 1.399, 1.389, 1.399, 1.369, 1.379, 1.359, 1.359, 1.369,
  // 2020
  1.369, 1.339, 1.229, 1.139, 1.139, 1.199, 1.229, 1.229, 1.219, 1.209, 1.209, 1.249,
  // 2021
  1.279, 1.319, 1.359, 1.379, 1.389, 1.419, 1.439, 1.419, 1.449, 1.519, 1.529, 1.529,
  // 2022
  1.579, 1.639, 1.789, 1.729, 1.819, 1.939, 1.889, 1.799, 1.719, 1.699, 1.679, 1.629,
  // 2023
  1.639, 1.639, 1.599, 1.599, 1.599, 1.589, 1.629, 1.659, 1.699, 1.689, 1.639, 1.599,
  // 2024
  1.619, 1.639, 1.659, 1.689, 1.669, 1.659, 1.669, 1.649, 1.619, 1.629, 1.619, 1.619,
  // 2025
  1.639, 1.629, 1.609,
];

/* ---------- actual Irish retail diesel price, EUR per litre ---------- */
const DIESEL_PUMP = [
  // 2019
  1.299, 1.309, 1.319, 1.349, 1.349, 1.329, 1.329, 1.299, 1.309, 1.299, 1.299, 1.309,
  // 2020
  1.309, 1.279, 1.179, 1.089, 1.069, 1.119, 1.139, 1.139, 1.129, 1.119, 1.119, 1.159,
  // 2021
  1.179, 1.219, 1.259, 1.279, 1.289, 1.319, 1.339, 1.319, 1.349, 1.419, 1.439, 1.449,
  // 2022
  1.499, 1.569, 1.749, 1.699, 1.809, 1.939, 1.889, 1.799, 1.749, 1.779, 1.759, 1.699,
  // 2023
  1.679, 1.639, 1.589, 1.579, 1.559, 1.539, 1.569, 1.609, 1.659, 1.659, 1.619, 1.579,
  // 2024
  1.589, 1.609, 1.629, 1.659, 1.639, 1.629, 1.629, 1.599, 1.569, 1.579, 1.569, 1.569,
  // 2025
  1.589, 1.579, 1.559,
];

/* ---------- annual road-transport fuel consumption, litres ---------- */
const ANNUAL_VOLUME = {
  petrol: {
    2019: 2_100_000_000,
    2020: 1_700_000_000,
    2021: 1_850_000_000,
    2022: 1_900_000_000,
    2023: 1_800_000_000,
    2024: 1_750_000_000,
    2025: 1_700_000_000,
  },
  diesel: {
    2019: 4_400_000_000,
    2020: 3_800_000_000,
    2021: 4_200_000_000,
    2022: 4_300_000_000,
    2023: 4_400_000_000,
    2024: 4_350_000_000,
    2025: 4_300_000_000,
  },
};

/* ---------- tax-rate look-up functions ---------- */

// CO₂ emission factors: petrol 2.302 kg/L, diesel 2.676 kg/L
// Carbon tax per tonne increased each October on Budget night
function getCarbonTax(year, month, fuel) {
  const co2 = fuel === "petrol" ? 2.302 : 2.676;
  let rate;
  if (year < 2019 || (year === 2019 && month < 9)) rate = 20;
  else if (year === 2019 || (year === 2020 && month < 9)) rate = 26;
  else if (year === 2020 || (year === 2021 && month < 9)) rate = 33.5;
  else if (year === 2021 || (year === 2022 && month < 9)) rate = 41;
  else if (year === 2022 || (year === 2023 && month < 9)) rate = 48.5;
  else if (year === 2023 || (year === 2024 && month < 9)) rate = 56;
  else rate = 63.5;
  return (rate / 1000) * co2;
}

// Base mineral oil tax rate (non-carbon component)
// Includes the March 2022 emergency cuts and phased restoration in 2023
const FULL_EXCISE = { petrol: 0.5877, diesel: 0.4257 };

function getActualExcise(year, month, fuel) {
  const full = FULL_EXCISE[fuel];
  if (fuel === "petrol") {
    // 20 c/L cut from 10 Mar 2022
    if ((year === 2022 && month >= 2) || (year === 2023 && month <= 4)) return full - 0.20;
    if (year === 2023 && month >= 5 && month <= 7) return full - 0.12; // +8c restored Jun
    if (year === 2023 && month === 8) return full - 0.06; // +6c restored Sep
    return full;
  }
  // diesel: 15 c/L cut from 10 Mar 2022
  if ((year === 2022 && month >= 2) || (year === 2023 && month <= 4)) return full - 0.15;
  if (year === 2023 && month >= 5 && month <= 7) return full - 0.095; // +5.5c restored Jun
  if (year === 2023 && month === 8) return full - 0.0475; // +4.75c restored Sep
  return full;
}

/* ---------- build monthly series ---------- */

function buildMonthlySeries() {
  const series = [];
  const startYear = 2019;
  let index = 0;

  for (let year = startYear; year <= 2025; year++) {
    const maxMonth = year === 2025 ? 3 : 12;
    for (let month = 0; month < maxMonth; month++) {
      series.push({
        key: `${year}-${String(month + 1).padStart(2, "0")}`,
        year,
        month,
        label: `${shortMonth(month)} ${String(year).slice(2)}`,
        brent: BRENT_EUR[index],
        petrolPump: PETROL_PUMP[index],
        dieselPump: DIESEL_PUMP[index],
      });
      index++;
    }
  }

  // Derive wholesale prices from actual pump prices and actual tax rates
  for (const row of series) {
    for (const fuel of ["petrol", "diesel"]) {
      const pump = fuel === "petrol" ? row.petrolPump : row.dieselPump;
      const actualExcise = getActualExcise(row.year, row.month, fuel);
      const carbon = getCarbonTax(row.year, row.month, fuel);
      // pump = (wholesale + excise + carbon) * (1 + VAT)
      // wholesale = pump / (1 + VAT) - excise - carbon
      row[fuel + "Wholesale"] = Math.max(0.20, pump / (1 + VAT_RATE) - actualExcise - carbon);
    }
  }

  return series;
}

/* ---------- state ---------- */

const state = {
  fuel: "petrol",
  referencePrice: 75,
  lowerBound: 65,
  upperBound: 85,
  adjustmentCoefficient: 0.4,
  elasticity: 0.15,
  timeWindow: "all",
};

/* ---------- DOM references ---------- */

const elements = {
  referencePrice: document.getElementById("referencePrice"),
  lowerBound: document.getElementById("lowerBound"),
  upperBound: document.getElementById("upperBound"),
  adjustmentCoefficient: document.getElementById("adjustmentCoefficient"),
  elasticity: document.getElementById("elasticity"),
  timeWindow: document.getElementById("timeWindow"),
  referenceValue: document.getElementById("referenceValue"),
  lowerValue: document.getElementById("lowerValue"),
  upperValue: document.getElementById("upperValue"),
  coefficientValue: document.getElementById("coefficientValue"),
  elasticityValue: document.getElementById("elasticityValue"),
  windowValue: document.getElementById("windowValue"),
  avgPumpGap: document.getElementById("avgPumpGap"),
  annualConsumerSaving: document.getElementById("annualConsumerSaving"),
  fillUpSaving: document.getElementById("fillUpSaving"),
  driverAnnualSaving: document.getElementById("driverAnnualSaving"),
  cumulativeFiscalImpact: document.getElementById("cumulativeFiscalImpact"),
  volatilityReduction: document.getElementById("volatilityReduction"),
  heroPumpCut: document.getElementById("heroPumpCut"),
  heroFillSaving: document.getElementById("heroFillSaving"),
  heroConsumerGain: document.getElementById("heroConsumerGain"),
  priceChart: document.getElementById("priceChart"),
  exciseChart: document.getElementById("exciseChart"),
  revenueChart: document.getElementById("revenueChart"),
  savingsChart: document.getElementById("savingsChart"),
};

const months = buildMonthlySeries();

/* ---------- helpers ---------- */

function shortMonth(m) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function formatCurrency(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return `€${(v / 1e9).toFixed(2)}bn`;
  if (a >= 1e6) return `€${(v / 1e6).toFixed(0)}m`;
  return `€${v.toFixed(0)}`;
}

function formatEuro(v) {
  return `€${v.toFixed(2)}`;
}

function formatCents(v) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(1)} c/L`;
}

function formatPercent(v) {
  return `${v.toFixed(0)}%`;
}

/* ---------- UI labels ---------- */

function updateLabels() {
  elements.referenceValue.textContent = `€${state.referencePrice}/bbl`;
  elements.lowerValue.textContent = `€${state.lowerBound}/bbl`;
  elements.upperValue.textContent = `€${state.upperBound}/bbl`;
  elements.coefficientValue.textContent = `${state.adjustmentCoefficient.toFixed(2)} c/L per €1`;
  elements.elasticityValue.textContent = state.elasticity.toFixed(2);
  elements.windowValue.textContent =
    state.timeWindow === "shock" ? "2021-2023" : state.timeWindow === "recent" ? "2023-2025" : "2019-2025";
}

/* ---------- filtering ---------- */

function filterSeries(series) {
  if (state.timeWindow === "shock") return series.filter((r) => r.year >= 2021 && r.year <= 2023);
  if (state.timeWindow === "recent") return series.filter((r) => r.year >= 2023);
  return series;
}

/* ---------- core simulation ---------- */

function computeScenario() {
  const fuel = state.fuel;
  const fullExcise = FULL_EXCISE[fuel];
  const selectedSeries = filterSeries(months);

  const data = selectedSeries.map((row) => {
    const wholesale = row[fuel + "Wholesale"];
    const carbonTax = getCarbonTax(row.year, row.month, fuel);
    const yearVolume = ANNUAL_VOLUME[fuel][row.year] || ANNUAL_VOLUME[fuel][2024];
    const monthlyVolume = yearVolume / 12;

    // Baseline: full excise rate (no ad-hoc cuts) — the counterfactual
    const baselinePump = (wholesale + fullExcise + carbonTax) * (1 + VAT_RATE);

    // Corridor rule
    const upperGap = Math.max(0, row.brent - state.upperBound);
    const lowerGap = Math.max(0, state.lowerBound - row.brent);
    const exciseShift = (-upperGap + lowerGap) * (state.adjustmentCoefficient / 100);
    const corridorExcise = clamp(fullExcise + exciseShift, 0, fullExcise * 1.5);
    const corridorPump = (wholesale + corridorExcise + carbonTax) * (1 + VAT_RATE);

    const pumpDelta = corridorPump - baselinePump;

    // Behavioural adjustment for demand elasticity
    const behaviouralAdj = 1 + state.elasticity * ((baselinePump - corridorPump) / baselinePump);
    const adjustedVolume = monthlyVolume * clamp(behaviouralAdj, 0.92, 1.08);

    // Revenue per litre
    const baseRevPerL = fullExcise + carbonTax + VAT_RATE * (wholesale + fullExcise + carbonTax);
    const corrRevPerL = corridorExcise + carbonTax + VAT_RATE * (wholesale + corridorExcise + carbonTax);

    return {
      ...row,
      brent: row.brent,
      baselineExcise: fullExcise,
      corridorExcise,
      baselinePump,
      corridorPump,
      pumpDelta,
      baselineRevenue: baseRevPerL * monthlyVolume,
      corridorRevenue: corrRevPerL * adjustedVolume,
      consumerSaving: Math.max(0, baselinePump - corridorPump) * adjustedVolume,
    };
  });

  const avgPumpGap = average(data.map((d) => d.corridorPump - d.baselinePump));
  const totalConsumerSaving = sum(data.map((d) => d.consumerSaving));
  const totalFiscalImpact = sum(data.map((d) => d.corridorRevenue - d.baselineRevenue));
  const volBase = standardDeviation(data.map((d) => d.baselinePump));
  const volCorr = standardDeviation(data.map((d) => d.corridorPump));
  const volatilityReduction = volBase === 0 ? 0 : (1 - volCorr / volBase) * 100;

  return {
    data,
    avgPumpGap,
    totalConsumerSaving,
    totalFiscalImpact,
    volatilityReduction,
    yearlySavings: groupByYear(data, "consumerSaving"),
    yearlyRevenue: groupByYear(data, "baselineRevenue", "corridorRevenue"),
  };
}

function average(vals) {
  return vals.length ? sum(vals) / vals.length : 0;
}

function sum(vals) {
  return vals.reduce((a, b) => a + b, 0);
}

function standardDeviation(vals) {
  const m = average(vals);
  return Math.sqrt(average(vals.map((v) => (v - m) ** 2)));
}

function groupByYear(data, leftField, rightField) {
  const grouped = new Map();
  for (const d of data) {
    if (!grouped.has(d.year)) grouped.set(d.year, { year: d.year, left: 0, right: 0 });
    const g = grouped.get(d.year);
    g.left += d[leftField];
    if (rightField) g.right += d[rightField];
  }
  return [...grouped.values()];
}

/* ---------- render ---------- */

function render() {
  updateLabels();
  const result = computeScenario();
  const years = new Set(result.data.map((d) => d.year));
  const latestYear = Math.max(...years);
  const currentYearSavings = result.yearlySavings.find((e) => e.year === latestYear)?.left || 0;
  const fillUp = Math.max(0, -result.avgPumpGap * 50);
  const driverSaving = Math.max(0, -result.avgPumpGap * 1300);

  elements.avgPumpGap.textContent = formatCents(result.avgPumpGap);
  elements.annualConsumerSaving.textContent = formatCurrency(currentYearSavings);
  elements.fillUpSaving.textContent = formatEuro(fillUp);
  elements.driverAnnualSaving.textContent = formatCurrency(driverSaving);
  elements.cumulativeFiscalImpact.textContent = formatCurrency(result.totalFiscalImpact);
  elements.volatilityReduction.textContent = formatPercent(result.volatilityReduction);
  elements.heroPumpCut.textContent = formatCents(result.avgPumpGap);
  elements.heroFillSaving.textContent = formatEuro(fillUp);
  elements.heroConsumerGain.textContent = formatCurrency(currentYearSavings);

  drawPriceChart(result.data);
  drawExciseChart(result.data);
  drawRevenueChart(result.yearlyRevenue);
  drawSavingsChart(result.yearlySavings);
}

/* ============================================================
   Chart drawing — SVG, no dependencies
   ============================================================ */

function drawPriceChart(data) {
  const svg = elements.priceChart;
  const W = 900, H = 340;
  const m = { top: 20, right: 56, bottom: 42, left: 54 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;

  const pVals = data.flatMap((d) => [d.baselinePump, d.corridorPump]);
  const oVals = data.map((d) => d.brent);
  const pMin = Math.min(...pVals) * 0.95, pMax = Math.max(...pVals) * 1.03;
  const oMin = Math.min(...oVals) * 0.92, oMax = Math.max(...oVals) * 1.05;

  const x = (i) => m.left + (i / (data.length - 1 || 1)) * iW;
  const yP = (v) => m.top + iH - ((v - pMin) / (pMax - pMin || 1)) * iH;
  const yO = (v) => m.top + iH - ((v - oMin) / (oMax - oMin || 1)) * iH;

  const bPath = linePath(data.map((d, i) => [x(i), yP(d.baselinePump)]));
  const cPath = linePath(data.map((d, i) => [x(i), yP(d.corridorPump)]));
  const oPath = linePath(data.map((d, i) => [x(i), yO(d.brent)]));

  const peak = data.reduce((best, d, i) => {
    const s = Math.max(0, d.baselinePump - d.corridorPump) * 50;
    return !best || s > best.saving ? { index: i, item: d, saving: s } : best;
  }, null);

  const ann = peak && peak.saving > 0 ? priceChartAnnotation(peak, x, yP, W, m) : "";

  svg.innerHTML = `
    ${gridLines(W, H, m, 4)}
    ${xTicks(data, x, H)}
    ${leftAxisTicks(pMin, pMax, yP, m.left - 12, "€ / litre")}
    ${rightAxisTicks(oMin, oMax, yO, W - m.right + 12, "€ / bbl")}
    <path d="${oPath}" fill="none" stroke="#d77d30" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
    <path d="${bPath}" fill="none" stroke="#285f8f" stroke-width="4" stroke-linecap="round"/>
    <path d="${cPath}" fill="none" stroke="#0c7a5f" stroke-width="4" stroke-linecap="round"/>
    ${legend([
      { color: "#285f8f", label: "Baseline (full excise)" },
      { color: "#0c7a5f", label: "Corridor pump price" },
      { color: "#d77d30", label: "Brent crude (right axis)" },
    ])}
    ${ann}
  `;
}

function drawExciseChart(data) {
  const svg = elements.exciseChart;
  const W = 420, H = 280;
  const m = { top: 18, right: 18, bottom: 38, left: 54 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;
  const vals = data.flatMap((d) => [d.baselineExcise, d.corridorExcise]);
  const mn = Math.min(...vals) * 0.9, mx = Math.max(...vals) * 1.06;
  const x = (i) => m.left + (i / (data.length - 1 || 1)) * iW;
  const y = (v) => m.top + iH - ((v - mn) / (mx - mn || 1)) * iH;

  svg.innerHTML = `
    ${gridLines(W, H, m, 4)}
    ${xTicks(data, x, H)}
    ${leftAxisTicks(mn, mx, y, m.left - 12, "€ / litre")}
    <path d="${linePath(data.map((d, i) => [x(i), y(d.baselineExcise)]))}" fill="none" stroke="#3f4c5c" stroke-width="3"/>
    <path d="${linePath(data.map((d, i) => [x(i), y(d.corridorExcise)]))}" fill="none" stroke="#0c7a5f" stroke-width="4"/>
    ${legend([{ color: "#3f4c5c", label: "Full-rate excise" }, { color: "#0c7a5f", label: "Corridor excise" }], 20, 20)}
  `;
}

function drawRevenueChart(data) {
  const svg = elements.revenueChart;
  const W = 420, H = 280;
  const m = { top: 18, right: 18, bottom: 44, left: 64 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;
  const mx = Math.max(...data.flatMap((d) => [d.left, d.right])) * 1.12;
  const bw = iW / data.length / 2.6;
  const y = (v) => m.top + iH - (v / (mx || 1)) * iH;

  const bars = data.map((d, i) => {
    const bx = m.left + (i / data.length) * iW + 16;
    return `
      <rect x="${bx}" y="${y(d.left)}" width="${bw}" height="${m.top + iH - y(d.left)}" rx="8" fill="#285f8f"/>
      <rect x="${bx + bw + 8}" y="${y(d.right)}" width="${bw}" height="${m.top + iH - y(d.right)}" rx="8" fill="#0c7a5f"/>
      <text class="tick" x="${bx + bw}" y="${H - 14}" text-anchor="middle">${d.year}</text>
    `;
  }).join("");

  svg.innerHTML = `
    ${gridLines(W, H, m, 4)}
    ${leftAxisTicks(0, mx, y, m.left - 12, "€ revenue")}
    ${bars}
    ${legend([{ color: "#285f8f", label: "Baseline" }, { color: "#0c7a5f", label: "Corridor" }], 20, 20)}
  `;
}

function drawSavingsChart(data) {
  const svg = elements.savingsChart;
  const W = 900, H = 280;
  const m = { top: 20, right: 20, bottom: 44, left: 64 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;
  const mx = Math.max(...data.map((d) => d.left)) * 1.15;
  const bw = iW / data.length / 1.8;
  const y = (v) => m.top + iH - (v / (mx || 1)) * iH;

  const bars = data.map((d, i) => {
    const bx = m.left + (i / data.length) * iW + 18;
    return `
      <rect x="${bx}" y="${y(d.left)}" width="${bw}" height="${m.top + iH - y(d.left)}" rx="12" fill="#d77d30"/>
      <text class="tick" x="${bx + bw / 2}" y="${H - 14}" text-anchor="middle">${d.year}</text>
    `;
  }).join("");

  svg.innerHTML = `
    ${gridLines(W, H, m, 4)}
    ${leftAxisTicks(0, mx, y, m.left - 12, "€ saving")}
    ${bars}
  `;
}

/* ---------- chart primitives ---------- */

function linePath(pts) {
  return pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
}

function gridLines(W, H, m, n) {
  const lines = [];
  for (let i = 0; i <= n; i++) {
    const y = m.top + ((H - m.top - m.bottom) / n) * i;
    lines.push(`<line x1="${m.left}" x2="${W - m.right}" y1="${y}" y2="${y}" stroke="rgba(37,33,30,0.12)" stroke-dasharray="4 8"/>`);
  }
  return lines.join("");
}

function xTicks(data, scaleX, H) {
  const count = Math.min(8, data.length);
  const step = Math.max(1, Math.floor(data.length / count));
  let t = "";
  for (let i = 0; i < data.length; i += step) {
    t += `<text class="tick" x="${scaleX(i)}" y="${H - 10}" text-anchor="middle">${data[i].label}</text>`;
  }
  return t;
}

function leftAxisTicks(mn, mx, scaleY, x, label) {
  let o = `<text class="axis-label" x="${x}" y="14" text-anchor="start">${label}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = mn + ((mx - mn) / 4) * i;
    o += `<text class="tick" x="${x}" y="${scaleY(v) + 4}" text-anchor="end">${axisNum(v)}</text>`;
  }
  return o;
}

function rightAxisTicks(mn, mx, scaleY, x, label) {
  let o = `<text class="axis-label" x="${x}" y="14" text-anchor="end">${label}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = mn + ((mx - mn) / 4) * i;
    o += `<text class="tick" x="${x}" y="${scaleY(v) + 4}" text-anchor="start">${axisNum(v)}</text>`;
  }
  return o;
}

function axisNum(v) {
  return v >= 10 ? Math.round(v).toString() : v.toFixed(2);
}

function legend(items, sx = 24, sy = 22) {
  return items.map((it, i) => `
    <circle cx="${sx}" cy="${sy + i * 20}" r="5" fill="${it.color}"/>
    <text class="legend-label" x="${sx + 12}" y="${sy + i * 20 + 4}">${it.label}</text>
  `).join("");
}

function priceChartAnnotation(pt, x, yP, W, m) {
  const cx = x(pt.index), cy = yP(pt.item.corridorPump);
  const bW = 208, bH = 56;
  const bX = Math.min(W - m.right - bW, cx + 18);
  const bY = Math.max(30, cy - 76);
  return `
    <line x1="${cx}" y1="${cy}" x2="${bX}" y2="${bY + 18}" stroke="#0c7a5f" stroke-width="2" stroke-dasharray="4 6"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="#0c7a5f" stroke="#fff8ef" stroke-width="3"/>
    <rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="14" fill="rgba(255,252,247,0.96)" stroke="rgba(12,122,95,0.22)"/>
    <text class="annotation-title" x="${bX + 14}" y="${bY + 22}">Peak 50L saving: ${formatEuro(pt.saving)}</text>
    <text class="annotation-copy" x="${bX + 14}" y="${bY + 40}">${pt.item.label} in selected window</text>
  `;
}

/* ---------- controls ---------- */

function bindControls() {
  elements.referencePrice.addEventListener("input", (e) => {
    state.referencePrice = Number(e.target.value);
    render();
  });

  elements.lowerBound.addEventListener("input", (e) => {
    state.lowerBound = Number(e.target.value);
    if (state.lowerBound >= state.upperBound) {
      state.upperBound = state.lowerBound + 1;
      elements.upperBound.value = String(state.upperBound);
    }
    render();
  });

  elements.upperBound.addEventListener("input", (e) => {
    state.upperBound = Number(e.target.value);
    if (state.upperBound <= state.lowerBound) {
      state.lowerBound = state.upperBound - 1;
      elements.lowerBound.value = String(state.lowerBound);
    }
    render();
  });

  elements.adjustmentCoefficient.addEventListener("input", (e) => {
    state.adjustmentCoefficient = Number(e.target.value);
    render();
  });

  elements.elasticity.addEventListener("input", (e) => {
    state.elasticity = Number(e.target.value);
    render();
  });

  elements.timeWindow.addEventListener("change", (e) => {
    state.timeWindow = e.target.value;
    render();
  });

  document.querySelectorAll("[data-fuel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.fuel = btn.dataset.fuel;
      document.querySelectorAll("[data-fuel]").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });
}

bindControls();
render();

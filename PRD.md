# Product Requirements Document

## Product Name

Irish Fuel Tax Corridor Simulator

## Summary

The Irish Fuel Tax Corridor Simulator is an interactive web application that models how a corridor-based fuel tax stabiliser would affect pump prices, tax revenue, and consumer welfare in Ireland. The product is designed for policymakers, researchers, journalists, and informed public users who need a practical way to test fuel tax scenarios against historical Irish market data.

The application should let users adjust corridor rule parameters and see near-instant updates to fiscal and consumer outcomes. It should make dynamic fuel tax policy legible by showing how excise duty would respond to oil price shocks and how those responses would affect households and the Exchequer over time.

## Problem Statement

Irish fuel tax debates are typically static, narrative-driven, and difficult to quantify in real time. When oil prices rise, the State may collect higher VAT receipts as pump prices increase, but the fiscal windfall, consumer burden, and tradeoffs from a stabilisation policy are not easy to observe. Existing discussion lacks a simple, transparent way to compare the status quo against a rule-based tax corridor.

This product addresses that gap by allowing users to simulate alternative tax corridor rules using historical Irish data and consistent pricing logic.

## Goals

- Show how Irish fuel taxes interact with oil price movements over time.
- Quantify the effect of a corridor stabiliser on pump prices, excise duty, VAT receipts, and total fuel tax revenue.
- Estimate consumer savings or losses under alternative policy rules.
- Make policy scenarios explorable in seconds, not hours.
- Provide exportable outputs that can support policy notes, research, and media reporting.

## Non-Goals

- Forecast international oil prices.
- Provide household-level microsimulation in the first release.
- Model full general equilibrium or macroeconomic effects.
- Replace official Department of Finance costing processes.
- Recommend a normative policy choice.

## Primary Users

- Policymakers in the Department of Finance and Department of the Environment.
- Economic researchers and policy analysts.
- Journalists covering inflation, energy markets, and public finance.
- Public users interested in energy costs and tax policy.

## Core User Questions

- How much additional tax revenue does the Irish State collect when oil prices spike?
- How would a corridor stabiliser reduce that windfall?
- What would the consumer pump price path look like under the corridor rule?
- What is the cumulative fiscal cost or saving relative to the status quo?
- How much price volatility is reduced with the corridor?

## Product Scope

### In Scope for V1

- Historical simulation for Ireland from 2005 to present.
- Petrol and diesel views.
- Weekly or monthly time series.
- Baseline pump price decomposition.
- Corridor-based excise adjustment simulation.
- Consumer savings estimates based on fuel consumption.
- Fiscal impact calculations relative to baseline.
- Interactive charts and slider-driven scenario controls.
- Export of scenario summary metrics.

### Out of Scope for V1

- Regional or household distributional analysis.
- Live commodity market feeds.
- User accounts and saved scenarios.
- API access for third parties.
- CPI and inflation pass-through extensions.
- Carbon tax pathway optimisation.

## Product Principles

- Transparent: every output should be traceable to a clearly defined formula or source.
- Fast: parameter changes should update charts and summary metrics within 200 milliseconds.
- Credible: assumptions and data limitations should be visible to users.
- Comparable: the corridor scenario should always be benchmarked against a baseline.
- Explainable: policy logic should be legible to non-technical users.

## User Stories

- As a policymaker, I want to test different corridor bands so I can estimate the fiscal cost of stabilising fuel prices.
- As a researcher, I want to compare baseline and corridor scenarios over a chosen period so I can evaluate policy tradeoffs.
- As a journalist, I want a clear visual explanation of how tax revenue changes during oil price spikes so I can report accurately.
- As a public user, I want to see how much pump prices might have changed under a stabiliser so I can understand the consumer effect.

## Functional Requirements

### 1. Data Ingestion Module

The application must load and maintain historical Irish fuel market and tax data.

Required series:

- Brent crude price in euro per barrel.
- Irish retail petrol price per litre.
- Irish retail diesel price per litre.
- Irish excise duty rates for petrol and diesel.
- Irish carbon tax rates applicable to transport fuels.
- VAT rate on fuel.
- Estimated wholesale fuel price.
- Irish fuel consumption volumes for petrol and diesel.

### 2. Baseline Tax Structure Model

Baseline equation:

`Pump price = (Wholesale fuel price + Excise duty + Carbon tax) * (1 + VAT rate)`

Outputs:

- Total tax per litre.
- Tax share of pump price.
- Government revenue from fuel consumption.

### 3. Corridor Policy Rule Module

Users define:

- Reference oil price.
- Lower corridor bound.
- Upper corridor bound.
- Excise adjustment coefficient.

Rule:

- When oil price exceeds the upper bound, excise falls according to the coefficient.
- When oil price falls below the lower bound, excise rises according to the coefficient.
- When oil price remains inside the corridor, excise remains at baseline.

### 4. Consumer Impact Module

Primary calculation:

`Consumer benefit = pump price reduction per litre * fuel consumption volume`

Outputs:

- Average pump price difference.
- Annual consumer savings.
- Volatility distribution.

### 5. Fiscal Impact Module

Outputs:

- Annual fiscal impact.
- Cumulative fiscal impact since chosen start year.
- Share of windfall revenue removed.

### 6. Visualisation Dashboard

Required charts:

- Brent price and pump price under baseline and corridor.
- Excise duty path under the corridor rule.
- Revenue comparison baseline versus corridor.
- Consumer savings per year.

Required controls:

- Fuel type toggle.
- Time window selector.
- Reference oil price slider.
- Lower corridor bound slider.
- Upper corridor bound slider.
- Excise adjustment strength slider.
- Fuel consumption elasticity slider.

## Performance Requirements

- Initial page load under 3 seconds.
- Slider-driven simulation updates within 200 milliseconds.
- Export generation within 3 seconds for a standard historical window.

## Technical Requirements

- React plus D3.js for production implementation.
- FastAPI or Node backend for data and simulation endpoints.
- PostgreSQL or parquet-backed storage.
- Deployable to Vercel or AWS.

## Risks and Open Questions

- Wholesale fuel price may need to be estimated rather than directly observed.
- Historical tax changes may not align neatly with chosen data frequency.
- Elasticity assumptions may materially affect welfare estimates.
- The corridor rule needs a final formal policy specification.

## Future Extensions

- CPI basket integration.
- Carbon tax pathway simulation through 2030.
- Distributional analysis by household type or region.
- Shareable saved scenarios.

## Source Links

- CSO fuel price series: <https://www.cso.ie/en/statistics/energy/>
- Revenue Commissioners mineral oil tax rates: <https://www.revenue.ie/en/companies-and-charities/excise-and-licences/excise-duty-rates/mineral-oil-tax.aspx>
- SEAI national energy balance: <https://www.seai.ie/data-and-insights/seai-statistics/energy-balance/>
- Brent crude price series: <https://fred.stlouisfed.org/series/DCOILBRENTEU>
- IEA oil market reports: <https://www.iea.org/reports/oil-market-report>

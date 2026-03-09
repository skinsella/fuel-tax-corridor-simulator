# Irish Fuel Tax Corridor Simulator

Static HTML prototype and product requirements for an Irish fuel tax corridor policy simulator.

## What is in this repo

- `index.html`: minister-facing demo page.
- `styles.css`: visual design and layout.
- `app.js`: interactive simulation logic and chart rendering.
- `PRD.md`: product requirements document.

## Current status

This is a dependency-free prototype intended for demonstration. It uses illustrative historical data generated in-browser so the policy mechanics can be shown without a backend.

The next build phase should replace the demo dataset with real Irish series from:

- CSO fuel prices
- Revenue Commissioners mineral oil tax rates
- SEAI energy balance
- Brent crude price data

## Run locally

Open `index.html` directly in a browser, or serve the folder with a simple static server.

Example:

```bash
cd /Users/stephenkinsella/fuel-tax-corridor-simulator
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish to GitHub

1. Create a new empty GitHub repository.
2. Add it as the remote:

```bash
git -C /Users/stephenkinsella/fuel-tax-corridor-simulator remote add origin <your-repo-url>
```

3. Commit and push:

```bash
git -C /Users/stephenkinsella/fuel-tax-corridor-simulator add .
git -C /Users/stephenkinsella/fuel-tax-corridor-simulator commit -m "Initial minister demo"
git -C /Users/stephenkinsella/fuel-tax-corridor-simulator branch -M main
git -C /Users/stephenkinsella/fuel-tax-corridor-simulator push -u origin main
```

4. For GitHub Pages, enable Pages from the `main` branch root in the repository settings.

## Notes

- The prototype is intentionally simple to host.
- All charts are rendered with plain SVG and vanilla JavaScript.
- Outputs should be treated as illustrative until real data ingestion is wired in.

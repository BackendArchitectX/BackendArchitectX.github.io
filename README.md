# Pranay Kadu — Engineering Portfolio

Source-first engineering portfolio for my backend, distributed-systems and production work.

Live site: https://backendarchitectx.github.io/

## What is included

- Production case studies: fraud screening, financial transaction workflows and external-data integration
- Public systems work: Vortex CUDA, distributed transactions, Java AI tooling and selected learning projects
- Upstream contributions to AutoMQ, Apache Fluss and Trino
- Career record and engineering surface

The site intentionally separates production work, public projects and upstream contributions so they are not presented as equivalent evidence.

## Structure

```text
index.html          Home / engineering record
styles.css          Final responsive portfolio layer
foundation.css      Shared base styles for home and case studies
script.js           Progressive navigation and scroll-state enhancements
work/               Production case studies
lab/                Public-system case studies
404.html            Custom not-found route
robots.txt          Crawler rules
sitemap.xml         Search-engine sitemap
```

## Run locally

No build step is required. Serve the repository root with any static server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

The site is deployed with GitHub Pages from the `main` branch and repository root.

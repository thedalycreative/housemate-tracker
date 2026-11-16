# Housemate Tracker

> Split shared bills, rotate the cleaning roster and keep inspections and tradie visits on one shared house calendar.

**Live demo:** [housemate-tracker.vercel.app](https://housemate-tracker.vercel.app)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square) ![localStorage](https://img.shields.io/badge/localStorage-555555?style=flat-square) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square)

## Features

- **Overview** — outstanding shares, chores done this week, upcoming visitors and who owes whom at a glance
- **Shared bills** — add a bill, choose who paid upfront and who it's split between, tick off each person's share; overdue bills are flagged
- **Settle up** — balances are simplified into the fewest possible transfers
- **Cleaning roster** — four chores rotate automatically every Monday; browse past/future weeks, tick chores off and see 6-week streaks
- **House calendar** — month view of inspections, handyman/tradie visits, bin nights, rent and house socials, with an add-event form
- Demo data is generated relative to today, saved in `localStorage`, and can be reset from the footer
- Accessible: skip link, live-region announcements, keyboard-friendly controls, responsive down to phones

## Tech stack

- Vanilla JavaScript (no framework, no build)
- Hand-written CSS with custom properties; Plus Jakarta Sans
- `localStorage` persistence
- Hosted on Vercel as a static site

## Run it locally

```bash
git clone https://github.com/thedalycreative/housemate-tracker.git
cd housemate-tracker
python3 -m http.server 8000   # or: npx serve .
# open http://localhost:8000
```

## Deployment (Vercel)

Static site — no build command, output directory is the repo root. The Vercel project **housemate-tracker** is linked to this repo and deploys `main` to production at **https://housemate-tracker.vercel.app**.

## Screenshots

![Housemate Tracker demo](docs/screenshots/demo.gif)

<p align="center">
  <img src="docs/screenshots/desktop.jpg" alt="Overview" width="560">
  <img src="docs/screenshots/bills.jpg" alt="Shared bills with splits" width="560">
  <img src="docs/screenshots/roster.jpg" alt="Cleaning roster" width="560">
  <img src="docs/screenshots/calendar.jpg" alt="House calendar" width="560">
  <img src="docs/screenshots/mobile.jpg" alt="Overview on a phone" width="260">
</p>

_Captured from the live site (https://housemate-tracker.vercel.app). Regenerate with any headless browser; files live in `docs/screenshots/`._

> All housemates, addresses and events in this demo are fictional.

---

Built by [The Daly Creative](https://www.thedalycreative.com) · Perth, WA

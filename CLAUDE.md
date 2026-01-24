# Weather App - Project Instructions

## Overview
Personal weather web app that fetches NWS data and displays it in a clean, readable format.

## Live URL
**https://www.crafttiki.com/weather/**

## Project Structure
```
WeatherApp/
├── index.html                # Main page structure
├── styles.css                # Styling
├── app.js                    # API calls and rendering logic
├── CLAUDE.md                 # Project instructions (this file)
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions auto-deploy to Bluehost
└── docs/
    ├── WeatherApp.md         # Feature plan
    └── WeatherApp_Notes.md   # Implementation progress
```

## Source Control

**GitHub Repository:** https://github.com/CraftTiki/weather-app

```bash
# Clone the repo
git clone https://github.com/CraftTiki/weather-app.git

# Or if you already have a local copy, set the remote
git remote add origin https://github.com/CraftTiki/weather-app.git
```

## Deployment

Deployment is **automatic** via GitHub Actions. When you push to the `main` branch, the workflow uploads files to Bluehost via FTP.

### To Deploy Changes
```bash
cd C:/dev/WeatherApp
git add .
git commit -m "Your commit message"
git push
```

The GitHub Action (`.github/workflows/deploy.yml`) will automatically:
1. Checkout the code
2. Upload `index.html`, `styles.css`, and `app.js` to Bluehost
3. Deploy to `public_html/weather/` directory

### Deployment Details
- **Host:** Bluehost (crafttiki.com)
- **URL:** https://www.crafttiki.com/weather/
- **Method:** FTP via GitHub Actions
- **Trigger:** Push to `main` branch
- **Secrets Required:** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (configured in GitHub repo settings)

### Manual Deployment (if needed)
Upload these files to `public_html/weather/` via cPanel File Manager or FTP:
- `index.html`
- `styles.css`
- `app.js`

## Conventions

### Code Style
- Use vanilla JavaScript (no frameworks)
- Use modern ES6+ syntax (const/let, arrow functions, async/await)
- Keep functions small and focused
- Use meaningful variable names

### NWS API
- Base URL: `https://api.weather.gov`
- Always include User-Agent header
- Handle rate limiting gracefully
- Cache responses where appropriate

### Code Translation
Translate NWS codes to readable text:
- OV → Overcast
- B1/B2 → Mostly Cloudy
- SC → Partly Cloudy
- FW → Mostly Clear
- CL → Clear
- S → Slight Chance
- C → Chance
- L → Likely
- D → Definite

### UI Guidelines
- Mobile-first responsive design
- Color-coded alerts (red warnings, orange watches)
- Clean card-based layout
- Accessible color contrasts

## Testing
1. Open index.html in browser (or run local server)
2. Test with "Decatur, GA" or ZIP code
3. Verify all data displays correctly
4. Test alert display with locations having active alerts

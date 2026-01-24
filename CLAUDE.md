# Weather App - Project Instructions

## Overview
Personal weather web app that fetches NWS data and displays it in a clean, readable format.

## Project Structure
```
WeatherApp/
├── index.html      # Main page structure
├── styles.css      # Styling
├── app.js          # API calls and rendering logic
├── .netlify/       # Netlify config (linked to weatherbuster site)
└── docs/
    ├── WeatherApp.md       # Feature plan
    └── WeatherApp_Notes.md # Implementation progress
```

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
1. Open index.html in browser
2. Test with "Decatur, GA" or ZIP code
3. Verify all data displays correctly
4. Test alert display with locations having active alerts

## Deployment
Upload files to Bluehost via FTP or cPanel File Manager.

**Files to upload to `public_html/weather/`:**
- `index.html`
- `styles.css`
- `app.js`

- **Host:** Bluehost (crafttiki.com)
- **URL:** https://www.crafttiki.com/weather/
- **Note:** No build step needed - just upload the 3 static files

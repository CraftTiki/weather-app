# Weather App - Implementation Notes

## Progress Tracking

### Completed Features
- [x] HTML structure with semantic markup
- [x] CSS styling with responsive design
- [x] Geocoding/location services (Nominatim API)
- [x] NWS API integration for weather data
- [x] Current conditions display
- [x] Hourly forecast (24-hour scrolling)
- [x] 7-day forecast display
- [x] Detailed hourly data table
- [x] Weather alerts display (color-coded by severity)
- [x] **Interactive Map** - Leaflet.js with static radar view
- [x] **Deployed to Bluehost** - https://www.crafttiki.com/weather/
- [x] **Mobile-friendly design** - Touch-friendly, responsive layout
- [x] **Dark mode** - Toggle in settings, persists to localStorage
- [x] **Animated radar** - RainViewer API, always-on, auto-loads first frame
- [x] **Dark Sky-style hero** - Large icon + temp + feels like + alert badges
- [x] **Hyperlocal precipitation** - "Rain starting in X min" summary
- [x] **Inline header** - Search bar shows location, settings icon inline

### Completed Tasks (January 2026)
- [x] Task 1: Mobile-friendly design improvements
  - Added mobile-specific CSS (@media max-width: 480px)
  - Touch-friendly button sizes (min 44px)
  - Safe area padding for notched phones
  - Map collapsed by default on mobile
  - Font size 16px on inputs (prevents iOS zoom)
  - Optimized layouts for small screens
- [x] Task 2: Dark mode setting
  - CSS variables for dark theme ([data-theme="dark"])
  - Settings gear button (fixed position)
  - Slide-in settings panel
  - Toggle switch for dark mode
  - Persists to localStorage
  - Detects system preference (prefers-color-scheme: dark)
- [x] Task 3: Animated radar data display
  - Uses RainViewer API for animated radar frames
  - Toggle in settings panel to enable/disable
  - 60% opacity overlay on map
  - Timeline scrubber with play/pause button
  - Shows timestamps including "(Forecast)" label
  - 12 past frames + 3 forecast frames (15 total)
  - Smooth slider scrubbing (click anywhere on track)
  - Throttled frame updates (~30fps) for smooth dragging
  - CSS transition for smooth radar layer blending
  - Touch support for mobile scrubbing
  - Persists preference to localStorage
- [x] Task 4: Modern minimal header redesign
  - Removed blue gradient banner
  - Clean white/dark card background
  - Subtle border instead of heavy shadow
  - Blue "Search" button for primary action
  - Outlined "Use My Location" secondary button
  - Works seamlessly in both light and dark modes

## Deployment

### Live URL
**https://www.crafttiki.com/weather/**

### Auto-Deploy (GitHub Actions)
Pushing to `main` branch automatically deploys to Bluehost via FTP.

```bash
cd C:\dev\WeatherApp
git add .
git commit -m "Your changes"
git push
```

GitHub repo: https://github.com/CraftTiki/weather-app

### Local Development
```bash
cd C:\dev\WeatherApp
python -m http.server 8080
# Open: http://localhost:8080
```

## Project Structure
```
WeatherApp/
├── index.html                # Main page structure
├── styles.css                # All styling (1200+ lines)
├── app.js                    # All JavaScript (1500+ lines)
├── CLAUDE.md                 # Project instructions
├── .github/
│   └── workflows/
│       └── deploy.yml        # Auto-deploy to Bluehost
└── docs/
    ├── WeatherApp.md         # Feature plan
    └── WeatherApp_Notes.md   # This file
```

## Key Features Implemented

### Radar Map (Leaflet.js)
- Static map centered on current location (no pan/zoom)
- Blue marker shows selected location
- Radar always enabled with RainViewer overlay
- Auto-loads most recent radar frame on page load
- Timeline scrubber with play/pause for animation
- 12 past frames + 3 forecast frames

### Animated Radar (RainViewer)
- Play/pause button to animate radar frames
- Timeline slider to scrub through time
- Click anywhere on slider track to jump to that time
- Smooth dragging with throttled updates
- Timestamps with "(Forecast)" label for predictions
- CSS transitions for smooth frame blending
- 15 frames: 12 past + 3 forecast

### Weather Data (NWS API)
- Current temperature, conditions, wind, humidity, feels-like
- Hourly forecast for next 24 hours
- 7-day forecast with high/low temps
- Active weather alerts (warnings, watches, advisories)
- Detailed hourly table with multiple parameters

### Responsive Design
- Mobile-first CSS approach
- Breakpoints: 375px, 480px, 768px, 1024px, 1200px
- Collapsible map on mobile
- Touch-friendly interface

### Settings Panel
- Dark mode toggle (persists to localStorage)
- Slide-in panel with overlay
- Inline settings button in header row

## API Endpoints Used

### NWS (National Weather Service)
- Points: `https://api.weather.gov/points/{lat},{lon}`
- Gridpoints: `https://api.weather.gov/gridpoints/{office}/{x},{y}`
- Forecast: `https://api.weather.gov/gridpoints/{office}/{x},{y}/forecast`
- Alerts: `https://api.weather.gov/alerts/active?point={lat},{lon}`

### RainViewer (Radar Animation)
- Frames: `https://api.rainviewer.com/public/weather-maps.json`
- Tiles: `https://tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png`

### Nominatim (Geocoding)
- Forward: `https://nominatim.openstreetmap.org/search?q={query}&format=json`
- Reverse: `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json`

### Map Tiles (OpenStreetMap)
- `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

## External Libraries
- **Leaflet.js** v1.9.4 - Interactive maps
  - CSS: https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
  - JS: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js

## Notes

### CORS Issue
Opening `index.html` directly from file system causes CORS errors.
Must run local server (see Local Development above).

### Weather Code Translation
- OV → Overcast
- BKN/B1/B2 → Mostly Cloudy
- SCT/SC → Partly Cloudy
- FEW/FW → Mostly Clear
- SKC/CLR/CL → Clear
- Probability: S=Slight, C=Chance, L=Likely, D=Definite

### localStorage Keys
- `weatherapp_location` - Last viewed location (lat, lon, name)
- `weatherapp_theme` - Theme preference ('light' or 'dark')
- `weatherapp_recents` - Recent locations list (array)

## Testing Checklist
- [x] Location search works (city name)
- [x] Location search works (ZIP code)
- [x] Geolocation button works
- [x] Current conditions display correctly
- [x] 7-day forecast shows readable text
- [x] Hourly data table scrolls properly
- [x] Alerts display when present
- [x] Map click selects location
- [x] Map marker updates correctly
- [x] Mobile responsive layout works
- [x] Error handling for invalid locations
- [x] Error handling for API failures
- [x] Dark mode toggle works
- [x] Dark mode persists across refresh
- [x] Radar toggle works
- [x] Radar animation plays/pauses
- [x] Radar slider scrubbing works
- [x] Radar timestamps show correctly
- [x] Header looks good in light mode
- [x] Header looks good in dark mode

## Recent Changes (January 2026)

### Dark Sky Clone Redesign (January 24, 2026)

Created design document: `docs/DarkSky_Design.md`

#### Phase 1: Hero Section (Completed)
- **New hero layout** matching Dark Sky style:
  - Large weather icon + temperature side by side
  - "Feels like" temperature below
  - Alert badges as inline colored pills (not full-width blocks)
  - Hyperlocal precipitation summary ("Next Hour: No precipitation" / "Rain starting in X min")
- **Header redesign**:
  - Search bar + settings icon inline in single row
  - Search bar shows current location name as placeholder
  - Removed "Weather Buster" title for cleaner look
  - Settings gear icon inline (not floating)
- **Map moved below hero**:
  - Now inside main content area, after hero section
  - Removed location name/coordinates from map header
  - Static map (no dragging, zooming, or pan)
  - Zoom controls removed
  - Radar always enabled (no toggle button)
  - Radar loads first frame automatically on page load

#### Layout Flow (Current)
```
Header (search bar + settings)
    ↓
Hero (icon + temp + feels like + alerts + precipitation summary)
    ↓
Radar Map (static, always-on radar with timeline controls)
    ↓
Hourly Forecast (horizontal scroll cards) ← TODO: Convert to vertical list
    ↓
7-Day Forecast
    ↓
Detailed Table
```

#### TODO: Phase 2 - Hourly Timeline
- [ ] Convert horizontal scroll cards to vertical list
- [ ] Add condition duration bars (left edge colored bars)
- [ ] Add toggle buttons: TEMP / FEELS-LIKE / PRECIP PROB %
- [ ] Time | icon | condition text | dotted line | temperature layout

#### TODO: Phase 3 - Weekly Forecast
- [ ] Temperature pills with range visualization
- [ ] Magnitude-preserved temperature bars across days

### Header Redesign (Earlier)
- Removed gradient blue banner (was placeholder-looking)
- Clean card-style background (white in light, dark gray in dark mode)
- Subtle bottom border instead of heavy shadow
- Blue primary button for Search
- Outlined secondary button for Use My Location
- Better integration with overall page design

### Radar Improvements
- Added click-on-track support for slider (calculates position from click)
- Smooth dragging with mousedown/touchstart event handling
- Throttled frame updates to ~30fps for performance
- CSS transition (150ms) on radar layers for smooth blending
- Proper touch event support for mobile

### Code Organization
- Radar functions in dedicated section
- Settings functions grouped together
- Map functions with radar integration
- Clean event listener setup

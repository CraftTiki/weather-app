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
- [x] **Animated radar** - RainViewer API, always-on, auto-loads first frame, preloaded frames
- [x] **Dark Sky-style hero** - Large icon + temp + feels like + alert badges
- [x] **Hyperlocal precipitation** - "Rain starting in X min" summary
- [x] **Inline header** - Search bar shows location, settings icon inline
- [x] **Search autocomplete** - Photon API, prefix matching, force valid selections
- [x] **Recent locations** - Quick access dropdown with event delegation for mobile
- [x] **Time Machine** - View historical weather for any date (1940-present) via Open-Meteo API
- [x] **Distinct condition colors** - Cyan for light rain, blue for rain, etc.

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
Next 12 Hours (compact vertical list with horizontal temp bars)
    ↓
7-Day Forecast (simple layout with inline precip)
    ↓
Detailed Table
```

#### Completed: Phase 2 - Hourly Timeline ✅
- [x] Convert to vertical list format
- [x] Add condition duration bars (left edge colored bars)
- [x] Add toggle buttons: TEMP / FEELS-LIKE / PRECIP PROB %
- [x] Horizontal temperature bars (width = relative temp)
- [x] Compact rows (36px height) - all 12 hours visible without scrolling

#### Completed: Phase 3 - Weekly Forecast ✅
- [x] Simple layout: Day | Icon+💧% | Condition | High° Low°
- [x] Precipitation % shown inline with weather icon (when > 0%)
- [x] Clean, compact rows without floating elements

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

### 7-Day Forecast Precipitation Alignment Fix (January 25, 2026)
- Fixed precipitation percentage alignment issue in 7-day forecast
- Problem: "💧99%" was shifted right instead of left-aligned under day name
- Root cause: Duplicate `.daily-precip` CSS rule with `justify-content: flex-end`
- Solution:
  - Consolidated `.daily-precip` styles to single location (line ~1389)
  - Removed conflicting duplicate rule that had `justify-content: flex-end`
  - Added `margin-left: -2px` to nudge emoji left for better optical alignment
  - Simplified CSS: removed unnecessary flexbox, added `text-align: left`

### Search Autocomplete & UX Improvements (January 25, 2026)

#### Location Search Autocomplete
- Added autocomplete suggestions as user types (2+ characters)
- Uses **Photon API** (https://photon.komoot.io) for better prefix/partial matching
  - Example: typing "greenv" shows Greenville results
  - Nominatim didn't handle partial words well
- Results filtered to US cities/towns, deduplicated
- 300ms debounce to reduce API calls
- Enter key selects first suggestion if available

#### Force Valid Locations Only
- Users must select from autocomplete suggestions
- Invalid searches show "No results for X" in dropdown (not error popup)
- Eliminates the "location not found" error loop issue
- Removed `handleSearch()` free-text search function
- Simplified retry button (only for network errors now)

#### UI Cleanup
- Removed clear (X) button from search bar (redundant - field auto-clears on selection)
- Removed box/card styling from hero summary text (now plain text)
- Cleaner, less cluttered interface

#### Mobile Fix
- Fixed double-tap issue on recent locations
- Root cause: dropdown rebuilt on focus, detaching click targets
- Solution: event delegation on parent list element

#### Deployment Note
- GitHub Actions auto-deploy may fail occasionally
- Manual upload via cPanel File Manager works as backup
- Files to upload: `index.html`, `styles.css`, `app.js`
- Upload to: `public_html/weather/`

#### API Endpoints Added
- Photon (Autocomplete): `https://photon.komoot.io/api/?q={query}&limit=10&lang=en&bbox=-179.9,18.0,-66.9,72.0`

### Time Machine Feature (January 25, 2026)

#### Overview
Added "Time Machine" feature allowing users to view historical weather for any past date from 1940 to present.

#### Implementation
- **API**: Open-Meteo Historical Archive (`https://archive-api.open-meteo.com/v1/archive`)
  - Free, no API key required
  - Date range: 1940 to ~3 days ago
  - Hourly resolution, 9km spatial resolution
- **UI Components**:
  - Expandable section below 7-day forecast with date picker
  - Purple banner at top when viewing historical data
  - "Return to Today" button to exit Time Machine mode
- **Data Display**:
  - Hero section shows historical high temp, conditions, precipitation total
  - 24-hour hourly breakdown for selected date
  - Uses WMO weather codes (mapped to icons/descriptions)
- **Behavior**:
  - Radar, alerts, and 7-day forecast hidden in historical mode (not available)
  - Re-fetches historical data when location changes while in Time Machine mode
  - Date picker constrained to valid range (1940 to 3 days ago)

#### WMO Weather Codes
Open-Meteo uses WMO codes (0-99) instead of NWS text codes:
- 0: Clear sky
- 1-3: Mainly clear to overcast
- 45, 48: Fog
- 51-57: Drizzle (light to dense)
- 61-67: Rain (slight to heavy)
- 71-77: Snow
- 80-86: Rain/snow showers
- 95-99: Thunderstorm

### Radar Improvements (January 25, 2026)

#### Cache Busting
- Added timestamp parameter and `cache: 'no-store'` to RainViewer API fetch
- Fixes stale radar data on mobile page refresh

#### Frame Preloading
- All radar frames now preloaded in background on page load
- Layers added to map with `opacity: 0` to trigger tile fetching
- Results in smoother animation playback and scrubbing

### Weather Condition Colors (January 25, 2026)

#### Distinct Condition Bar Colors
Added more distinct colors for hourly forecast condition bars:

| Condition | Color | Hex |
|-----------|-------|-----|
| Drizzle/Light Rain | Cyan/Teal | `#06b6d4` |
| Rain | Deep Blue | `#2563eb` |
| Snow | Soft Indigo | `#a5b4fc` |
| Storm | Purple | `#7c3aed` |
| Cloudy | Gray | `#6b7280` |
| Clear | Gold | `#fbbf24` |
| Fog | Light Gray | `#9ca3af` |

#### Light Rain vs Rain Detection
- Uses precipitation probability to differentiate intensity
- < 70% precip probability → 'drizzle' category (cyan, "Light Rain")
- >= 70% precip probability → 'rain' category (blue, "Rain")
- More reliable than text-matching for "light" in NWS descriptions

### Bug Fixes (January 25, 2026)
- Fixed "This Afternoon" showing as "Thi" in 7-day forecast
  - Now properly displays as "Today" for current day periods
- Fixed missing 'drizzle' case in getConditionText()
- App version bumped to 1.2.0

### Code Organization
- Radar functions in dedicated section
- Settings functions grouped together
- Map functions with radar integration
- Time Machine functions in dedicated section
- Clean event listener setup

# iOS Design Specification

## Design Philosophy

**Core Principle:** Context-sensitive information graphics. Every element adapts to current conditions and provides *actionable information*, not just data.

**Inspiration:** Dark Sky's approach — dense information, zero clutter, "glanceable" weather.

**Brand Position:** "The weather app for people who hate weather apps" — No ads, no tracking, no bloat.

---

## Critical Design Decisions (Do NOT Deviate)

These are hard-won decisions from building the web app. The iOS app MUST follow these:

### 1. Temperature Magnitude Preservation

**NEVER rescale temperature bars per day.** The scale must be consistent across all days so users can visually compare "the shape of the weather" at a glance.

```
CORRECT (same scale):
Mon: 45°────────●────────72°
Tue: 52°──────────●──────68°
Wed: 38°──●──────────────75°  ← Clearly shows Wed is more extreme

WRONG (rescaled per day):
Mon: 45°────────●────────72°  ← Bar looks same length
Tue: 52°────────●────────68°  ← Can't compare days
Wed: 38°────────●────────75°  ← Misleading!
```

### 2. Condition Duration Bars (Left Edge)

Each hourly row has a colored vertical bar on the left edge showing:
- **What** condition (color-coded)
- **How long** it persists (connected bars)

```
┌──────────────────────────────────────┐
│     1PM  ☀️  74°                      │
│ ┌── 2PM  🌧️  71°  ← blue bar starts   │
│ │   3PM  🌧️  69°  ← continues         │
│ └── 4PM  ⛅  70°  ← ends              │
│     5PM  ☀️  73°                      │
└──────────────────────────────────────┘
```

**Colors:**
| Condition | Color | Hex |
|-----------|-------|-----|
| Clear/Sunny | Gold | `#fbbf24` |
| Cloudy | Gray | `#6b7280` |
| Drizzle/Light Rain | Cyan | `#06b6d4` |
| Rain | Blue | `#2563eb` |
| Snow | Soft Indigo | `#a5b4fc` |
| Storm | Purple | `#7c3aed` |
| Fog | Light Gray | `#9ca3af` |

### 3. Hyperlocal Predictions

The killer feature. Show actionable predictions, not just data:

- "Rain starting in 15 min"
- "Clear for the next hour"
- "Light rain stopping in 23 min"
- "Next Hour: No precipitation"

This requires minute-by-minute precipitation probability analysis.

### 4. Start From NOW

The hourly timeline starts from the current hour, not past hours. Users want *future* weather.

### 5. Categorical Precipitation

Show intensity categories, NOT precise measurements:
- "Light rain" / "Rain" / "Heavy rain"
- NOT "0.25 inches"

Detection logic: Use precipitation probability to differentiate:
- < 70% probability → "Light Rain" (cyan)
- >= 70% probability → "Rain" (blue)

### 6. Directional Wind Arrows

Use visual arrows (↗️ ↑ ↘️ etc.) for wind direction, NOT text ("NW", "SSE").

---

## Screen Layout (Top to Bottom)

### 1. Header Bar
```
┌─────────────────────────────────────────────────┐
│  [🔍 Roswell, Georgia              ]      [⚙️]  │
└─────────────────────────────────────────────────┘
```
- Search bar shows current location name
- Settings gear icon on right
- Clean, minimal, no app title

### 2. Hero Section (Current Conditions)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              ☁️  72°                            │
│           Feels like 68°                        │
│                                                 │
│     "Rain starting in 15 minutes"              │
│                                                 │
│     [🔴 Tornado Warning] [🟠 Heat Advisory]     │
└─────────────────────────────────────────────────┘
```
- Large weather icon + temperature side-by-side
- "Feels like" temperature below (smaller)
- Hyperlocal prediction text (the magic)
- Alert badges as colored pills (not full-width banners)

### 3. Radar Map
```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │     [Animated radar overlay]              │  │
│  │         📍 current location               │  │
│  └───────────────────────────────────────────┘  │
│         [▶️]  ═══════●═══════  9:15 AM         │
└─────────────────────────────────────────────────┘
```
- Static map (no pan/zoom) — users want weather, not a map app
- Blue dot for current location
- RainViewer radar overlay (60% opacity)
- Timeline scrubber: 12 past frames + 3 forecast frames
- Play/pause button for animation
- Tap to expand fullscreen

### 4. Hourly Timeline (Next 12 Hours)
```
┌─────────────────────────────────────────────────┐
│ │ NOW   ☀️  Mostly Cloudy ═══════════     72°  │
│ │ 1PM   ⛅                ═══════════════  74°  │
│ █ 2PM   🌧️  Rain         ════════════     71°  │
│ █ 3PM   🌧️               ══════════       69°  │
│ │ 4PM   ⛅                ══════════       70°  │
│ │ 5PM   ☀️               ═══════════════  73°  │
│                                                 │
│    [TEMP °F] [FEELS LIKE] [PRECIP %] [WIND]    │
└─────────────────────────────────────────────────┘
```
- Vertical list, compact rows (36px height)
- All 12 hours visible without scrolling
- Left edge: condition duration bars (see above)
- Condition label only shown when it changes
- Horizontal bars = relative temperature
- Toggle buttons to switch: Temp / Feels Like / Precip % / Wind

### 5. 7-Day Forecast
```
┌─────────────────────────────────────────────────┐
│ Today    ☀️              58°═══════●═══════82°  │
│ Tue      ⛅  💧25%       55°═════●═════════78°  │
│ Wed      🌧️  💧80%       52°════●══════════75°  │
│ Thu      🌧️  💧90%       50°═══●═══════════72°  │
│ Fri      ⛅  💧30%       54°═════●═════════76°  │
│ Sat      ☀️              56°══════●════════80°  │
│ Sun      ☀️              58°═══════●═══════82°  │
└─────────────────────────────────────────────────┘
```
- Tap row to expand hourly breakdown for that day
- Temperature range bar with current position dot
- **Scale consistent across all days** (magnitude preserved!)
- Precip % shown only when > 0%
- Sunrise/sunset info in expanded view

### 6. Time Machine (Historical Weather)
```
┌─────────────────────────────────────────────────┐
│  🕐 Time Machine    View historical weather  ▼  │
├─────────────────────────────────────────────────┤
│  Select a date: [  01/15/2025  ]    [Go]       │
└─────────────────────────────────────────────────┘
```
- Expandable section at bottom
- Date picker: 1940 to yesterday (no future, no today)
- When active: purple banner, "Return to Today" button
- Shows historical high/low, conditions, hourly breakdown
- Radar and alerts hidden (not available for historical)

---

## Color Palette

### Dark Theme (Default)
```
Background:      #1a1a2e (deep navy)
Card/Surface:    #16213e (dark blue)
Card Alt:        #1e293b (slightly lighter)
Text Primary:    #ffffff
Text Secondary:  #8b8b9a
Accent/Primary:  #0f4c75 (blue)
Border:          #334155
```

### Light Theme
```
Background:      #f1f5f9 (light gray)
Card/Surface:    #ffffff
Text Primary:    #1e293b
Text Secondary:  #64748b
Accent/Primary:  #2563eb (blue)
```

### Condition Colors (Both Themes)
```
Clear/Sunny:     #fbbf24 (gold)
Cloudy:          #6b7280 (gray)
Drizzle:         #06b6d4 (cyan)
Rain:            #2563eb (blue)
Snow:            #a5b4fc (soft indigo)
Storm:           #7c3aed (purple)
Fog:             #9ca3af (light gray)
Hot:             #ef4444 (red)
Cold:            #06b6d4 (cyan)
```

### Alert Colors
```
Warning (red):    #dc2626 background, #fef2f2 text area
Watch (orange):   #ea580c background, #fff7ed text area
Advisory (yellow):#ca8a04 background, #fefce8 text area
```

---

## Data Sources

### Primary: NWS (National Weather Service)
- **Free, no API key required**
- Endpoints:
  - Points: `https://api.weather.gov/points/{lat},{lon}`
  - Forecast: `https://api.weather.gov/gridpoints/{office}/{x},{y}/forecast`
  - Hourly: `https://api.weather.gov/gridpoints/{office}/{x},{y}/forecast/hourly`
  - Alerts: `https://api.weather.gov/alerts/active?point={lat},{lon}`
- Include User-Agent header
- US-only coverage

### Radar: RainViewer
- **Free, no API key required**
- Animated precipitation radar
- Endpoint: `https://api.rainviewer.com/public/weather-maps.json`
- Returns past frames + forecast frames
- Overlay as tile layer on map

### Historical: Open-Meteo
- **Free for non-commercial use**
- Endpoint: `https://archive-api.open-meteo.com/v1/archive`
- Date range: 1940 to ~yesterday
- Uses WMO weather codes (different from NWS)

### Geocoding: Photon (Komoot)
- **Free, no API key required**
- Better prefix matching than Nominatim
- Endpoint: `https://photon.komoot.io/api/`

---

## Interaction Patterns

1. **Pull to refresh** — Update all weather data
2. **Tap hourly row** — Expand for wind, humidity, UV details
3. **Tap daily row** — Show hourly breakdown for that day
4. **Tap radar** — Fullscreen map view
5. **Swipe/drag radar slider** — Scrub through time
6. **Long press location** — Save to favorites

---

## iOS-Specific Considerations

### Widgets
- Small: Current temp + icon + "feels like"
- Medium: Current + next 4 hours
- Large: Current + 12-hour timeline

### Apple Watch (Future)
- Current conditions
- Hourly complications
- Rain alerts

### Notifications
- Severe weather alerts (opt-in)
- "Rain starting in 15 min" (opt-in)

### Privacy
- Location used only for weather fetching
- No tracking, no analytics
- No account required

---

## Implementation Checklist

### Phase 1: Core (MVP)
- [ ] Header with location search
- [ ] Hero section (temp, icon, feels like)
- [ ] Hyperlocal prediction text
- [ ] Hourly timeline (12 hours, with duration bars)
- [ ] 7-day forecast (with magnitude-preserved bars)
- [ ] Dark/light theme

### Phase 2: Polish
- [ ] Radar map with animation
- [ ] Alert badges
- [ ] Search autocomplete
- [ ] Recent locations
- [ ] Settings panel

### Phase 3: Advanced
- [ ] Time Machine (historical)
- [ ] Expandable daily rows
- [ ] Widgets
- [ ] Apple Watch app

---

## Reference Implementation

The web app at https://www.crafttiki.com/weather/ is the reference implementation. When in doubt, match its behavior.

Key files in the repo:
- `app.js` — All logic, API calls, rendering
- `styles.css` — All styling, responsive design
- `docs/DarkSky_Design.md` — Original design spec
- `docs/WeatherApp_Notes.md` — Implementation notes

---

*Document created: January 2026*
*For iOS app development reference*

# Dark Sky Clone - Design Flow

## Design Philosophy
Context-sensitive information graphics. Every element adapts to current conditions and provides actionable information, not just data.

---

## Layout Structure

### 1. Header Bar
```
┌─────────────────────────────────────────────────┐
│  [🔍 Search...]                          [⚙️]   │
└─────────────────────────────────────────────────┘
```
- **Search bar**: Left-aligned, takes most of header width
- **Settings icon**: Right-aligned gear/cog
- Clean, minimal, no clutter

---

### 2. Current Conditions Hero
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              ☁️  72°                            │
│           Feels like 68°                        │
│                                                 │
│     "Rain starting in 15 minutes"              │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **Bold weather icon**: Large, centered, represents current conditions
- **Temperature**: Large, prominent display next to icon
- **Feels like**: Smaller, subtle beneath main temp
- **Hyperlocal summary**: One-line prediction (Dark Sky's killer feature)
  - "Rain starting in 15 min"
  - "Clear for the next hour"
  - "Light rain stopping in 23 min"

---

### 3. Radar/Map Widget
```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │     [Animated radar overlay]              │  │
│  │         📍 current location               │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│              ◀️  ▶️  (timeline scrubber)        │
└─────────────────────────────────────────────────┘
```
- Compact map with precipitation overlay
- Color scale: green → yellow → red (light → heavy)
- Directional arrows showing storm movement
- Timeline scrubber for past/future animation
- Tap to expand full-screen

---

### 4. Hourly Timeline (Core Feature)
```
┌─────────────────────────────────────────────────┐
│ NOW    ☀️  72°  ████████████████████░░░░░░░░   │
│ 1PM    ⛅  74°  ██████████████████████░░░░░░   │
│ 2PM    🌧️  71°  ████████████████░░░░░░░░░░░░   │
│ 3PM    🌧️  69°  ██████████████░░░░░░░░░░░░░░   │
│ 4PM    ⛅  70°  ████████████████░░░░░░░░░░░░   │
│ 5PM    ☀️  73°  ██████████████████████░░░░░░   │
└─────────────────────────────────────────────────┘
```

#### Key Design Elements:

**Time Column**
- Starts from "NOW", not past hours
- 12-hour forward view
- Clean, left-aligned

**Condition Icon**
- Simple, glanceable symbols
- Consistent sizing

**Temperature Bar**
- Horizontal bar chart
- Length represents relative temperature
- Maintains magnitude across days (not rescaled per day)
- Allows quick visual comparison

**Condition Duration Bar (Left Edge)**
- Vertical colored bar on left side of each row
- Color indicates condition type:
  - Blue = rain/precipitation
  - Gray = cloudy
  - Yellow/clear = sunny
- Bar height shows how long condition persists
- Connected bars = same condition continuing
- Visual "timeline" of weather phases

```
Example: Rain from 2-4PM
┌──────────────────────────────────────┐
│     1PM  ☀️  74°                      │
│ ┌── 2PM  🌧️  71°  ← blue bar starts   │
│ │   3PM  🌧️  69°  ← blue bar continues│
│ └── 4PM  ⛅  70°  ← blue bar ends     │
│     5PM  ☀️  73°                      │
└──────────────────────────────────────┘
```

---

### 5. Weekly Forecast
```
┌─────────────────────────────────────────────────┐
│ TODAY    ☀️    58°─────●─────82°   10% 💧       │
│ TUE      ⛅    55°───●───────78°   25% 💧       │
│ WED      🌧️    52°──●────────75°   80% 💧       │
│ THU      🌧️    50°─●─────────72°   90% 💧       │
│ FRI      ⛅    54°───●───────76°   30% 💧       │
│ SAT      ☀️    56°────●──────80°   5%  💧       │
│ SUN      ☀️    58°─────●─────82°   5%  💧       │
└─────────────────────────────────────────────────┘
```

#### Key Design Elements:

**Temperature Pills/Range**
- Low temp on left, high on right
- Dot/pill position shows where current temp falls
- **Magnitude preserved**: Scale is consistent across all days
- Allows "shape of the weather" comparison at a glance

**Precipitation Probability**
- Simple percentage
- Rain icon/droplet indicator
- Categorical labels for amounts: "light", "medium", "heavy" (not precise inches)

**Daily Icon**
- Representative of dominant condition
- Consistent with hourly icons

---

### 6. Additional Data (Expandable)
```
┌─────────────────────────────────────────────────┐
│  UV Index    ████░░░░░░  High (7)              │
│  Humidity    ████████░░  78%                   │
│  Wind        ↗️ 12 mph (directional arrow)      │
│  Visibility  10 mi                             │
│  Pressure    30.12 in ↑                        │
│  Dew Point   65°                               │
└─────────────────────────────────────────────────┘
```
- Collapsible section
- Wind uses **directional arrows**, not "NW" text
- UV/Humidity as visual bars, not just numbers

---

## Precipitation Visualization Details

### Intensity Scale (categorical, not precise)
- **None**: No indicator
- **Light**: Pale blue, thin bars
- **Medium**: Medium blue, thicker bars
- **Heavy**: Dark blue/purple, full bars

### Timeline Integration
- Precipitation probability shown as fill level in hourly bars
- Color intensity indicates expected heaviness
- Connected precipitation blocks show storm duration

---

## Color Palette (Dark Theme)
```
Background:     #1a1a2e (deep navy)
Card/Surface:   #16213e (dark blue)
Text Primary:   #ffffff
Text Secondary: #8b8b9a
Accent:         #0f4c75 (blue)

Conditions:
- Clear/Sunny:  #ffd700 (gold)
- Cloudy:       #6b7280 (gray)
- Rain:         #3b82f6 (blue)
- Snow:         #e0f2fe (light blue)
- Storm:        #7c3aed (purple)
- Hot:          #ef4444 (red)
- Cold:         #06b6d4 (cyan)
```

---

## Interaction Patterns

1. **Pull to refresh**: Update current conditions
2. **Tap hourly row**: Expand for more detail
3. **Tap daily row**: Show hourly breakdown for that day
4. **Tap radar**: Full-screen map view
5. **Swipe radar**: Scrub through time
6. **Long press location**: Save to favorites

---

## Key Differentiators to Implement

1. **Hyperlocal predictions**: "Rain in X minutes" messaging
2. **Temperature magnitude preservation**: Don't rescale bars per day
3. **Condition duration bars**: Visual timeline on left edge
4. **Directional wind arrows**: Not text-based directions
5. **Categorical precipitation**: "light/medium/heavy" not "0.25 inches"
6. **Start from NOW**: No past hours in timeline

---

## Implementation Priority

### Phase 1: Core Layout ✅
- [x] Header with search and settings
- [x] Current conditions hero
- [x] Basic hourly list
- [x] Radar map (always-on, auto-loads first frame)

### Phase 2: Hourly Timeline ✅
- [x] Vertical list format (starts from NOW)
- [x] Each row: Time | Icon | Condition text | Temperature
- [x] Condition duration bars (left edge, colored by condition type)
- [x] Connected bars when same condition continues
- [x] Toggle buttons: TEMP | FEELS LIKE | PRECIP %

### Phase 3: Weekly Forecast ✅
- [x] Temperature pills with range visualization
- [x] Temperature magnitude preserved across days
- [x] Precipitation percentage indicator
- [x] Color-coded bars based on temperature range

### Phase 4: Advanced Features
- [x] Radar/map integration (RainViewer animated radar)
- [x] Precipitation timeline in hero summary
- [x] Hyperlocal "rain in X min" predictions

### Phase 5: Polish
- [x] Dark/light theme toggle
- [x] Saved locations / recents
- [ ] Animations and transitions
- [ ] Expand hourly row on tap for more detail

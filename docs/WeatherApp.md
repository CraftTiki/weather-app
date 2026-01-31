# Weather App Plan

## Goal
Create a personal weather web app that fetches NWS data and displays it in a clean, readable format - translating all the coded values (like "L" for Likely, "OV" for Overcast) into plain English.

## Data Source
**NWS API** (api.weather.gov) - Free, no API key required, returns JSON
- `/points/{lat},{lon}` - Get grid coordinates and zone info
- `/gridpoints/{office}/{x},{y}` - **Raw gridpoint data** (detailed hourly values for all parameters)
- `/gridpoints/{office}/{x},{y}/forecast` - 7-day forecast (12-hour periods with text descriptions)
- `/alerts/active?point={lat},{lon}` - Active weather alerts

The raw gridpoint endpoint provides all the detailed data similar to the NWS matrix:
- temperature, dewpoint, relativeHumidity, apparentTemperature
- windSpeed, windDirection, windGust
- skyCover, probabilityOfPrecipitation
- quantitativePrecipitation, snowfallAmount, iceAccumulation
- And more...

## App Structure

```
WeatherApp/
├── index.html      # Main page structure
├── styles.css      # Styling
└── app.js          # API calls and rendering logic
```

## Features

### Core Features
1. **Location Input** - Enter city/zip or use browser geolocation
2. **Current Conditions** - Temperature, conditions, wind, humidity
3. **7-Day Forecast** - Daily high/low, conditions, precipitation chance
4. **Detailed Hourly Data** - Full matrix-style breakdown including:
   - Temperature & "Feels Like" (wind chill/heat index)
   - Dewpoint & Relative Humidity
   - Wind speed, direction, and gusts
   - Cloud cover
   - Precipitation probability and amounts (QPF)
   - Precipitation types (rain, snow, freezing rain, sleet)
5. **Weather Alerts** - Display any active warnings/watches prominently

### Code Translation
The app will translate NWS codes into readable text:

| Code | Meaning |
|------|---------|
| OV | Overcast |
| B1/B2 | Mostly Cloudy |
| SC | Partly Cloudy |
| FW | Mostly Clear |
| CL | Clear |
| S | Slight Chance |
| C | Chance |
| L | Likely |
| D | Definite |
| BZ | Breezy |
| GN | Gentle |
| LT | Light |

### UI Design
- Clean, mobile-friendly layout
- Color-coded alerts (red for warnings, orange for watches)
- Temperature displayed prominently
- Icons for weather conditions
- Precipitation probability shown as percentage bars
- **Detailed Data Table** - Scrollable hourly breakdown showing:
  - Time slots across the top
  - Rows for each parameter (temp, dewpoint, humidity, wind, etc.)
  - Color coding for temperatures (blue for cold, red for hot)
  - Visual indicators for precipitation types

## Implementation Steps

1. **Create HTML structure**
   - Header with location search
   - Current conditions card
   - Hourly forecast carousel/row
   - 7-day forecast cards
   - Alerts section

2. **Add CSS styling**
   - Responsive design
   - Weather-appropriate color scheme
   - Card-based layout

3. **Implement JavaScript**
   - Geocoding (convert location to lat/lon using nominatim or NWS)
   - Fetch forecast data from NWS API
   - Parse and transform JSON data
   - Render to DOM
   - Save preferred location to localStorage

4. **Add alert handling**
   - Fetch active alerts
   - Display prominently if any exist

## Technical Notes

- **CORS**: NWS API supports CORS, so direct browser requests work
- **No backend needed**: Pure client-side app
- **User-Agent**: NWS requires a User-Agent header with contact info
- **Caching**: Browser can cache responses; NWS data updates hourly

## Verification

1. Open `index.html` in a browser
2. Enter "Decatur, GA" or a ZIP code
3. Verify current conditions display correctly
4. Check that 7-day forecast shows readable text (not codes)
5. Verify hourly forecast scrolls/displays properly
6. Test with a location that has active alerts to verify alert display

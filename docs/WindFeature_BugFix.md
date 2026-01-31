# Wind Feature Bug - URGENT FIX NEEDED

## Problem
The wind SVG icon in the hero section is displaying HUGE on mobile (taking up entire screen).

## Root Cause
The `WIND_ICON_SVG` uses `class="weather-icon-svg"` but likely needs explicit width/height or the hero icon container needs size constraints for SVGs.

## Location
- `app.js` line ~35: `WIND_ICON_SVG` constant definition
- `styles.css`: `.hero-icon` and `.weather-icon-svg` styles

## Quick Fix Options
1. Add explicit width/height to the SVG: `width="64" height="64"`
2. Add CSS to constrain `.hero-icon svg` size
3. Check how `FOG_ICON_SVG` is sized (it works correctly)

## What Was Added (for context)
- Wind threshold: 15 mph
- Wind icon: SVG with curved flowing lines
- Hero shows wind icon + "Feels X° · Y mph DIR" when windy
- WIND (MPH) toggle in hourly breakdown
- Daily forecast shows wind icon when majority windy

## Files Changed
- app.js (wind logic, SVG icons, parsing)
- index.html (WIND toggle button, hero-wind-info span)
- styles.css (wind pill colors, wind arrow styles)

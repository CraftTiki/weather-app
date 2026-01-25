/**
 * WeatherBuster - Main Application JavaScript
 * Handles geocoding, location services, and UI interactions
 */

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const APP_VERSION = '1.2.0';

const NWS_API_BASE = 'https://api.weather.gov';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'WeatherBuster/1.0 (personal use)';

const STORAGE_KEYS = {
    LOCATION: 'weatherapp_location',
    THEME: 'weatherapp_theme',
    RADAR: 'weatherapp_radar',
    RECENTS: 'weatherapp_recents'
};

const MAX_RECENT_LOCATIONS = 5;

// RainViewer API for animated radar
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
const RAINVIEWER_TILE_URL = 'https://tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png';

// Open-Meteo Historical Weather API
const OPEN_METEO_HISTORICAL_API = 'https://archive-api.open-meteo.com/v1/archive';

// WMO Weather Codes mapping (used by Open-Meteo)
const WMO_WEATHER_CODES = {
    0: { description: 'Clear sky', icon: { day: '☀️', night: '🌙' }, category: 'clear' },
    1: { description: 'Mainly clear', icon: { day: '🌤️', night: '🌙' }, category: 'clear' },
    2: { description: 'Partly cloudy', icon: { day: '⛅', night: '☁️' }, category: 'cloudy' },
    3: { description: 'Overcast', icon: { day: '☁️', night: '☁️' }, category: 'cloudy' },
    45: { description: 'Fog', icon: { day: '🌫️', night: '🌫️' }, category: 'fog' },
    48: { description: 'Depositing rime fog', icon: { day: '🌫️', night: '🌫️' }, category: 'fog' },
    51: { description: 'Light drizzle', icon: { day: '🌧️', night: '🌧️' }, category: 'drizzle' },
    53: { description: 'Moderate drizzle', icon: { day: '🌧️', night: '🌧️' }, category: 'drizzle' },
    55: { description: 'Dense drizzle', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    56: { description: 'Light freezing drizzle', icon: { day: '🌧️', night: '🌧️' }, category: 'drizzle' },
    57: { description: 'Dense freezing drizzle', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    61: { description: 'Slight rain', icon: { day: '🌧️', night: '🌧️' }, category: 'drizzle' },
    63: { description: 'Moderate rain', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    65: { description: 'Heavy rain', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    66: { description: 'Light freezing rain', icon: { day: '🌧️', night: '🌧️' }, category: 'drizzle' },
    67: { description: 'Heavy freezing rain', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    71: { description: 'Slight snow', icon: { day: '🌨️', night: '🌨️' }, category: 'snow' },
    73: { description: 'Moderate snow', icon: { day: '🌨️', night: '🌨️' }, category: 'snow' },
    75: { description: 'Heavy snow', icon: { day: '🌨️', night: '🌨️' }, category: 'snow' },
    77: { description: 'Snow grains', icon: { day: '🌨️', night: '🌨️' }, category: 'snow' },
    80: { description: 'Slight rain showers', icon: { day: '🌧️', night: '🌧️' }, category: 'drizzle' },
    81: { description: 'Moderate rain showers', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    82: { description: 'Violent rain showers', icon: { day: '🌧️', night: '🌧️' }, category: 'rain' },
    85: { description: 'Slight snow showers', icon: { day: '🌨️', night: '🌨️' }, category: 'snow' },
    86: { description: 'Heavy snow showers', icon: { day: '🌨️', night: '🌨️' }, category: 'snow' },
    95: { description: 'Thunderstorm', icon: { day: '⛈️', night: '⛈️' }, category: 'storm' },
    96: { description: 'Thunderstorm with slight hail', icon: { day: '⛈️', night: '⛈️' }, category: 'storm' },
    99: { description: 'Thunderstorm with heavy hail', icon: { day: '⛈️', night: '⛈️' }, category: 'storm' }
};

// Weather code translation maps
const WEATHER_CODES = {
    'OV': 'Overcast',
    'BKN': 'Mostly Cloudy',
    'B1': 'Mostly Cloudy',
    'B2': 'Mostly Cloudy',
    'SCT': 'Partly Cloudy',
    'SC': 'Partly Cloudy',
    'FEW': 'Mostly Clear',
    'FW': 'Mostly Clear',
    'SKC': 'Clear',
    'CLR': 'Clear',
    'CL': 'Clear'
};

const PROBABILITY_CODES = {
    'S': 'Slight Chance',
    'C': 'Chance',
    'L': 'Likely',
    'D': 'Definite',
    'O': 'Occasional',
    'IS': 'Isolated'
};

const INTENSITY_CODES = {
    'BZ': 'Breezy',
    'GN': 'Gentle',
    'LT': 'Light',
    'HV': 'Heavy',
    'MD': 'Moderate'
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

let currentLocation = null;
let autocompleteDebounceTimer = null;
let weatherMap = null;
let mapMarker = null;
let radarLayer = null;
let radarEnabled = false;

// AbortController for cancelling in-flight weather requests
let weatherAbortController = null;

// Radar animation state
let radarFrames = [];
let radarLayers = [];
let currentFrameIndex = 0;
let radarAnimationInterval = null;
let isRadarPlaying = false;

// Fullscreen radar state
let fullscreenRadarMap = null;
let fullscreenRadarLayers = [];
let isFullscreenRadarOpen = false;

// Time Machine state
let isTimeMachineMode = false;
let timeMachineDate = null;
let historicalData = null;

// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
    locationSearch: null,
    searchBtn: null,
    geolocationBtn: null,
    locationName: null,
    loading: null,
    error: null,
    errorMessage: null,
    retryBtn: null
};

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements.locationSearch = document.getElementById('location-search');
    elements.searchBtn = document.getElementById('search-btn');
    elements.geolocationBtn = document.getElementById('geolocation-btn');
    elements.locationName = document.getElementById('location-name');
    elements.loading = document.getElementById('loading');
    elements.error = document.getElementById('error');
    elements.errorMessage = document.getElementById('error-message');
    elements.retryBtn = document.querySelector('#error button');
}

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

/**
 * Show the loading overlay
 */
function showLoading() {
    if (elements.loading) {
        elements.loading.removeAttribute('hidden');
    }
}

/**
 * Hide the loading overlay
 */
function hideLoading() {
    if (elements.loading) {
        elements.loading.setAttribute('hidden', '');
    }
}

/**
 * Show non-blocking loading state (dims content area)
 */
function showContentLoading() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('loading');
    }
}

/**
 * Hide non-blocking loading state
 */
function hideContentLoading() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.remove('loading');
    }
}

/**
 * Display an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
    if (elements.error && elements.errorMessage) {
        elements.errorMessage.textContent = message;
        elements.error.removeAttribute('hidden');
    }
    hideLoading();
}

/**
 * Hide the error display
 */
function hideError() {
    if (elements.error) {
        elements.error.setAttribute('hidden', '');
    }
}

/**
 * Update the displayed location name (now shown in search bar)
 * @param {string} name - The location name to display
 */
function updateLocationDisplay(name) {
    // Show location name in search input as placeholder
    if (elements.locationSearch) {
        elements.locationSearch.placeholder = name;
        elements.locationSearch.value = '';
    }
}

// =============================================================================
// LOCATION FUNCTIONS
// =============================================================================

/**
 * Get the current position using browser geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>} Coordinates object
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                let message;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                    default:
                        message = 'An unknown error occurred while getting your location.';
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

/**
 * Get approximate location from IP address (no permission required)
 * Uses ipapi.co which supports HTTPS on free tier
 * @returns {Promise<{latitude: number, longitude: number, city: string, region: string}>}
 */
async function getLocationFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
            throw new Error('IP geolocation service unavailable');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.reason || 'IP geolocation failed');
        }

        return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city,
            region: data.region
        };
    } catch (error) {
        console.error('[WeatherBuster] IP geolocation failed:', error);
        throw error;
    }
}

/**
 * Convert a city name or ZIP code to latitude/longitude coordinates
 * @param {string} query - City name, ZIP code, or address to geocode
 * @returns {Promise<{latitude: number, longitude: number, displayName: string}>}
 */
async function geocodeLocation(query) {
    if (!query || query.trim() === '') {
        throw new Error('Please enter a city name or ZIP code');
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${NOMINATIM_API}/search?q=${encodedQuery}&format=json&limit=1&countrycodes=us`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error('Geocoding service unavailable. Please try again later.');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error(`Location "${query}" not found. Please try a different search term.`);
        }

        const result = data[0];
        return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            displayName: result.display_name
        };
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

/**
 * Search for location suggestions (autocomplete)
 * Uses Photon API which is designed for autocomplete/prefix matching
 * @param {string} query - Partial city name or ZIP code
 * @returns {Promise<Array>} Array of location suggestions
 */
async function searchLocationSuggestions(query) {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const encodedQuery = encodeURIComponent(query.trim());
    // Photon API - designed for autocomplete, handles partial matches well
    // Filter to US results by using bbox (bounding box for continental US + Alaska + Hawaii)
    const url = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=10&lang=en&bbox=-179.9,18.0,-66.9,72.0`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        if (!data || !data.features || data.features.length === 0) {
            return [];
        }

        // Filter and format results
        const seen = new Set(); // Track seen locations to avoid duplicates
        return data.features
            .filter(feature => {
                const props = feature.properties || {};
                const country = props.country;
                const type = props.type;
                // Only include US results and cities/towns/villages
                return country === 'United States' &&
                       (type === 'city' || type === 'town' || type === 'village' ||
                        type === 'locality' || type === 'district' || type === 'county');
            })
            .map(feature => {
                const props = feature.properties || {};
                const coords = feature.geometry?.coordinates || [];

                // Format display name (City, State)
                const city = props.name || props.city || props.town || props.village;
                const state = props.state;
                const displayName = state ? `${city}, ${state}` : city;

                return {
                    displayName,
                    fullName: props.name,
                    latitude: coords[1], // GeoJSON is [lon, lat]
                    longitude: coords[0],
                    state: state || ''
                };
            })
            .filter(loc => {
                // Remove duplicates (same city, state)
                const key = loc.displayName.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
        console.warn('Autocomplete error:', error);
        return [];
    }
}

/**
 * Get a location name from coordinates using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} Location display name
 */
async function reverseGeocode(lat, lon) {
    const url = `${NOMINATIM_API}/reverse?lat=${lat}&lon=${lon}&format=json`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error('Reverse geocoding service unavailable.');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error('Could not determine location name.');
        }

        // Build a friendly display name from address components
        const address = data.address || {};
        const parts = [];

        // Try to get most specific place name available
        // Priority: city/town/village/hamlet > suburb/neighbourhood > county
        const placeName = address.city || address.town || address.village || address.hamlet
            || address.suburb || address.neighbourhood || address.municipality;

        if (placeName) {
            parts.push(placeName);
        } else if (address.county) {
            // If no city-level name, use county (common for rural/unincorporated areas)
            parts.push(address.county);
        }

        if (address.state) {
            parts.push(address.state);
        }

        // If we still have no useful parts, fall back to the full display name
        // but try to shorten it if too long
        if (parts.length === 0) {
            const displayParts = data.display_name.split(', ');
            // Take first 2-3 meaningful parts
            return displayParts.slice(0, Math.min(3, displayParts.length)).join(', ');
        }

        return parts.join(', ');
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

/**
 * Save location to localStorage
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} name - Display name for the location
 */
function saveLocation(lat, lon, name) {
    try {
        const locationData = {
            latitude: lat,
            longitude: lon,
            name: name,
            savedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(locationData));
    } catch (error) {
        console.warn('Could not save location to localStorage:', error);
    }
}

/**
 * Load saved location from localStorage
 * @returns {{latitude: number, longitude: number, name: string}|null}
 */
function loadSavedLocation() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.LOCATION);
        console.log('[WeatherBuster] Raw localStorage value:', saved);
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log('[WeatherBuster] Parsed saved location:', parsed);
            return parsed;
        }
    } catch (error) {
        console.warn('[WeatherBuster] Could not load saved location:', error);
    }
    return null;
}

// =============================================================================
// WEATHER CODE TRANSLATION
// =============================================================================

/**
 * Translate NWS weather codes to readable text
 * @param {string} code - Weather code from NWS API
 * @returns {string} Human-readable translation
 */
function translateWeatherCode(code) {
    return WEATHER_CODES[code] || PROBABILITY_CODES[code] || INTENSITY_CODES[code] || code;
}

// =============================================================================
// NWS API FUNCTIONS
// =============================================================================

/**
 * Get grid coordinates from lat/lon
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Grid point data from NWS API
 */
async function getGridPoint(lat, lon, signal = null) {
    const url = `${NWS_API_BASE}/points/${lat},${lon}`;
    console.log('[WeatherBuster] getGridPoint URL:', url);
    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal
    });
    console.log('[WeatherBuster] getGridPoint response status:', response.status);
    if (!response.ok) throw new Error('Failed to get grid point');
    return response.json();
}

/**
 * Get raw gridpoint data (detailed hourly values)
 * @param {string} office - NWS office ID
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Gridpoint data from NWS API
 */
async function getGridpointData(office, gridX, gridY, signal = null) {
    const response = await fetch(
        `${NWS_API_BASE}/gridpoints/${office}/${gridX},${gridY}`,
        { headers: { 'User-Agent': USER_AGENT }, signal }
    );
    if (!response.ok) throw new Error('Failed to get gridpoint data');
    return response.json();
}

/**
 * Get 7-day forecast
 * @param {string} office - NWS office ID
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Forecast data from NWS API
 */
async function getForecast(office, gridX, gridY, signal = null) {
    const response = await fetch(
        `${NWS_API_BASE}/gridpoints/${office}/${gridX},${gridY}/forecast`,
        { headers: { 'User-Agent': USER_AGENT }, signal }
    );
    if (!response.ok) throw new Error('Failed to get forecast');
    return response.json();
}

/**
 * Get active alerts for location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Alerts data from NWS API
 */
async function getAlerts(lat, lon, signal = null) {
    const response = await fetch(
        `${NWS_API_BASE}/alerts/active?point=${lat},${lon}`,
        { headers: { 'User-Agent': USER_AGENT }, signal }
    );
    if (!response.ok) throw new Error('Failed to get alerts');
    return response.json();
}

// =============================================================================
// WEATHER DATA FUNCTIONS
// =============================================================================

/**
 * Fetch all weather data for the given coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<void>}
 */
async function fetchWeatherData(lat, lon, signal = null) {
    console.log('[WeatherBuster] fetchWeatherData called with:', { lat, lon });
    try {
        // Get grid point first
        console.log('[WeatherBuster] Fetching grid point...');
        const pointData = await getGridPoint(lat, lon, signal);

        // Check if aborted
        if (signal?.aborted) return;

        console.log('[WeatherBuster] Grid point data:', pointData);
        const { gridId, gridX, gridY } = pointData.properties;
        console.log('[WeatherBuster] Grid info:', { gridId, gridX, gridY });

        // Fetch all data in parallel
        const [gridpointData, forecastData, alertsData] = await Promise.all([
            getGridpointData(gridId, gridX, gridY, signal),
            getForecast(gridId, gridX, gridY, signal),
            getAlerts(lat, lon, signal)
        ]);

        // Check if aborted
        if (signal?.aborted) return;

        // Store the data globally for rendering
        window.weatherData = {
            gridpoint: gridpointData,
            forecast: forecastData,
            alerts: alertsData,
            lat,
            lon
        };

        hideError();

        // These render functions will be added later
        if (typeof renderCurrentConditions === 'function') renderCurrentConditions();
        if (typeof renderHourlyForecast === 'function') renderHourlyForecast();
        if (typeof render7DayForecast === 'function') render7DayForecast();
        if (typeof renderAlerts === 'function') renderAlerts();

    } catch (error) {
        if (error.name === 'AbortError' || signal?.aborted) {
            console.log('[WeatherBuster] Fetch aborted');
            return;
        }
        console.error('[WeatherBuster] Error fetching weather:', error);
        console.error('[WeatherBuster] Error stack:', error.stack);
        throw error; // Re-throw to let caller handle
    }
}

/**
 * Main function to handle location selection and weather fetching
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} name - Location display name
 * @param {Object} options - Optional settings { fromMap: boolean, signal: AbortSignal }
 */
async function handleLocationSelected(lat, lon, name, options = {}) {
    const { fromMap = false, signal = null } = options;
    console.log('[WeatherBuster] handleLocationSelected called:', { lat, lon, name, fromMap });

    try {
        hideError();

        // Use non-blocking loading for map clicks, full overlay for search
        if (fromMap) {
            showContentLoading();
        } else {
            showLoading();
        }

        // Update current location state
        currentLocation = { latitude: lat, longitude: lon, name: name };

        // Update UI with location name
        updateLocationDisplay(name);

        // Save location for future visits
        saveLocation(lat, lon, name);

        // Add to recent locations
        addRecentLocation(lat, lon, name);

        // Update map marker and center map on location (skip if from map - already done)
        if (!fromMap) {
            updateMapMarker(lat, lon, name);
            centerMapOn(lat, lon);
        }

        // Fetch weather data
        console.log('[WeatherBuster] About to fetch weather data...');
        await fetchWeatherData(lat, lon, signal);

        // Check if aborted
        if (signal?.aborted) return;

        console.log('[WeatherBuster] Weather data fetched successfully');

        // If in Time Machine mode, re-fetch historical data for new location
        if (isTimeMachineMode && timeMachineDate) {
            console.log('[WeatherBuster] Re-fetching historical data for new location');
            await enterTimeMachineMode(timeMachineDate);
        }

        if (fromMap) {
            hideContentLoading();
        } else {
            hideLoading();
        }
    } catch (error) {
        if (error.name === 'AbortError' || signal?.aborted) {
            console.log('[WeatherBuster] Request cancelled');
            return;
        }
        console.error('[WeatherBuster] Error handling location:', error);
        hideContentLoading();
        hideLoading();
        showError(error.message || 'Failed to fetch weather data. Please try again.');
    }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle geolocation button click
 */
async function handleGeolocation() {
    try {
        hideError();
        showLoading();

        const coords = await getCurrentPosition();
        const locationName = await reverseGeocode(coords.latitude, coords.longitude);

        await handleLocationSelected(coords.latitude, coords.longitude, locationName);
    } catch (error) {
        console.error('Geolocation error:', error);
        showError(error.message);
    }
}

/**
 * Handle retry button click
 */
function handleRetry() {
    hideError();

    // Retry fetching weather for current location (for network errors)
    if (currentLocation) {
        handleLocationSelected(
            currentLocation.latitude,
            currentLocation.longitude,
            currentLocation.name
        );
    } else {
        // No location yet - focus search so user can select one
        if (elements.locationSearch) {
            elements.locationSearch.focus();
            showSearchDropdown();
        }
    }
}

/**
 * Handle Enter key press in search input
 * @param {KeyboardEvent} event
 */
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        // Select first autocomplete suggestion if available
        const suggestionsList = document.getElementById('autocomplete-suggestions');
        const firstItem = suggestionsList?.querySelector('.autocomplete-item');
        if (firstItem && suggestionsList._suggestions?.length > 0) {
            const loc = suggestionsList._suggestions[0];
            hideSearchDropdown();
            if (elements.locationSearch) {
                elements.locationSearch.value = '';
            }
            handleLocationSelected(loc.latitude, loc.longitude, loc.displayName);
        }
        // If no suggestions, do nothing - user must select a valid location
    }
}

// =============================================================================
// SETTINGS AND THEME FUNCTIONS
// =============================================================================

/**
 * Initialize theme from localStorage or default to dark mode
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (darkModeToggle) {
            darkModeToggle.checked = savedTheme === 'dark';
        }
    } else {
        // Default to dark mode
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
}

/**
 * Toggle dark mode
 * @param {boolean} isDark - Whether dark mode should be enabled
 */
function setDarkMode(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#1565c0' : '#1e88e5');
    }
}

/**
 * Open settings panel
 */
function openSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');

    if (panel && overlay) {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close settings panel
 */
function closeSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');

    if (panel && overlay) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

/**
 * Set up settings event listeners
 */
function setupSettingsEventListeners() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsClose = document.getElementById('settings-close');
    const settingsOverlay = document.getElementById('settings-overlay');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }

    if (settingsClose) {
        settingsClose.addEventListener('click', closeSettings);
    }

    if (settingsOverlay) {
        settingsOverlay.addEventListener('click', closeSettings);
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            setDarkMode(e.target.checked);
        });
    }


    // Close settings with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettings();
        }
    });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Enter key in search input
    if (elements.locationSearch) {
        elements.locationSearch.addEventListener('keypress', handleSearchKeypress);
        elements.locationSearch.addEventListener('focus', showSearchDropdown);
        elements.locationSearch.addEventListener('input', handleSearchInput);
    }

    // Retry button click
    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', handleRetry);
    }

    // Clear recents button
    const clearRecentsBtn = document.getElementById('clear-recents-btn');
    if (clearRecentsBtn) {
        clearRecentsBtn.addEventListener('click', clearRecentLocations);
    }

    // Recent locations list - use event delegation for mobile compatibility
    const recentsList = document.getElementById('recent-locations');
    if (recentsList) {
        recentsList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.recent-location-remove');
            const item = e.target.closest('.recent-location-item');

            if (removeBtn) {
                e.stopPropagation();
                const index = parseInt(removeBtn.dataset.index);
                removeRecentLocation(index);
                showSearchDropdown(); // Refresh dropdown
            } else if (item) {
                const index = parseInt(item.dataset.index);
                const recents = recentsList._recents || [];
                const loc = recents[index];
                if (loc) {
                    hideSearchDropdown();
                    handleLocationSelected(loc.latitude, loc.longitude, loc.name);
                }
            }
        });
    }

    // Use current location button in dropdown (non-blocking)
    const useCurrentLocationBtn = document.getElementById('use-current-location');
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', async () => {
            hideSearchDropdown();

            // Cancel any in-flight request
            if (weatherAbortController) {
                weatherAbortController.abort();
            }
            weatherAbortController = new AbortController();
            const signal = weatherAbortController.signal;

            // Show non-blocking loading
            hideError();
            showContentLoading();

            try {
                const coords = await getCurrentPosition();
                if (signal.aborted) return;

                const locationName = await reverseGeocode(coords.latitude, coords.longitude);
                if (signal.aborted) return;

                updateMapMarker(coords.latitude, coords.longitude, locationName);
                centerMapOn(coords.latitude, coords.longitude);
                await handleLocationSelected(coords.latitude, coords.longitude, locationName, { fromMap: true, signal });
            } catch (error) {
                if (error.name === 'AbortError' || signal.aborted) return;
                hideContentLoading();
                showError(error.message || 'Failed to get current location');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const searchWrapper = document.querySelector('.search-wrapper');
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            hideSearchDropdown();
        }
    });
}

/**
 * Handle search input changes
 */
function handleSearchInput(e) {
    const query = e.target.value.trim();

    // Debounced autocomplete search
    if (autocompleteDebounceTimer) {
        clearTimeout(autocompleteDebounceTimer);
    }

    if (query.length >= 2) {
        autocompleteDebounceTimer = setTimeout(async () => {
            const suggestions = await searchLocationSuggestions(query);
            showAutocompleteSuggestions(suggestions, query);
        }, 300); // 300ms debounce
    } else {
        // Show regular dropdown with recents if query is too short
        hideAutocompleteSuggestions();
    }
}

/**
 * Show autocomplete suggestions in dropdown
 * @param {Array} suggestions - Array of location suggestions
 * @param {string} query - The search query (for "no results" message)
 */
function showAutocompleteSuggestions(suggestions, query = '') {
    const dropdown = document.getElementById('search-dropdown');
    const suggestionsList = document.getElementById('autocomplete-suggestions');
    const suggestionsHeader = document.getElementById('autocomplete-header');
    const recentsSection = document.querySelector('.dropdown-header');
    const recentsList = document.getElementById('recent-locations');
    const currentLocationItem = document.getElementById('use-current-location');

    if (!dropdown || !suggestionsList) return;

    // Hide recents and current location when user is actively searching
    if (recentsSection) recentsSection.style.display = 'none';
    if (recentsList) recentsList.style.display = 'none';
    if (currentLocationItem) currentLocationItem.style.display = 'none';

    if (suggestions.length === 0) {
        // Show "No results" message
        if (suggestionsHeader) suggestionsHeader.style.display = 'none';
        suggestionsList.innerHTML = `
            <li class="autocomplete-no-results">
                <span>No results for "${query}"</span>
            </li>
        `;
        dropdown.removeAttribute('hidden');
        return;
    }

    if (suggestionsHeader) suggestionsHeader.style.display = '';

    suggestionsList.innerHTML = suggestions.map((loc, index) => `
        <li class="autocomplete-item" role="option" data-index="${index}">
            <svg class="autocomplete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="autocomplete-text">${loc.displayName}</span>
        </li>
    `).join('');

    // Store suggestions for click handlers
    suggestionsList._suggestions = suggestions;

    // Add click handlers
    suggestionsList.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const loc = suggestionsList._suggestions[index];
            if (loc) {
                hideSearchDropdown();
                if (elements.locationSearch) {
                    elements.locationSearch.value = '';
                }
                handleLocationSelected(loc.latitude, loc.longitude, loc.displayName);
            }
        });
    });

    dropdown.removeAttribute('hidden');
}

/**
 * Hide autocomplete suggestions and restore normal dropdown
 */
function hideAutocompleteSuggestions() {
    const suggestionsList = document.getElementById('autocomplete-suggestions');
    const suggestionsHeader = document.getElementById('autocomplete-header');
    const recentsSection = document.querySelector('.dropdown-header');
    const recentsList = document.getElementById('recent-locations');
    const currentLocationItem = document.getElementById('use-current-location');

    if (suggestionsList) {
        suggestionsList.innerHTML = '';
        suggestionsList._suggestions = [];
    }
    if (suggestionsHeader) suggestionsHeader.style.display = 'none';
    // Restore recents and current location
    if (recentsSection) recentsSection.style.display = '';
    if (recentsList) recentsList.style.display = '';
    if (currentLocationItem) currentLocationItem.style.display = '';
}

/**
 * Show search dropdown with recent locations
 */
function showSearchDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    const recentsList = document.getElementById('recent-locations');
    const dropdownHeader = document.querySelector('.dropdown-header');
    if (!dropdown || !recentsList) return;

    // Reset autocomplete suggestions when showing dropdown
    hideAutocompleteSuggestions();

    const recents = getRecentLocations();

    if (recents.length === 0) {
        // Hide the recents header when there are no recents
        if (dropdownHeader) dropdownHeader.style.display = 'none';
        recentsList.innerHTML = '';
        recentsList._recents = [];
    } else {
        // Show the recents header when there are recents
        if (dropdownHeader) dropdownHeader.style.display = '';
        recentsList.innerHTML = recents.map((loc, index) => `
            <li class="recent-location-item" role="option" data-index="${index}">
                <svg class="recent-location-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span class="recent-location-text">${loc.name}</span>
                <button type="button" class="recent-location-remove" data-index="${index}" aria-label="Remove from recents">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </li>
        `).join('');
        // Store recents data for event delegation handler
        recentsList._recents = recents;
    }

    dropdown.removeAttribute('hidden');
}

/**
 * Hide search dropdown
 */
function hideSearchDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) {
        dropdown.setAttribute('hidden', '');
    }
    // Clear any pending autocomplete requests
    if (autocompleteDebounceTimer) {
        clearTimeout(autocompleteDebounceTimer);
        autocompleteDebounceTimer = null;
    }
}

/**
 * Get recent locations from localStorage
 */
function getRecentLocations() {
    try {
        const recents = localStorage.getItem(STORAGE_KEYS.RECENTS);
        return recents ? JSON.parse(recents) : [];
    } catch (error) {
        console.warn('Could not load recent locations:', error);
        return [];
    }
}

/**
 * Add a location to recents
 */
function addRecentLocation(lat, lon, name) {
    try {
        let recents = getRecentLocations();

        // Remove if already exists
        recents = recents.filter(loc =>
            !(Math.abs(loc.latitude - lat) < 0.01 && Math.abs(loc.longitude - lon) < 0.01)
        );

        // Add to beginning
        recents.unshift({ latitude: lat, longitude: lon, name: name });

        // Keep only max items
        recents = recents.slice(0, MAX_RECENT_LOCATIONS);

        localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(recents));
    } catch (error) {
        console.warn('Could not save recent location:', error);
    }
}

/**
 * Remove a location from recents by index
 */
function removeRecentLocation(index) {
    try {
        let recents = getRecentLocations();
        recents.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(recents));
    } catch (error) {
        console.warn('Could not remove recent location:', error);
    }
}

/**
 * Clear all recent locations
 */
function clearRecentLocations() {
    try {
        localStorage.removeItem(STORAGE_KEYS.RECENTS);
        showSearchDropdown(); // Refresh dropdown
    } catch (error) {
        console.warn('Could not clear recent locations:', error);
    }
}

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('[WeatherBuster] Initializing...');

    // Initialize theme first (prevents flash of wrong theme)
    initializeTheme();
    console.log('[WeatherBuster] Theme initialized');

    // Initialize DOM references
    initializeElements();
    console.log('[WeatherBuster] DOM elements initialized');

    // Display version in settings
    const versionEl = document.getElementById('app-version');
    if (versionEl) versionEl.textContent = `Version ${APP_VERSION}`;

    // Set up event listeners
    setupEventListeners();
    setupSettingsEventListeners();
    console.log('[WeatherBuster] Event listeners set up');

    // Initialize the interactive map
    initializeMap();
    setupMapEventListeners();
    setupRadarControls();
    await initializeRadarLayer();
    console.log('[WeatherBuster] Map initialized');

    // Set up Time Machine
    setupTimeMachineEventListeners();
    console.log('[WeatherBuster] Time Machine initialized');

    // Check for saved location or use geolocation
    const savedLocation = loadSavedLocation();
    console.log('[WeatherBuster] Saved location:', savedLocation);

    if (savedLocation) {
        console.log('[WeatherBuster] Loading saved location...');
        // Load weather for saved location
        await handleLocationSelected(
            savedLocation.latitude,
            savedLocation.longitude,
            savedLocation.name
        );
    } else {
        // Default to approximate location from IP (no permission required)
        console.log('[WeatherBuster] No saved location, using IP geolocation...');
        try {
            const ipLocation = await getLocationFromIP();
            const locationName = `${ipLocation.city}, ${ipLocation.region}`;
            console.log('[WeatherBuster] IP location:', locationName);
            await handleLocationSelected(ipLocation.latitude, ipLocation.longitude, locationName);
        } catch (error) {
            console.log('[WeatherBuster] IP geolocation failed, waiting for user input');
        }
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// =============================================================================
// RENDERING HELPER FUNCTIONS
// =============================================================================

/**
 * Get weather icon based on conditions
 * @param {string} conditions - Weather conditions text
 * @param {boolean} isDaytime - Whether it's daytime
 * @returns {string} Weather emoji icon
 */
function getWeatherIcon(conditions, isDaytime) {
    const condLower = conditions.toLowerCase();
    if (condLower.includes('thunder') || condLower.includes('storm')) return '⛈️';
    if (condLower.includes('rain') || condLower.includes('shower')) return '🌧️';
    if (condLower.includes('snow')) return '🌨️';
    if (condLower.includes('fog') || condLower.includes('mist')) return '🌫️';
    if (condLower.includes('cloud') || condLower.includes('overcast')) return isDaytime ? '⛅' : '☁️';
    if (condLower.includes('partly')) return isDaytime ? '🌤️' : '☁️';
    if (condLower.includes('clear') || condLower.includes('sunny')) return isDaytime ? '☀️' : '🌙';
    return isDaytime ? '🌤️' : '🌙';
}

/**
 * Get temperature color class
 * @param {number} temp - Temperature in Fahrenheit
 * @returns {string} CSS class name
 */
function getTempClass(temp) {
    if (temp < 32) return 'temp-cold';
    if (temp < 50) return 'temp-cool';
    if (temp < 70) return 'temp-mild';
    if (temp < 85) return 'temp-warm';
    return 'temp-hot';
}

/**
 * Get CSS class for temperature range bar gradient
 * @param {number} temp - Temperature in Fahrenheit
 * @returns {string} CSS class for bar gradient
 */
function getTempBarClass(temp) {
    if (temp < 32) return 'temp-bar-cold';
    if (temp < 50) return 'temp-bar-cool';
    if (temp < 70) return 'temp-bar-mild';
    if (temp < 85) return 'temp-bar-warm';
    return 'temp-bar-hot';
}

/**
 * Format time from ISO string
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted time string
 */
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

/**
 * Format date from ISO string
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Get current value from NWS gridpoint time series
 * @param {Object} property - NWS gridpoint property with values array
 * @returns {number|null} Current value or null if not found
 */
function getCurrentValue(property) {
    if (!property || !property.values || property.values.length === 0) return null;
    const now = new Date();
    for (const item of property.values) {
        const [startStr, duration] = item.validTime.split('/');
        const start = new Date(startStr);
        // Parse ISO 8601 duration (simplified - assumes hours)
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
        if (now >= start && now < end) {
            return item.value;
        }
    }
    // Return first value if current not found
    return property.values[0]?.value ?? null;
}

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

/**
 * Render current weather conditions (Dark Sky hero style)
 */
function renderCurrentConditions() {
    const data = window.weatherData;
    if (!data) return;

    const forecast = data.forecast?.properties?.periods?.[0];
    const gridpoint = data.gridpoint?.properties;

    if (!forecast) return;

    // Get current temperature from gridpoint or forecast
    let temp = getCurrentValue(gridpoint?.temperature);
    if (temp !== null && gridpoint?.temperature?.uom?.includes('C')) {
        temp = Math.round(temp * 9/5 + 32); // Convert C to F
    }
    if (temp === null) temp = forecast.temperature;

    // Update hero temperature
    document.getElementById('current-temp').textContent = Math.round(temp);

    // Update hero icon
    const heroIcon = document.getElementById('hero-icon');
    if (heroIcon) {
        const hour = new Date().getHours();
        const isDaytime = hour >= 6 && hour < 20;
        heroIcon.textContent = getWeatherIcon(forecast.shortForecast, isDaytime);
    }

    // Feels like (apparent temperature)
    let feelsLike = getCurrentValue(gridpoint?.apparentTemperature);
    if (feelsLike !== null && gridpoint?.apparentTemperature?.uom?.includes('C')) {
        feelsLike = Math.round(feelsLike * 9/5 + 32);
    }
    document.getElementById('feels-like').textContent = feelsLike !== null ? Math.round(feelsLike) : '--';

    // Generate hyperlocal precipitation summary
    renderPrecipitationSummary(gridpoint);
}

/**
 * Generate hyperlocal precipitation summary ("Rain starting in X min")
 * @param {Object} props - Gridpoint properties
 */
function renderPrecipitationSummary(props) {
    const summaryEl = document.getElementById('hero-summary');
    if (!summaryEl || !props) {
        if (summaryEl) summaryEl.textContent = 'Next Hour: No precipitation.';
        return;
    }

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Helper to get value at specific time
    function getValueAtTime(property, targetTime) {
        if (!property?.values) return null;
        for (const item of property.values) {
            const [startStr, duration] = item.validTime.split('/');
            const start = new Date(startStr);
            const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            if (targetTime >= start && targetTime < end) {
                return item.value;
            }
        }
        return null;
    }

    // Helper to get weather value at specific time
    function getWeatherAtTime(targetTime) {
        if (!props.weather?.values) return [];
        for (const item of props.weather.values) {
            const [startStr, duration] = item.validTime.split('/');
            const start = new Date(startStr);
            const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            if (targetTime >= start && targetTime < end) {
                return item.value || [];
            }
        }
        return [];
    }

    // Determine precipitation type from weather data
    function getPrecipType() {
        const weatherValue = getWeatherAtTime(now);
        const snowAmount = getValueAtTime(props.snowfallAmount, now);

        // Check for snow
        const hasSnow = weatherValue.some(w => w?.weather?.toLowerCase().includes('snow')) || (snowAmount && snowAmount > 0);
        if (hasSnow) return 'snow';

        // Check for freezing rain/sleet
        const hasFreezingRain = weatherValue.some(w =>
            w?.weather?.toLowerCase().includes('freezing') ||
            w?.weather?.toLowerCase().includes('sleet') ||
            w?.weather?.toLowerCase().includes('ice')
        );
        if (hasFreezingRain) return 'freezing rain';

        // Default to rain
        return 'rain';
    }

    const precipType = getPrecipType();
    const precipLabel = precipType.charAt(0).toUpperCase() + precipType.slice(1); // Capitalize

    // Check precipitation probability for the next hour in 10-min increments
    const precipProbs = [];
    for (let i = 0; i <= 60; i += 10) {
        const checkTime = new Date(now.getTime() + i * 60 * 1000);
        const prob = getValueAtTime(props.probabilityOfPrecipitation, checkTime);
        precipProbs.push({ minutes: i, prob: prob || 0 });
    }

    // Current precip probability
    const currentProb = precipProbs[0].prob;
    const isCurrentlyPrecip = currentProb >= 50;

    // Find transitions
    let summary = '';

    if (isCurrentlyPrecip) {
        // Currently precipitating - look for when it stops
        const stopPoint = precipProbs.find(p => p.prob < 30 && p.minutes > 0);
        if (stopPoint) {
            summary = `${precipLabel} stopping in ${stopPoint.minutes} min.`;
        } else {
            // Check intensity
            const qpf = getValueAtTime(props.quantitativePrecipitation, now);
            if (qpf && qpf > 5) {
                summary = `Heavy ${precipType} for the next hour.`;
            } else if (qpf && qpf > 1) {
                summary = `${precipLabel} continuing for the next hour.`;
            } else {
                summary = `Light ${precipType} for the next hour.`;
            }
        }
    } else {
        // Not currently precipitating - look for when it starts
        const startPoint = precipProbs.find(p => p.prob >= 50 && p.minutes > 0);
        if (startPoint) {
            summary = `${precipLabel} starting in ${startPoint.minutes} min.`;
        } else {
            // Check if any chance at all
            const maxProb = Math.max(...precipProbs.map(p => p.prob));
            if (maxProb >= 30) {
                summary = `${Math.round(maxProb)}% chance of ${precipType} in the next hour.`;
            } else {
                summary = 'Next Hour: No precipitation.';
            }
        }
    }

    summaryEl.textContent = summary;
}

/**
 * Get weather icon based on gridpoint data for a specific time
 * @param {Date} time - The time to get conditions for
 * @param {Object} props - Gridpoint properties
 * @returns {string} Weather emoji icon
 */
function getHourlyWeatherIcon(time, props) {
    const hour = time.getHours();
    const isDaytime = hour >= 6 && hour < 20;

    // Helper to get value at specific time
    function getValueAtTime(property, targetTime) {
        if (!property?.values) return null;
        for (const item of property.values) {
            const [startStr, duration] = item.validTime.split('/');
            const start = new Date(startStr);
            const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            if (targetTime >= start && targetTime < end) {
                return item.value;
            }
        }
        return null;
    }

    // Get conditions at this time
    const precipProb = getValueAtTime(props.probabilityOfPrecipitation, time);
    const skyCover = getValueAtTime(props.skyCover, time);
    const snowAmount = getValueAtTime(props.snowfallAmount, time);
    const weather = props.weather?.values?.find(item => {
        const [startStr, duration] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
        return time >= start && time < end;
    });

    // Check weather conditions
    const weatherValue = weather?.value || [];
    const hasThunder = weatherValue.some(w => w?.weather?.toLowerCase().includes('thunder'));
    const hasRain = weatherValue.some(w =>
        w?.weather?.toLowerCase().includes('rain') ||
        w?.weather?.toLowerCase().includes('shower') ||
        w?.weather?.toLowerCase().includes('drizzle')
    );
    const hasSnow = weatherValue.some(w => w?.weather?.toLowerCase().includes('snow')) || (snowAmount && snowAmount > 0);
    const hasFog = weatherValue.some(w =>
        w?.weather?.toLowerCase().includes('fog') ||
        w?.weather?.toLowerCase().includes('mist')
    );

    // Determine icon based on conditions
    if (hasThunder) return '⛈️';
    if (hasSnow) return '🌨️';
    if (hasRain || (precipProb && precipProb > 50)) return '🌧️';
    if (hasFog) return '🌫️';

    // Cloud cover based icons
    if (skyCover !== null) {
        if (skyCover > 75) return isDaytime ? '☁️' : '☁️';
        if (skyCover > 50) return isDaytime ? '⛅' : '☁️';
        if (skyCover > 25) return isDaytime ? '🌤️' : '☁️';
    }

    // Clear conditions
    return isDaytime ? '☀️' : '🌙';
}

/**
 * Current hourly view mode ('temp', 'feels', 'precip')
 */
let hourlyViewMode = 'temp';

/**
 * Stored hourly data for re-rendering on toggle
 */
let hourlyDataCache = null;

/**
 * Get condition category for duration bar coloring
 * @param {Date} time - Time to check
 * @param {Object} props - Gridpoint properties
 * @returns {string} Condition category (rain, snow, storm, cloudy, clear, fog)
 */
function getConditionCategory(time, props) {
    // Helper to get value at specific time
    function getValueAtTime(property, targetTime) {
        if (!property?.values) return null;
        for (const item of property.values) {
            const [startStr, duration] = item.validTime.split('/');
            const start = new Date(startStr);
            const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            if (targetTime >= start && targetTime < end) {
                return item.value;
            }
        }
        return null;
    }

    // Check weather conditions
    const weather = props.weather?.values?.find(item => {
        const [startStr, duration] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
        return time >= start && time < end;
    });

    const weatherValue = weather?.value || [];
    const hasThunder = weatherValue.some(w => w?.weather?.toLowerCase().includes('thunder'));
    const hasDrizzle = weatherValue.some(w => w?.weather?.toLowerCase().includes('drizzle'));
    const hasLightRain = weatherValue.some(w => {
        const wLower = w?.weather?.toLowerCase() || '';
        return wLower.includes('light') && (wLower.includes('rain') || wLower.includes('shower'));
    });
    const hasRain = weatherValue.some(w =>
        w?.weather?.toLowerCase().includes('rain') ||
        w?.weather?.toLowerCase().includes('shower')
    );
    const hasSnow = weatherValue.some(w => w?.weather?.toLowerCase().includes('snow'));
    const hasFog = weatherValue.some(w =>
        w?.weather?.toLowerCase().includes('fog') ||
        w?.weather?.toLowerCase().includes('mist')
    );

    // Check precipitation probability
    const precipProb = getValueAtTime(props.probabilityOfPrecipitation, time);
    const skyCover = getValueAtTime(props.skyCover, time);

    // Determine category based on conditions (order matters - most severe first)
    if (hasThunder) return 'storm';
    if (hasSnow) return 'snow';
    if (hasDrizzle || hasLightRain) return 'drizzle';
    if (hasRain || (precipProb && precipProb > 50)) return 'rain';
    if (hasFog) return 'fog';
    if (skyCover !== null && skyCover > 60) return 'cloudy';
    return 'clear';
}

/**
 * Get short condition text for display
 * @param {Date} time - Time to check
 * @param {Object} props - Gridpoint properties
 * @returns {string} Short condition description
 */
function getConditionText(time, props) {
    const category = getConditionCategory(time, props);
    const hour = time.getHours();
    const isDaytime = hour >= 6 && hour < 20;

    // Helper to get value at specific time
    function getValueAtTime(property, targetTime) {
        if (!property?.values) return null;
        for (const item of property.values) {
            const [startStr, duration] = item.validTime.split('/');
            const start = new Date(startStr);
            const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
            const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
            if (targetTime >= start && targetTime < end) {
                return item.value;
            }
        }
        return null;
    }

    const skyCover = getValueAtTime(props.skyCover, time);
    const precipProb = getValueAtTime(props.probabilityOfPrecipitation, time);

    switch (category) {
        case 'storm': return 'Thunderstorms';
        case 'snow': return 'Snow';
        case 'rain':
            if (precipProb && precipProb >= 70) return 'Rain';
            return 'Light Rain';
        case 'fog': return 'Fog';
        case 'cloudy':
            if (skyCover > 85) return 'Overcast';
            return 'Mostly Cloudy';
        case 'clear':
        default:
            if (skyCover && skyCover > 25) return isDaytime ? 'Partly Cloudy' : 'Partly Cloudy';
            return isDaytime ? 'Clear' : 'Clear';
    }
}

/**
 * Render hourly forecast as Dark Sky-style vertical timeline
 */
function renderHourlyForecast() {
    const data = window.weatherData;
    if (!data?.gridpoint?.properties?.temperature?.values) return;

    const container = document.querySelector('#hourly-forecast .hourly-timeline');
    if (!container) return;

    const props = data.gridpoint.properties;
    const temps = props.temperature.values;
    const isC = props.temperature.uom?.includes('C');

    // Get next 12 hours starting from now
    const now = new Date();
    const hourlyData = [];
    const seenHours = new Set();

    for (const item of temps) {
        const [startStr, durationStr] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(durationStr?.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        // Include if now falls within this period OR if it starts in the future
        if (end > now && hourlyData.length < 12) {
            // Expand multi-hour periods into individual hours
            for (let h = 0; h < hours && hourlyData.length < 12; h++) {
                const hourTime = new Date(start.getTime() + h * 60 * 60 * 1000);
                const hourKey = hourTime.toISOString();

                // Skip hours in the past and avoid duplicates
                if (hourTime.getTime() + 60 * 60 * 1000 <= now.getTime()) continue;
                if (seenHours.has(hourKey)) continue;
                seenHours.add(hourKey);

                let temp = item.value;
                if (isC) temp = temp * 9 / 5 + 32;
                temp = Math.round(temp);

                // Get feels like temperature
                let feelsLike = null;
                if (props.apparentTemperature?.values) {
                    for (const fItem of props.apparentTemperature.values) {
                        const [fStartStr, fDuration] = fItem.validTime.split('/');
                        const fStart = new Date(fStartStr);
                        const fHours = parseInt(fDuration.match(/PT(\d+)H/)?.[1] || '1');
                        const fEnd = new Date(fStart.getTime() + fHours * 60 * 60 * 1000);
                        if (hourTime >= fStart && hourTime < fEnd) {
                            feelsLike = fItem.value;
                            if (isC) feelsLike = feelsLike * 9 / 5 + 32;
                            feelsLike = Math.round(feelsLike);
                            break;
                        }
                    }
                }

                // Get precipitation probability
                let precipProb = null;
                if (props.probabilityOfPrecipitation?.values) {
                    for (const pItem of props.probabilityOfPrecipitation.values) {
                        const [pStartStr, pDuration] = pItem.validTime.split('/');
                        const pStart = new Date(pStartStr);
                        const pHours = parseInt(pDuration.match(/PT(\d+)H/)?.[1] || '1');
                        const pEnd = new Date(pStart.getTime() + pHours * 60 * 60 * 1000);
                        if (hourTime >= pStart && hourTime < pEnd) {
                            precipProb = Math.round(pItem.value);
                            break;
                        }
                    }
                }

                hourlyData.push({
                    time: hourTime,
                    temp,
                    feelsLike: feelsLike !== null ? feelsLike : temp,
                    precipProb: precipProb !== null ? precipProb : 0,
                    icon: getHourlyWeatherIcon(hourTime, props),
                    condition: getConditionText(hourTime, props),
                    category: getConditionCategory(hourTime, props),
                    isNow: hourlyData.length === 0
                });
            }
        }
    }

    // Cache for re-rendering on toggle
    hourlyDataCache = hourlyData;

    // Calculate condition spans for duration bar styling
    const conditionSpans = calculateConditionSpans(hourlyData);

    // Render the timeline
    renderHourlyTimeline(container, hourlyData, conditionSpans);

    // Render 12-hour precipitation summary
    renderHourlyPrecipSummary();

    // Set up toggle button listeners
    setupHourlyToggles();
}

/**
 * Render the 12-hour precipitation summary
 */
function renderHourlyPrecipSummary() {
    const summaryEl = document.getElementById('hourly-precip-summary');
    if (!summaryEl) return;

    const precip = get12HourPrecip();

    if (precip.amount >= 0.01 && precip.type) {
        const amountStr = precip.amount < 0.1
            ? precip.amount.toFixed(2)
            : precip.amount.toFixed(1);
        summaryEl.textContent = `${precip.type}: ${amountStr} in.`;
        summaryEl.style.display = 'inline';
    } else {
        summaryEl.style.display = 'none';
    }
}

/**
 * Calculate condition spans for connected duration bars
 * @param {Array} hourlyData - Array of hourly data objects
 * @returns {Array} Array of span info (start, end, single, continues)
 */
function calculateConditionSpans(hourlyData) {
    const spans = [];

    for (let i = 0; i < hourlyData.length; i++) {
        const current = hourlyData[i].category;
        const prev = i > 0 ? hourlyData[i - 1].category : null;
        const next = i < hourlyData.length - 1 ? hourlyData[i + 1].category : null;

        let spanType = 'single';
        if (prev === current && next === current) {
            spanType = 'continues';
        } else if (prev !== current && next === current) {
            spanType = 'start';
        } else if (prev === current && next !== current) {
            spanType = 'end';
        }

        spans.push(spanType);
    }

    return spans;
}

/**
 * Render the hourly timeline with current view mode
 * @param {HTMLElement} container - Container element
 * @param {Array} hourlyData - Hourly data array
 * @param {Array} conditionSpans - Condition span types
 */
function renderHourlyTimeline(container, hourlyData, conditionSpans) {
    // Calculate min/max for pill sizing based on current view mode
    let minVal, maxVal, values;

    switch (hourlyViewMode) {
        case 'feels':
            values = hourlyData.map(h => h.feelsLike);
            break;
        case 'precip':
            values = hourlyData.map(h => h.precipProb);
            minVal = 0;
            maxVal = 100;
            break;
        case 'temp':
        default:
            values = hourlyData.map(h => h.temp);
            break;
    }

    // For temp/feels, use actual range with some padding
    if (hourlyViewMode !== 'precip') {
        const actualMin = Math.min(...values);
        const actualMax = Math.max(...values);
        const range = actualMax - actualMin;
        // Add padding so bars don't start at 0% or end at 100%
        minVal = actualMin - Math.max(5, range * 0.2);
        maxVal = actualMax + Math.max(5, range * 0.2);
    }

    const range = maxVal - minVal;

    container.innerHTML = hourlyData.map((hour, index) => {
        const timeLabel = hour.isNow ? 'NOW' : formatTime(hour.time.toISOString());
        const spanClass = `condition-${conditionSpans[index]}`;

        // Get value and pill width based on current view mode
        let displayValue, currentVal, pillClass;

        switch (hourlyViewMode) {
            case 'feels':
                currentVal = hour.feelsLike;
                displayValue = `${hour.feelsLike}°`;
                pillClass = getTempClass(hour.feelsLike);
                break;
            case 'precip':
                currentVal = hour.precipProb;
                displayValue = `${hour.precipProb}%`;
                if (hour.precipProb >= 70) pillClass = 'precip-high';
                else if (hour.precipProb >= 40) pillClass = 'precip-medium';
                else if (hour.precipProb > 0) pillClass = 'precip-low';
                else pillClass = 'precip-none';
                break;
            case 'temp':
            default:
                currentVal = hour.temp;
                displayValue = `${hour.temp}°`;
                pillClass = getTempClass(hour.temp);
                break;
        }

        // Calculate pill width as percentage of range
        const pillWidth = range > 0 ? Math.round(((currentVal - minVal) / range) * 100) : 50;

        // Detect if condition changed from previous hour
        const prevCondition = index > 0 ? hourlyData[index - 1].condition : null;
        const conditionChanged = hour.condition !== prevCondition;
        const labelClass = conditionChanged ? '' : 'no-label';
        const conditionLabel = conditionChanged ? `<span class="condition-text">${hour.condition}</span>` : '';

        return `
            <div class="hourly-row ${spanClass}" role="listitem" title="${hour.condition}">
                <div class="hourly-duration-bar condition-${hour.category}" aria-hidden="true"></div>
                <div class="hourly-row-time ${hour.isNow ? 'now' : ''}">${timeLabel}</div>
                <div class="hourly-row-icon" aria-label="${hour.condition}">${hour.icon}</div>
                <div class="hourly-row-condition-label ${labelClass}">
                    ${conditionLabel}
                    <div class="condition-line"></div>
                </div>
                <div class="hourly-pill-track">
                    <div class="hourly-pill ${pillClass}" style="width: ${pillWidth}%"></div>
                </div>
                <div class="hourly-row-value">${displayValue}</div>
            </div>
        `;
    }).join('');
}

/**
 * Set up hourly toggle button event listeners
 */
function setupHourlyToggles() {
    const toggles = document.querySelectorAll('.hourly-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            // Update active state
            toggles.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            toggle.classList.add('active');
            toggle.setAttribute('aria-selected', 'true');

            // Update view mode and re-render
            hourlyViewMode = toggle.dataset.view;

            if (hourlyDataCache) {
                const container = document.querySelector('#hourly-forecast .hourly-timeline');
                const conditionSpans = calculateConditionSpans(hourlyDataCache);
                renderHourlyTimeline(container, hourlyDataCache, conditionSpans);
            }
        });
    });
}

/**
 * Extract precipitation type from forecast conditions string
 * @param {string} conditions - The forecast conditions (e.g., "Freezing Rain", "Rain Showers")
 * @returns {string|null} The precipitation type or null if none
 */
function getPrecipType(conditions) {
    if (!conditions) return null;
    const lower = conditions.toLowerCase();

    // Check for specific precipitation types (order matters - check more specific first)
    if (lower.includes('freezing rain')) return 'Freezing Rain';
    if (lower.includes('ice') || lower.includes('sleet')) return 'Ice/Sleet';
    if (lower.includes('snow')) return 'Snow';
    if (lower.includes('rain') || lower.includes('shower') || lower.includes('drizzle')) return 'Rain';
    if (lower.includes('thunderstorm') || lower.includes('t-storm')) return 'Rain';

    return null;
}

/**
 * Calculate total precipitation amount for next 12 hours from gridpoint data
 * @returns {{amount: number, type: string|null}} Precipitation amount in inches and type
 */
function get12HourPrecip() {
    const data = window.weatherData;
    if (!data?.gridpoint?.properties) return { amount: 0, type: null };

    const props = data.gridpoint.properties;
    const qpfValues = props.quantitativePrecipitation?.values || [];
    const weather = props.weather?.values || [];

    const now = new Date();
    const end12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    let totalMm = 0;
    let precipType = null;

    // Get total precipitation amount
    for (const item of qpfValues) {
        const [startStr, duration] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        if (start < end12h && end > now) {
            totalMm += item.value || 0;
        }
    }

    // Get precipitation type from weather data
    for (const item of weather) {
        const [startStr, duration] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        if (start < end12h && end > now && item.value) {
            for (const w of item.value) {
                if (w?.weather) {
                    const type = getPrecipType(w.weather);
                    if (type) {
                        precipType = type;
                        break;
                    }
                }
            }
            if (precipType) break;
        }
    }

    return {
        amount: totalMm / 25.4, // Convert mm to inches
        type: precipType
    };
}

/**
 * Calculate total precipitation amount for a day from gridpoint data
 * @param {string} dayStartStr - ISO date string for the start of the day
 * @returns {number} Total precipitation in inches
 */
function getDayPrecipAmount(dayStartStr) {
    const data = window.weatherData;
    if (!data?.gridpoint?.properties?.quantitativePrecipitation?.values) return 0;

    const qpfValues = data.gridpoint.properties.quantitativePrecipitation.values;
    const dayStart = new Date(dayStartStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    let totalMm = 0;

    for (const item of qpfValues) {
        const [startStr, duration] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        // Check if this period overlaps with the day
        if (start < dayEnd && end > dayStart) {
            totalMm += item.value || 0;
        }
    }

    // Convert mm to inches (1 inch = 25.4 mm)
    return totalMm / 25.4;
}

/**
 * Render 7-day forecast
 */
function render7DayForecast() {
    const data = window.weatherData;
    if (!data?.forecast?.properties?.periods) return;

    const container = document.querySelector('#weekly-forecast .weekly-grid');
    if (!container) return;

    const periods = data.forecast.properties.periods;

    // Group by day (combine day and night periods)
    const days = [];
    for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        if (period.isDaytime) {
            const nightPeriod = periods[i + 1];
            const precipChance = period.probabilityOfPrecipitation?.value || 0;
            const precipAmount = getDayPrecipAmount(period.startTime);
            const precipType = getPrecipType(period.shortForecast);
            days.push({
                name: period.name,
                date: period.startTime,
                high: period.temperature,
                low: nightPeriod?.temperature ?? '--',
                conditions: period.shortForecast,
                icon: getWeatherIcon(period.shortForecast, true),
                detailedForecast: period.detailedForecast,
                precipChance: precipChance,
                precipAmount: precipAmount,
                precipType: precipType
            });
        }
    }

    // Calculate week's min/max temps for relative positioning
    const weekHighs = days.map(d => d.high).filter(t => typeof t === 'number');
    const weekLows = days.map(d => d.low).filter(t => typeof t === 'number');
    const weekMax = Math.max(...weekHighs, ...weekLows);
    const weekMin = Math.min(...weekHighs, ...weekLows);
    const weekRange = weekMax - weekMin || 1; // Avoid division by zero

    container.innerHTML = days.map((day, index) => {
        // Show precip inline with condition if > 0%
        let precipInline = '';
        if (day.precipChance > 0) {
            // Format precipitation with type and amount
            let precipText = `💧${day.precipChance}%`;
            if (day.precipAmount >= 0.01 && day.precipType) {
                const amountStr = day.precipAmount < 0.1
                    ? day.precipAmount.toFixed(2)
                    : day.precipAmount.toFixed(1);
                precipText += ` ${amountStr}in`;
            }
            precipInline = `<span class="daily-precip-tag">${precipText}</span>`;
        }

        // Calculate positions as percentage of week's range
        // The temps float to their relative position within the track
        const dayLow = typeof day.low === 'number' ? day.low : weekMin;
        const dayHigh = typeof day.high === 'number' ? day.high : weekMax;
        const lowPosition = ((dayLow - weekMin) / weekRange) * 100;
        const highPosition = ((dayHigh - weekMin) / weekRange) * 100;

        // Get temperature bar color based on average temp
        const avgTemp = (dayLow + dayHigh) / 2;
        const tempBarClass = getTempBarClass(avgTemp);

        // Format day name: "Today" stays, others become 3-letter abbreviations
        const dayName = day.name === 'Today' ? 'Today' : day.name.slice(0, 3);

        // Precipitation shown under day name
        const precipDisplay = day.precipChance > 0
            ? `<div class="daily-precip">💧${day.precipChance}%</div>`
            : '';

        return `
        <div class="daily-item" role="listitem" data-day-index="${index}" data-day-date="${day.date}">
            <div class="daily-item-header">
                <div class="daily-info">
                    <div class="daily-day">${dayName}</div>
                    ${precipDisplay}
                </div>
                <span class="daily-icon">${day.icon}</span>
                <div class="daily-temp-range">
                    <div class="temp-bar-track">
                        <span class="temp-low" style="left: ${lowPosition}%">${typeof day.low === 'number' ? day.low + '°' : day.low}</span>
                        <div class="temp-bar-fill ${tempBarClass}" style="left: ${lowPosition}%; width: ${highPosition - lowPosition}%;"></div>
                        <span class="temp-high" style="left: ${highPosition}%">${day.high}°</span>
                    </div>
                </div>
                <svg class="expand-indicator" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="daily-expanded-chart" id="daily-chart-${index}">
                <div class="daily-chart-title">Hourly Breakdown</div>
                <div class="daily-chart-timeline" role="list"></div>
                <div class="daily-chart-toggles" role="tablist">
                    <button type="button" class="hourly-toggle active" data-view="temp" data-day="${index}" role="tab" aria-selected="true">TEMP</button>
                    <button type="button" class="hourly-toggle" data-view="feels" data-day="${index}" role="tab" aria-selected="false">FEELS</button>
                    <button type="button" class="hourly-toggle" data-view="precip" data-day="${index}" role="tab" aria-selected="false">PRECIP</button>
                </div>
            </div>
        </div>
    `}).join('');

    // Set up click handlers for expanding/collapsing
    setupDailyItemExpansion(container);
}

/**
 * Track expanded day's view mode (separate from main hourly view)
 */
const dailyViewModes = {};

/**
 * Set up click handlers for daily item expansion
 * @param {HTMLElement} container - The weekly grid container
 */
function setupDailyItemExpansion(container) {
    const dailyItems = container.querySelectorAll('.daily-item');

    dailyItems.forEach(item => {
        const header = item.querySelector('.daily-item-header');
        const dayIndex = parseInt(item.dataset.dayIndex);

        // Initialize view mode for this day
        dailyViewModes[dayIndex] = 'temp';

        // Click on header to expand/collapse
        header.addEventListener('click', () => {
            const wasExpanded = item.classList.contains('expanded');

            // Collapse all other items
            dailyItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('expanded');
                }
            });

            // Toggle this item
            item.classList.toggle('expanded');

            // If expanding, render the chart
            if (!wasExpanded) {
                renderDayHourlyChart(dayIndex, item.dataset.dayDate);
            }
        });

        // Set up toggle buttons for this day's chart
        const toggles = item.querySelectorAll('.daily-chart-toggles .hourly-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling to header

                // Update active state within this day's toggles
                toggles.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                toggle.classList.add('active');
                toggle.setAttribute('aria-selected', 'true');

                // Update view mode and re-render
                dailyViewModes[dayIndex] = toggle.dataset.view;
                renderDayHourlyChart(dayIndex, item.dataset.dayDate);
            });
        });
    });
}

/**
 * Render hourly chart for a specific day
 * @param {number} dayIndex - Index of the day (0-6)
 * @param {string} dayDateStr - ISO date string for the day
 */
function renderDayHourlyChart(dayIndex, dayDateStr) {
    const data = window.weatherData;
    if (!data?.gridpoint?.properties?.temperature?.values) return;

    const chartContainer = document.querySelector(`#daily-chart-${dayIndex} .daily-chart-timeline`);
    if (!chartContainer) return;

    const props = data.gridpoint.properties;
    const temps = props.temperature.values;
    const appTemps = props.apparentTemperature?.values || [];
    const precipProbs = props.probabilityOfPrecipitation?.values || [];
    const weather = props.weather?.values || [];

    // Check if temperatures are in Celsius (NWS returns C)
    const tempUnit = props.temperature.uom;
    const isC = tempUnit?.includes('degC') || tempUnit?.includes('celsius');

    // Parse the day's date to get start and end of that day
    const dayDate = new Date(dayDateStr);
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Collect hourly data for this specific day
    const hourlyData = [];
    const seenHours = new Set();

    for (const item of temps) {
        const [startStr, durationStr] = item.validTime.split('/');
        const start = new Date(startStr);
        const hours = parseInt(durationStr?.match(/PT(\d+)H/)?.[1] || '1');
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

        // Check if this period overlaps with the target day
        if (end > dayStart && start <= dayEnd) {
            // Expand multi-hour periods into individual hours
            for (let h = 0; h < hours; h++) {
                const hourTime = new Date(start.getTime() + h * 60 * 60 * 1000);
                const hourKey = hourTime.toISOString();

                // Only include hours for this specific day and avoid duplicates
                if (hourTime < dayStart || hourTime > dayEnd) continue;
                if (seenHours.has(hourKey)) continue;
                seenHours.add(hourKey);

                let temp = item.value;
                if (isC) temp = temp * 9 / 5 + 32;
                temp = Math.round(temp);

                // Find corresponding apparent temperature (check if hour falls within range)
                let feelsLike = null;
                for (const at of appTemps) {
                    const [atStartStr, atDuration] = at.validTime.split('/');
                    const atStart = new Date(atStartStr);
                    const atHours = parseInt(atDuration?.match(/PT(\d+)H/)?.[1] || '1');
                    const atEnd = new Date(atStart.getTime() + atHours * 60 * 60 * 1000);
                    if (hourTime >= atStart && hourTime < atEnd) {
                        feelsLike = at.value;
                        if (isC) feelsLike = feelsLike * 9 / 5 + 32;
                        feelsLike = Math.round(feelsLike);
                        break;
                    }
                }

                // Find corresponding precipitation probability (check if hour falls within range)
                let precipProb = 0;
                for (const pp of precipProbs) {
                    const [ppStartStr, ppDuration] = pp.validTime.split('/');
                    const ppStart = new Date(ppStartStr);
                    const ppHours = parseInt(ppDuration?.match(/PT(\d+)H/)?.[1] || '1');
                    const ppEnd = new Date(ppStart.getTime() + ppHours * 60 * 60 * 1000);
                    if (hourTime >= ppStart && hourTime < ppEnd) {
                        precipProb = pp.value || 0;
                        break;
                    }
                }

                hourlyData.push({
                    time: hourTime,
                    temp,
                    feelsLike: feelsLike !== null ? feelsLike : temp,
                    precipProb,
                    icon: getHourlyWeatherIcon(hourTime, props),
                    condition: getConditionText(hourTime, props),
                    category: getConditionCategory(hourTime, props),
                    isNow: false
                });
            }
        }
    }

    // If no data for this day, show a message
    if (hourlyData.length === 0) {
        chartContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-light);">Detailed hourly data not available for this day</div>';
        return;
    }

    // Calculate condition spans
    const conditionSpans = calculateConditionSpans(hourlyData);

    // Render the chart using the day's view mode
    renderDayChartTimeline(chartContainer, hourlyData, conditionSpans, dailyViewModes[dayIndex]);
}

/**
 * Render the day's hourly chart timeline (similar to main hourly timeline)
 * @param {HTMLElement} container - Container element
 * @param {Array} hourlyData - Hourly data array for the day
 * @param {Array} conditionSpans - Condition span types
 * @param {string} viewMode - Current view mode (temp, feels, precip)
 */
function renderDayChartTimeline(container, hourlyData, conditionSpans, viewMode) {
    // Calculate min/max for pill sizing based on view mode
    let minVal, maxVal, values;

    switch (viewMode) {
        case 'feels':
            values = hourlyData.map(h => h.feelsLike);
            break;
        case 'precip':
            values = hourlyData.map(h => h.precipProb);
            minVal = 0;
            maxVal = 100;
            break;
        case 'temp':
        default:
            values = hourlyData.map(h => h.temp);
            break;
    }

    // For temp/feels, use actual range with some padding
    if (viewMode !== 'precip') {
        const actualMin = Math.min(...values);
        const actualMax = Math.max(...values);
        const range = actualMax - actualMin;
        minVal = actualMin - Math.max(5, range * 0.2);
        maxVal = actualMax + Math.max(5, range * 0.2);
    }

    const range = maxVal - minVal;

    container.innerHTML = hourlyData.map((hour, index) => {
        const timeLabel = formatTime(hour.time.toISOString());
        const spanClass = `condition-${conditionSpans[index]}`;

        // Get value and pill width based on current view mode
        let displayValue, currentVal, pillClass;

        switch (viewMode) {
            case 'feels':
                currentVal = hour.feelsLike;
                displayValue = `${hour.feelsLike}°`;
                pillClass = getTempClass(hour.feelsLike);
                break;
            case 'precip':
                currentVal = hour.precipProb;
                displayValue = `${hour.precipProb}%`;
                if (hour.precipProb >= 70) pillClass = 'precip-high';
                else if (hour.precipProb >= 40) pillClass = 'precip-medium';
                else if (hour.precipProb > 0) pillClass = 'precip-low';
                else pillClass = 'precip-none';
                break;
            case 'temp':
            default:
                currentVal = hour.temp;
                displayValue = `${hour.temp}°`;
                pillClass = getTempClass(hour.temp);
                break;
        }

        // Calculate pill width as percentage of range
        const pillWidth = range > 0 ? Math.round(((currentVal - minVal) / range) * 100) : 50;

        // Detect if condition changed from previous hour
        const prevCondition = index > 0 ? hourlyData[index - 1].condition : null;
        const conditionChanged = hour.condition !== prevCondition;
        const labelClass = conditionChanged ? '' : 'no-label';
        const conditionLabel = conditionChanged ? `<span class="condition-text">${hour.condition}</span>` : '';

        return `
            <div class="hourly-row ${spanClass}" role="listitem" title="${hour.condition}">
                <div class="hourly-duration-bar condition-${hour.category}" aria-hidden="true"></div>
                <div class="hourly-row-time">${timeLabel}</div>
                <div class="hourly-row-icon" aria-label="${hour.condition}">${hour.icon}</div>
                <div class="hourly-row-condition-label ${labelClass}">
                    ${conditionLabel}
                    <div class="condition-line"></div>
                </div>
                <div class="hourly-pill-track">
                    <div class="hourly-pill ${pillClass}" style="width: ${pillWidth}%"></div>
                </div>
                <div class="hourly-row-value">${displayValue}</div>
            </div>
        `;
    }).join('');
}

/**
 * Render weather alerts as inline badges (Dark Sky style)
 */
function renderAlerts() {
    const data = window.weatherData;
    const container = document.getElementById('alerts-container');
    if (!container) return;

    const alerts = data?.alerts?.features || [];

    if (alerts.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Sort by severity (Extreme first, then Severe, etc.)
    const severityOrder = { 'Extreme': 0, 'Severe': 1, 'Moderate': 2, 'Minor': 3, 'Unknown': 4 };
    const sortedAlerts = [...alerts].sort((a, b) =>
        (severityOrder[a.properties.severity] || 4) - (severityOrder[b.properties.severity] || 4)
    );

    // Render as inline badge pills
    container.innerHTML = sortedAlerts.map((alert, index) => {
        const props = alert.properties;

        // Determine badge class
        let badgeClass = 'alert-badge-advisory';
        let icon = 'ℹ️';
        if (props.severity === 'Extreme' || props.severity === 'Severe') {
            badgeClass = 'alert-badge-warning';
            icon = '⚠️';
        } else if (props.event.toLowerCase().includes('watch')) {
            badgeClass = 'alert-badge-watch';
            icon = '👁️';
        }

        return `
            <span class="alert-badge ${badgeClass}" role="alert" data-index="${index}" title="${props.headline || props.event}">
                <span class="alert-badge-icon" aria-hidden="true">${icon}</span>
                <span class="alert-badge-text">${props.event}</span>
            </span>
        `;
    }).join('');

    // Store full alert data for modal/expansion later
    container._alertData = sortedAlerts;

    // Add click handlers for alert detail expansion
    container.querySelectorAll('.alert-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            const index = parseInt(badge.dataset.index);
            const alertData = container._alertData?.[index];
            if (alertData) {
                showAlertModal(alertData.properties);
            }
        });
    });
}

/**
 * Show alert details in a modal/expanded view
 * @param {Object} props - Alert properties
 */
function showAlertModal(props) {
    // For now, use a simple alert. Can be upgraded to a modal later.
    const expires = props.expires ? new Date(props.expires).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }) : 'Unknown';

    const message = `${props.event}\n\n${props.headline || ''}\n\nExpires: ${expires}\n\n${props.description || ''}`;
    alert(message);
}

/**
 * Toggle alert expand/collapse on click
 * @param {HTMLElement} alertEl - The alert element
 */
function toggleAlertExpand(alertEl) {
    alertEl.classList.toggle('expanded');
}

/**
 * Toggle alert details visibility
 * @param {number} index - Index of the alert to toggle
 */
function toggleAlertDetails(index) {
    const details = document.getElementById(`alert-details-${index}`);
    const button = details?.previousElementSibling;
    if (details && button) {
        const isHidden = details.style.display === 'none';
        details.style.display = isHidden ? 'block' : 'none';
        button.textContent = isHidden ? 'Hide Details' : 'Show Details';
        button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    }
}

// =============================================================================
// MAP FUNCTIONS
// =============================================================================

/**
 * Initialize the weather map (static, non-interactive for this view)
 */
function initializeMap() {
    const mapContainer = document.getElementById('weather-map');
    if (!mapContainer || typeof L === 'undefined') {
        console.warn('[WeatherBuster] Map container or Leaflet not found');
        return;
    }

    // Default center (continental US)
    const defaultCenter = [39.8283, -98.5795];
    const defaultZoom = 4;

    // Create the map - static, no interactions
    weatherMap = L.map('weather-map', {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(weatherMap);

    // If we have a saved location, add a marker there
    const savedLocation = loadSavedLocation();
    if (savedLocation) {
        updateMapMarker(savedLocation.latitude, savedLocation.longitude, savedLocation.name);
        weatherMap.setView([savedLocation.latitude, savedLocation.longitude], 8);
    }

    console.log('[WeatherBuster] Map initialized (static mode)');
}

/**
 * Handle click events on the map
 * @param {Object} e - Leaflet click event
 */
async function handleMapClick(e) {
    const { lat, lng } = e.latlng;
    console.log('[WeatherBuster] Map clicked at:', lat, lng);

    // Cancel any in-flight request
    if (weatherAbortController) {
        weatherAbortController.abort();
    }
    weatherAbortController = new AbortController();
    const signal = weatherAbortController.signal;

    // Update marker immediately for responsive feel
    updateMapMarker(lat, lng, 'Loading...');

    // Show non-blocking loading state
    hideError();
    showContentLoading();

    try {
        // Reverse geocode to get location name
        const locationName = await reverseGeocode(lat, lng);

        // Check if request was cancelled
        if (signal.aborted) return;

        // Update marker with actual name
        updateMapMarker(lat, lng, locationName);

        // Fetch weather for this location (non-blocking)
        await handleLocationSelected(lat, lng, locationName, { fromMap: true, signal });

    } catch (error) {
        if (error.name === 'AbortError' || signal.aborted) {
            console.log('[WeatherBuster] Map click request cancelled');
            return;
        }
        console.error('[WeatherBuster] Map click error:', error);
        hideContentLoading();
        showError(error.message || 'Failed to get weather for this location');
    }
}

/**
 * Update or create the map marker
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} name - Location name for header display
 */
function updateMapMarker(lat, lon, name) {
    if (!weatherMap) return;

    // Remove existing marker if present
    if (mapMarker) {
        weatherMap.removeLayer(mapMarker);
    }

    // Create custom icon
    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
            background-color: #1e88e5;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    // Create new marker (no popup)
    mapMarker = L.marker([lat, lon], { icon: customIcon })
        .addTo(weatherMap);
}

/**
 * Center the map on a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level (optional)
 */
function centerMapOn(lat, lon, zoom = 10) {
    if (weatherMap) {
        weatherMap.setView([lat, lon], zoom);
    }
}

/**
 * Set up map-related event listeners
 */
function setupMapEventListeners() {
    // Map is always visible, no toggle needed
}

// =============================================================================
// RADAR LAYER FUNCTIONS (Animated with RainViewer)
// =============================================================================

/**
 * Initialize radar - always enabled, fetch available frames from RainViewer
 */
async function initializeRadarLayer() {
    if (!weatherMap || typeof L === 'undefined') return;

    // Always enable radar
    await enableRadar(true);

    console.log('[WeatherBuster] Radar layer initialized (always on)');
}

/**
 * Fetch radar frames from RainViewer API
 */
async function fetchRadarFrames() {
    try {
        // Add cache-busting parameter and no-cache headers to ensure fresh radar data
        const cacheBuster = `?_=${Date.now()}`;
        const response = await fetch(RAINVIEWER_API + cacheBuster, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to fetch radar data');

        const data = await response.json();

        // Get past radar frames and forecast frames
        const pastFrames = data.radar?.past || [];
        const nowcastFrames = data.radar?.nowcast || [];

        // Combine past and forecast, limit to last 12 frames + 3 forecast
        radarFrames = [...pastFrames.slice(-12), ...nowcastFrames.slice(0, 3)];

        console.log('[WeatherBuster] Fetched', radarFrames.length, 'radar frames');
        return radarFrames;
    } catch (error) {
        console.error('[WeatherBuster] Error fetching radar frames:', error);
        return [];
    }
}

/**
 * Create radar tile layers for all frames
 */
function createRadarLayers() {
    // Clear existing layers
    radarLayers.forEach(layer => {
        if (weatherMap.hasLayer(layer)) {
            weatherMap.removeLayer(layer);
        }
    });
    radarLayers = [];

    // Create a layer for each frame
    radarFrames.forEach((frame, index) => {
        const layer = L.tileLayer(RAINVIEWER_TILE_URL.replace('{path}', frame.path), {
            opacity: 0,
            attribution: 'Radar: <a href="https://www.rainviewer.com/">RainViewer</a>',
            maxZoom: 18,
            zIndex: 100
        });
        radarLayers.push(layer);
    });

    // Preload all frames by adding them to the map with opacity 0
    // This triggers the browser to fetch tiles in the background for smooth animation
    radarLayers.forEach(layer => {
        layer.addTo(weatherMap);
    });

    console.log('[WeatherBuster] Created and preloading', radarLayers.length, 'radar layers');
}

/**
 * Show a specific radar frame
 * @param {number} index - Frame index to show
 */
function showRadarFrame(index) {
    if (!radarEnabled || radarLayers.length === 0) return;

    // Clamp index to valid range
    index = Math.max(0, Math.min(index, radarLayers.length - 1));
    currentFrameIndex = index;

    // Hide all layers, show selected one
    radarLayers.forEach((layer, i) => {
        if (i === index) {
            if (!weatherMap.hasLayer(layer)) {
                layer.addTo(weatherMap);
            }
            layer.setOpacity(0.6);
        } else {
            layer.setOpacity(0);
        }
    });

    // Update slider and timestamp display
    updateRadarControls();
}

/**
 * Update the radar control UI
 */
function updateRadarControls() {
    const slider = document.getElementById('radar-slider');
    const timestamp = document.getElementById('radar-timestamp');
    const playBtn = document.getElementById('radar-play-btn');

    if (slider) {
        slider.value = currentFrameIndex;
        slider.max = radarFrames.length - 1;
    }

    if (timestamp && radarFrames[currentFrameIndex]) {
        const frame = radarFrames[currentFrameIndex];
        const date = new Date(frame.time * 1000);
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Check if this is a forecast frame (nowcast)
        const isPast = currentFrameIndex < radarFrames.length - 3;
        const label = isPast ? '' : ' (Forecast)';

        timestamp.textContent = timeStr + label;
    }

    if (playBtn) {
        playBtn.classList.toggle('playing', isRadarPlaying);
        playBtn.setAttribute('aria-label', isRadarPlaying ? 'Pause radar animation' : 'Play radar animation');
    }
}

/**
 * Play radar animation
 */
function playRadarAnimation() {
    if (radarAnimationInterval) {
        clearInterval(radarAnimationInterval);
    }

    isRadarPlaying = true;
    updateRadarControls();

    radarAnimationInterval = setInterval(() => {
        let nextIndex = currentFrameIndex + 1;
        if (nextIndex >= radarFrames.length) {
            nextIndex = 0; // Loop back to start
        }
        showRadarFrame(nextIndex);
    }, 500); // 500ms per frame
}

/**
 * Pause radar animation
 */
function pauseRadarAnimation() {
    if (radarAnimationInterval) {
        clearInterval(radarAnimationInterval);
        radarAnimationInterval = null;
    }
    isRadarPlaying = false;
    updateRadarControls();
}

/**
 * Toggle radar animation play/pause
 */
function toggleRadarAnimation() {
    if (isRadarPlaying) {
        pauseRadarAnimation();
    } else {
        playRadarAnimation();
    }
}

/**
 * Enable or disable radar layer
 * @param {boolean} enable - Whether to enable radar
 */
async function enableRadar(enable) {
    if (!weatherMap) return;

    const controlsContainer = document.getElementById('radar-controls');

    if (enable) {
        // Fetch frames and create layers
        await fetchRadarFrames();

        if (radarFrames.length > 0) {
            createRadarLayers();

            // Set enabled BEFORE showing frame (showRadarFrame checks this flag)
            radarEnabled = true;

            // Show the most recent frame immediately
            showRadarFrame(radarFrames.length - 4); // Start near the end (most recent past)

            // Show controls
            if (controlsContainer) {
                controlsContainer.removeAttribute('hidden');
            }
        }
    } else {
        // Stop animation
        pauseRadarAnimation();

        // Remove all layers
        radarLayers.forEach(layer => {
            if (weatherMap.hasLayer(layer)) {
                weatherMap.removeLayer(layer);
            }
        });
        radarLayers = [];
        radarFrames = [];

        // Hide controls
        if (controlsContainer) {
            controlsContainer.setAttribute('hidden', '');
        }

        radarEnabled = false;
    }

    // Save preference
    localStorage.setItem(STORAGE_KEYS.RADAR, enable.toString());
    console.log('[WeatherBuster] Radar', enable ? 'enabled' : 'disabled');
}

/**
 * Toggle radar layer on/off
 */
async function toggleRadar() {
    await enableRadar(!radarEnabled);
    return radarEnabled;
}

/**
 * Refresh radar data
 */
async function refreshRadar() {
    if (!radarEnabled) return;

    pauseRadarAnimation();
    await fetchRadarFrames();

    if (radarFrames.length > 0) {
        createRadarLayers();
        showRadarFrame(radarFrames.length - 4);
    }

    console.log('[WeatherBuster] Radar refreshed');
}

/**
 * Set up radar control event listeners
 */
function setupRadarControls() {
    const playBtn = document.getElementById('radar-play-btn');
    const slider = document.getElementById('radar-slider');
    let isDragging = false;
    let lastFrameTime = 0;

    if (playBtn) {
        playBtn.addEventListener('click', toggleRadarAnimation);
    }

    if (slider) {
        // Smooth frame update with throttling
        const updateFrame = (value) => {
            const now = performance.now();
            // Throttle to ~30fps for smooth feel without overwhelming
            if (now - lastFrameTime > 33) {
                showRadarFrame(parseInt(value, 10));
                lastFrameTime = now;
            }
        };

        // Start dragging - pause animation once
        slider.addEventListener('mousedown', () => {
            isDragging = true;
            pauseRadarAnimation();
        });

        slider.addEventListener('touchstart', () => {
            isDragging = true;
            pauseRadarAnimation();
        }, { passive: true });

        // Handle continuous dragging - update frame smoothly
        slider.addEventListener('input', (e) => {
            if (!isDragging) {
                pauseRadarAnimation();
            }
            updateFrame(e.target.value);
        });

        // End dragging
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Final update to ensure we're on exact frame
                showRadarFrame(parseInt(slider.value, 10));
            }
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                showRadarFrame(parseInt(slider.value, 10));
            }
        });

        // Handle click on track - calculate position and set value
        slider.addEventListener('click', (e) => {
            if (isDragging) return; // Don't double-handle if dragging

            const rect = slider.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const max = parseInt(slider.max, 10) || 14;
            const min = parseInt(slider.min, 10) || 0;
            const value = Math.round(min + percent * (max - min));

            slider.value = value;
            pauseRadarAnimation();
            showRadarFrame(value);
        });
    }

    // Set up click handler for map section to open fullscreen
    const mapSection = document.querySelector('.map-section-inline');
    if (mapSection) {
        mapSection.addEventListener('click', (e) => {
            // Don't open fullscreen if clicking on controls
            if (e.target.closest('.radar-controls')) return;
            openFullscreenRadar();
        });
    }

    // Set up fullscreen radar controls
    setupFullscreenRadarControls();
}

// =============================================================================
// FULLSCREEN RADAR FUNCTIONS
// =============================================================================

/**
 * Open fullscreen radar view
 */
function openFullscreenRadar() {
    const modal = document.getElementById('fullscreen-radar');
    if (!modal) return;

    // Pause inline radar animation
    pauseRadarAnimation();

    // Show modal
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    isFullscreenRadarOpen = true;

    // Initialize fullscreen map if not already done
    if (!fullscreenRadarMap) {
        initializeFullscreenRadarMap();
    } else {
        // Sync map position with main map
        if (weatherMap) {
            const center = weatherMap.getCenter();
            const zoom = weatherMap.getZoom();
            fullscreenRadarMap.setView(center, zoom);
        }
        fullscreenRadarMap.invalidateSize();
    }

    // Sync current frame
    showFullscreenRadarFrame(currentFrameIndex);
    updateFullscreenRadarControls();

    console.log('[WeatherBuster] Fullscreen radar opened');
}

/**
 * Close fullscreen radar view
 */
function closeFullscreenRadar() {
    const modal = document.getElementById('fullscreen-radar');
    if (!modal) return;

    // Pause fullscreen animation
    pauseFullscreenRadarAnimation();

    // Hide modal
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    isFullscreenRadarOpen = false;

    // Recenter main map on current location
    if (weatherMap && currentLocation) {
        weatherMap.setView([currentLocation.latitude, currentLocation.longitude], 10);
    }

    // Sync frame index back to main radar
    showRadarFrame(currentFrameIndex);

    console.log('[WeatherBuster] Fullscreen radar closed');
}

/**
 * Initialize the fullscreen radar map
 */
function initializeFullscreenRadarMap() {
    const mapContainer = document.getElementById('fullscreen-radar-map');
    if (!mapContainer || typeof L === 'undefined') return;

    // Get current position from main map
    let center = [39.8283, -98.5795];
    let zoom = 6;

    if (weatherMap) {
        center = weatherMap.getCenter();
        zoom = weatherMap.getZoom();
    } else if (currentLocation) {
        center = [currentLocation.latitude, currentLocation.longitude];
        zoom = 8;
    }

    // Create fullscreen map with full interactivity
    fullscreenRadarMap = L.map('fullscreen-radar-map', {
        center: center,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true
    });

    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(fullscreenRadarMap);

    // Create radar layers for fullscreen map
    createFullscreenRadarLayers();

    // Add location marker if we have a location
    if (currentLocation) {
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="
                background-color: #1e88e5;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        L.marker([currentLocation.latitude, currentLocation.longitude], { icon: customIcon })
            .addTo(fullscreenRadarMap);
    }

    console.log('[WeatherBuster] Fullscreen radar map initialized');
}

/**
 * Create radar layers for fullscreen map
 */
function createFullscreenRadarLayers() {
    // Clear existing layers
    fullscreenRadarLayers.forEach(layer => {
        if (fullscreenRadarMap && fullscreenRadarMap.hasLayer(layer)) {
            fullscreenRadarMap.removeLayer(layer);
        }
    });
    fullscreenRadarLayers = [];

    // Create a layer for each frame
    radarFrames.forEach((frame) => {
        const layer = L.tileLayer(RAINVIEWER_TILE_URL.replace('{path}', frame.path), {
            opacity: 0,
            attribution: 'Radar: <a href="https://www.rainviewer.com/">RainViewer</a>',
            maxZoom: 18,
            zIndex: 100
        });
        fullscreenRadarLayers.push(layer);
    });

    // Preload all frames for smooth animation
    fullscreenRadarLayers.forEach(layer => {
        layer.addTo(fullscreenRadarMap);
    });
}

/**
 * Show a specific radar frame on fullscreen map
 * @param {number} index - Frame index to show
 */
function showFullscreenRadarFrame(index) {
    if (!isFullscreenRadarOpen || fullscreenRadarLayers.length === 0) return;

    // Clamp index
    index = Math.max(0, Math.min(index, fullscreenRadarLayers.length - 1));
    currentFrameIndex = index;

    // Hide all layers, show selected one
    fullscreenRadarLayers.forEach((layer, i) => {
        if (i === index) {
            if (!fullscreenRadarMap.hasLayer(layer)) {
                layer.addTo(fullscreenRadarMap);
            }
            layer.setOpacity(0.6);
        } else {
            layer.setOpacity(0);
        }
    });

    // Update controls
    updateFullscreenRadarControls();

    // Also update main radar controls to stay in sync
    updateRadarControls();
}

/**
 * Update fullscreen radar control UI
 */
function updateFullscreenRadarControls() {
    const slider = document.getElementById('fullscreen-radar-slider');
    const timestamp = document.getElementById('fullscreen-radar-timestamp');
    const playBtn = document.getElementById('fullscreen-radar-play-btn');

    if (slider) {
        slider.value = currentFrameIndex;
        slider.max = radarFrames.length - 1;
    }

    if (timestamp && radarFrames[currentFrameIndex]) {
        const frame = radarFrames[currentFrameIndex];
        const date = new Date(frame.time * 1000);
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const isPast = currentFrameIndex < radarFrames.length - 3;
        const label = isPast ? '' : ' (Forecast)';
        timestamp.textContent = timeStr + label;
    }

    if (playBtn) {
        playBtn.classList.toggle('playing', isFullscreenRadarPlaying);
        playBtn.setAttribute('aria-label', isFullscreenRadarPlaying ? 'Pause radar animation' : 'Play radar animation');
    }
}

// Fullscreen radar animation state
let fullscreenRadarAnimationInterval = null;
let isFullscreenRadarPlaying = false;

/**
 * Play fullscreen radar animation
 */
function playFullscreenRadarAnimation() {
    if (fullscreenRadarAnimationInterval) {
        clearInterval(fullscreenRadarAnimationInterval);
    }

    isFullscreenRadarPlaying = true;
    updateFullscreenRadarControls();

    fullscreenRadarAnimationInterval = setInterval(() => {
        let nextIndex = currentFrameIndex + 1;
        if (nextIndex >= radarFrames.length) {
            nextIndex = 0;
        }
        showFullscreenRadarFrame(nextIndex);
    }, 500);
}

/**
 * Pause fullscreen radar animation
 */
function pauseFullscreenRadarAnimation() {
    if (fullscreenRadarAnimationInterval) {
        clearInterval(fullscreenRadarAnimationInterval);
        fullscreenRadarAnimationInterval = null;
    }
    isFullscreenRadarPlaying = false;
    updateFullscreenRadarControls();
}

/**
 * Toggle fullscreen radar animation
 */
function toggleFullscreenRadarAnimation() {
    if (isFullscreenRadarPlaying) {
        pauseFullscreenRadarAnimation();
    } else {
        playFullscreenRadarAnimation();
    }
}

/**
 * Set up fullscreen radar control event listeners
 */
function setupFullscreenRadarControls() {
    const closeBtn = document.getElementById('fullscreen-radar-close');
    const playBtn = document.getElementById('fullscreen-radar-play-btn');
    const slider = document.getElementById('fullscreen-radar-slider');
    let isDragging = false;
    let lastFrameTime = 0;

    if (closeBtn) {
        closeBtn.addEventListener('click', closeFullscreenRadar);
    }

    if (playBtn) {
        playBtn.addEventListener('click', toggleFullscreenRadarAnimation);
    }

    if (slider) {
        const updateFrame = (value) => {
            const now = performance.now();
            if (now - lastFrameTime > 33) {
                showFullscreenRadarFrame(parseInt(value, 10));
                lastFrameTime = now;
            }
        };

        slider.addEventListener('mousedown', () => {
            isDragging = true;
            pauseFullscreenRadarAnimation();
        });

        slider.addEventListener('touchstart', () => {
            isDragging = true;
            pauseFullscreenRadarAnimation();
        }, { passive: true });

        slider.addEventListener('input', (e) => {
            if (!isDragging) {
                pauseFullscreenRadarAnimation();
            }
            updateFrame(e.target.value);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging && isFullscreenRadarOpen) {
                isDragging = false;
                showFullscreenRadarFrame(parseInt(slider.value, 10));
            }
        });

        document.addEventListener('touchend', () => {
            if (isDragging && isFullscreenRadarOpen) {
                isDragging = false;
                showFullscreenRadarFrame(parseInt(slider.value, 10));
            }
        });

        slider.addEventListener('click', (e) => {
            if (isDragging) return;

            const rect = slider.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const max = parseInt(slider.max, 10) || 14;
            const min = parseInt(slider.min, 10) || 0;
            const value = Math.round(min + percent * (max - min));

            slider.value = value;
            pauseFullscreenRadarAnimation();
            showFullscreenRadarFrame(value);
        });
    }

    // Close fullscreen radar with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullscreenRadarOpen) {
            closeFullscreenRadar();
        }
    });
}

// =============================================================================
// TIME MACHINE FUNCTIONS
// =============================================================================

/**
 * Get weather info from WMO code
 * @param {number} code - WMO weather code
 * @param {number} hour - Hour of day (0-23) to determine day/night
 * @returns {Object} Weather info with description, icon, and category
 */
function getWMOWeatherInfo(code, hour) {
    const isDaytime = hour >= 6 && hour < 20;
    const info = WMO_WEATHER_CODES[code] || WMO_WEATHER_CODES[0];
    return {
        description: info.description,
        icon: isDaytime ? info.icon.day : info.icon.night,
        category: info.category
    };
}

/**
 * Get valid date range for Time Machine
 * @returns {{min: string, max: string}} Min and max dates in YYYY-MM-DD format
 */
function getValidDateRange() {
    const today = new Date();

    // Max date: 3 days ago (to ensure data availability)
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() - 3);

    // Min date: January 1, 1940
    const minDate = new Date(1940, 0, 1);

    return {
        min: minDate.toISOString().split('T')[0],
        max: maxDate.toISOString().split('T')[0]
    };
}

/**
 * Fetch historical weather data from Open-Meteo
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Historical weather data
 */
async function fetchHistoricalWeather(lat, lon, date) {
    const params = new URLSearchParams({
        latitude: lat.toFixed(4),
        longitude: lon.toFixed(4),
        start_date: date,
        end_date: date,
        hourly: [
            'temperature_2m',
            'apparent_temperature',
            'precipitation_probability',
            'precipitation',
            'weather_code',
            'cloud_cover',
            'wind_speed_10m',
            'wind_direction_10m',
            'relative_humidity_2m'
        ].join(','),
        daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'weather_code'
        ].join(','),
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        timezone: 'auto'
    });

    const url = `${OPEN_METEO_HISTORICAL_API}?${params.toString()}`;
    console.log('[WeatherBuster] Fetching historical weather:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[WeatherBuster] Historical API error:', errorText);
            throw new Error('Failed to fetch historical weather data');
        }

        const data = await response.json();
        console.log('[WeatherBuster] Historical data received:', data);

        if (data.error) {
            throw new Error(data.reason || 'Historical data not available');
        }

        return data;
    } catch (error) {
        console.error('[WeatherBuster] Error fetching historical weather:', error);
        throw error;
    }
}

/**
 * Enter Time Machine mode with the selected date
 * @param {string} date - Date in YYYY-MM-DD format
 */
async function enterTimeMachineMode(date) {
    if (!currentLocation) {
        showError('Please select a location first');
        return;
    }

    console.log('[WeatherBuster] Entering Time Machine mode for:', date);

    try {
        showContentLoading();

        // Fetch historical data
        historicalData = await fetchHistoricalWeather(
            currentLocation.latitude,
            currentLocation.longitude,
            date
        );

        // Set state
        isTimeMachineMode = true;
        timeMachineDate = date;

        // Update UI
        document.body.setAttribute('data-mode', 'historical');

        // Update banner with date
        const banner = document.getElementById('time-machine-banner');
        if (banner) {
            const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            banner.querySelector('.time-machine-banner-date').textContent = displayDate;
            banner.hidden = false;
        }

        // Show the Time Machine UI as active
        const timeMachineSection = document.getElementById('time-machine-section');
        if (timeMachineSection) {
            timeMachineSection.classList.add('active');
        }

        // Render historical data
        renderHistoricalConditions();
        renderHistoricalHourlyForecast();

        hideContentLoading();

    } catch (error) {
        console.error('[WeatherBuster] Time Machine error:', error);
        hideContentLoading();
        showError(error.message || 'Failed to load historical weather data');
        exitTimeMachineMode();
    }
}

/**
 * Exit Time Machine mode and return to current weather
 */
function exitTimeMachineMode() {
    console.log('[WeatherBuster] Exiting Time Machine mode');

    // Clear state
    isTimeMachineMode = false;
    timeMachineDate = null;
    historicalData = null;

    // Update UI
    document.body.removeAttribute('data-mode');

    // Hide banner
    const banner = document.getElementById('time-machine-banner');
    if (banner) {
        banner.hidden = true;
    }

    // Reset Time Machine UI
    const timeMachineSection = document.getElementById('time-machine-section');
    if (timeMachineSection) {
        timeMachineSection.classList.remove('active');
    }

    // Clear date picker
    const datePicker = document.getElementById('time-machine-date');
    if (datePicker) {
        datePicker.value = '';
    }

    // Restore hourly section title
    const sectionTitle = document.querySelector('#hourly-forecast .section-title');
    if (sectionTitle) {
        sectionTitle.innerHTML = 'Next 12 Hours <span class="hourly-precip-summary" id="hourly-precip-summary"></span>';
    }

    // Re-render current weather if we have data
    if (window.weatherData) {
        renderCurrentConditions();
        renderHourlyForecast();
        render7DayForecast();
        renderAlerts();
    }
}

/**
 * Render historical conditions in the hero section
 */
function renderHistoricalConditions() {
    if (!historicalData || !historicalData.daily) {
        console.warn('[WeatherBuster] No historical data to render');
        return;
    }

    const daily = historicalData.daily;
    const hourly = historicalData.hourly;

    // Get midday values (around noon) for representative conditions
    const noonIndex = 12; // Assuming hourly data starts at midnight

    // Get temperature - use max temp as "current" for historical
    const maxTemp = daily.temperature_2m_max?.[0];
    const minTemp = daily.temperature_2m_min?.[0];
    const avgTemp = maxTemp && minTemp ? Math.round((maxTemp + minTemp) / 2) : '--';

    // Update hero temperature
    const tempEl = document.getElementById('current-temp');
    if (tempEl) {
        tempEl.textContent = typeof maxTemp === 'number' ? Math.round(maxTemp) : '--';
    }

    // Get weather code and icon
    const weatherCode = hourly?.weather_code?.[noonIndex] ?? daily.weather_code?.[0] ?? 0;
    const weatherInfo = getWMOWeatherInfo(weatherCode, 12);

    // Update hero icon
    const heroIcon = document.getElementById('hero-icon');
    if (heroIcon) {
        heroIcon.textContent = weatherInfo.icon;
    }

    // Update feels like (use apparent temperature from noon if available)
    const feelsLikeEl = document.getElementById('feels-like');
    if (feelsLikeEl) {
        const feelsLike = hourly?.apparent_temperature?.[noonIndex];
        feelsLikeEl.textContent = typeof feelsLike === 'number' ? Math.round(feelsLike) : '--';
    }

    // Update summary
    const summaryEl = document.getElementById('hero-summary');
    if (summaryEl) {
        const precip = daily.precipitation_sum?.[0] ?? 0;
        let summary = weatherInfo.description;
        if (precip > 0) {
            summary += ` • ${precip.toFixed(2)} in precipitation`;
        }
        summary += ` • High: ${Math.round(maxTemp)}° / Low: ${Math.round(minTemp)}°`;
        summaryEl.textContent = summary;
    }
}

/**
 * Render historical hourly forecast
 */
function renderHistoricalHourlyForecast() {
    if (!historicalData || !historicalData.hourly) {
        console.warn('[WeatherBuster] No hourly historical data to render');
        return;
    }

    const container = document.querySelector('#hourly-forecast .hourly-timeline');
    if (!container) return;

    const hourly = historicalData.hourly;
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const feelsLike = hourly.apparent_temperature || [];
    const precipProb = hourly.precipitation_probability || [];
    const weatherCodes = hourly.weather_code || [];

    // Build hourly data array
    const hourlyData = [];

    for (let i = 0; i < times.length && i < 24; i++) {
        const time = new Date(times[i]);
        const hour = time.getHours();
        const weatherInfo = getWMOWeatherInfo(weatherCodes[i] || 0, hour);

        hourlyData.push({
            time: time,
            temp: typeof temps[i] === 'number' ? Math.round(temps[i]) : '--',
            feelsLike: typeof feelsLike[i] === 'number' ? Math.round(feelsLike[i]) : '--',
            precipProb: precipProb[i] || 0,
            icon: weatherInfo.icon,
            condition: weatherInfo.description,
            category: weatherInfo.category,
            isNow: false
        });
    }

    // Cache for re-rendering on toggle
    hourlyDataCache = hourlyData;

    // Calculate condition spans
    const conditionSpans = calculateConditionSpans(hourlyData);

    // Render the timeline
    renderHourlyTimeline(container, hourlyData, conditionSpans);

    // Update section title
    const sectionTitle = document.querySelector('#hourly-forecast .section-title');
    if (sectionTitle) {
        sectionTitle.innerHTML = '24-Hour Historical <span class="hourly-precip-summary" id="hourly-precip-summary"></span>';
    }
}

/**
 * Set up Time Machine event listeners
 */
function setupTimeMachineEventListeners() {
    const datePicker = document.getElementById('time-machine-date');
    const goButton = document.getElementById('time-machine-go');
    const returnButton = document.getElementById('time-machine-return');
    const toggleButton = document.getElementById('time-machine-toggle');

    // Set date picker constraints
    if (datePicker) {
        const range = getValidDateRange();
        datePicker.min = range.min;
        datePicker.max = range.max;

        // Handle date selection
        datePicker.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                enterTimeMachineMode(selectedDate);
            }
        });
    }

    // Go button click
    if (goButton) {
        goButton.addEventListener('click', () => {
            const selectedDate = datePicker?.value;
            if (selectedDate) {
                enterTimeMachineMode(selectedDate);
            } else {
                showError('Please select a date');
            }
        });
    }

    // Return to today button
    if (returnButton) {
        returnButton.addEventListener('click', () => {
            exitTimeMachineMode();
        });
    }

    // Toggle button to show/hide date picker
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const section = document.getElementById('time-machine-section');
            if (section) {
                section.classList.toggle('expanded');
            }
        });
    }

    console.log('[WeatherBuster] Time Machine event listeners set up');
}

// =============================================================================
// EXPORTS (for potential module usage or testing)
// =============================================================================

// Expose key functions globally for debugging and potential external use
window.WeatherBuster = {
    // Geocoding functions
    geocodeLocation,
    reverseGeocode,
    getCurrentPosition,
    // Location storage
    saveLocation,
    loadSavedLocation,
    // UI helpers
    showLoading,
    hideLoading,
    showError,
    hideError,
    // Event handlers
    handleGeolocation,
    // NWS API functions
    getGridPoint,
    getGridpointData,
    getForecast,
    getAlerts,
    fetchWeatherData,
    // Weather code translation
    translateWeatherCode,
    WEATHER_CODES,
    PROBABILITY_CODES,
    INTENSITY_CODES,
    // Rendering helper functions
    getWeatherIcon,
    getTempClass,
    formatTime,
    formatDate,
    getCurrentValue,
    // Rendering functions
    renderCurrentConditions,
    renderPrecipitationSummary,
    renderHourlyForecast,
    renderHourlyTimeline,
    getConditionCategory,
    getConditionText,
    calculateConditionSpans,
    setupHourlyToggles,
    render7DayForecast,
    setupDailyItemExpansion,
    renderDayHourlyChart,
    renderDayChartTimeline,
    renderAlerts,
    showAlertModal,
    toggleAlertDetails,
    toggleAlertExpand,
    // Map functions
    initializeMap,
    handleMapClick,
    updateMapMarker,
    centerMapOn,
    // Radar functions
    initializeRadarLayer,
    fetchRadarFrames,
    enableRadar,
    toggleRadar,
    refreshRadar,
    showRadarFrame,
    playRadarAnimation,
    pauseRadarAnimation,
    toggleRadarAnimation,
    // Settings functions
    initializeTheme,
    setDarkMode,
    openSettings,
    closeSettings,
    // Fullscreen radar functions
    openFullscreenRadar,
    closeFullscreenRadar,
    toggleFullscreenRadarAnimation,
    showFullscreenRadarFrame,
    // Time Machine functions
    getWMOWeatherInfo,
    getValidDateRange,
    fetchHistoricalWeather,
    enterTimeMachineMode,
    exitTimeMachineMode,
    renderHistoricalConditions,
    renderHistoricalHourlyForecast,
    setupTimeMachineEventListeners,
    isTimeMachineMode: () => isTimeMachineMode,
    timeMachineDate: () => timeMachineDate
};

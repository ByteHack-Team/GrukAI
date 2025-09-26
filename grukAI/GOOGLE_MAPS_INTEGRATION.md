# Google Maps Integration Setup

## Overview
The Dashboard component now uses Google Maps API to fetch the user's current location and find nearby recycling facilities in real-time.

## Features
- **Real-time Location**: Gets user's current GPS coordinates
- **Nearby Search**: Finds recycling centers, waste management facilities, and environmental facilities within 10km radius
- **Smart Fallback**: Falls back to mock data if location access is denied or API fails
- **Privacy Control**: Users can toggle location sharing in Settings
- **Real Distance Calculation**: Shows actual distance to facilities
- **Facility Ratings**: Displays Google Places ratings when available

## API Requirements

### Required Google Cloud APIs
1. **Maps JavaScript API** - For loading Google Maps services
2. **Places API** - For searching nearby facilities
3. **Geolocation API** - For getting user location

### Setup Instructions
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the required APIs mentioned above
4. Create an API key in Credentials section
5. Add your API key to `.env` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### API Key Restrictions (Recommended)
- Restrict to specific domains for production
- Limit to required APIs only
- Set usage quotas to control costs

## How It Works

1. **Location Request**: When Dashboard loads, it requests user's location
2. **Permission Handling**: Handles all permission states (granted, denied, unavailable)
3. **Places Search**: Uses Google Places API to find nearby facilities
4. **Data Processing**: Processes results, calculates distances, assigns appropriate icons
5. **Fallback**: Shows sample data if real location data unavailable

## Privacy Features
- Location sharing can be toggled in Settings
- Clear error messages for location access issues
- Graceful fallback to sample data
- No location data stored permanently

## Error Handling
- Permission denied → Shows sample locations
- API failure → Falls back to mock data  
- Network issues → Retry functionality with refresh button
- Invalid API key → Console warnings with fallback

## Performance
- Caches location for 5 minutes to avoid repeated requests
- Limits search results to 5 closest facilities
- Asynchronous loading with loading states
- Optimized API calls with proper error handling

## Future Enhancements
- Add facility photos from Google Places
- Include opening hours information  
- Add facility reviews and contact info
- Implement offline caching
- Add navigation integration

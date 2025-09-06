import React, { createContext, useContext, useState, useEffect } from 'react';

// Default location - Bangalore (VIT area) - Prime potato growing region nearby
const DEFAULT_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  name: 'Bangalore, Karnataka',
  type: 'city',
  isDefault: true,
  hasValidCoordinates: true
};

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('selectedLocation');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
    return DEFAULT_LOCATION;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [gpsAvailable, setGpsAvailable] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Check GPS availability on mount
  useEffect(() => {
    setGpsAvailable('geolocation' in navigator);
  }, []);

  // Save to localStorage whenever location changes
  useEffect(() => {
    localStorage.setItem('selectedLocation', JSON.stringify(currentLocation));
    console.log('📍 Location updated:', currentLocation);
  }, [currentLocation]);

  const updateLocation = (newLocation) => {
    // Ensure location has valid coordinates for Google Earth Engine
    const validatedLocation = {
      ...newLocation,
      hasValidCoordinates: Boolean(newLocation.lat && newLocation.lng && 
        !isNaN(newLocation.lat) && !isNaN(newLocation.lng) &&
        newLocation.lat >= -90 && newLocation.lat <= 90 &&
        newLocation.lng >= -180 && newLocation.lng <= 180)
    };
    
    setCurrentLocation(validatedLocation);
    setLocationError(null);
    
    console.log('📍 Location updated with validation:', validatedLocation);
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setIsLoading(true);
      setLocationError(null);

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Try to get location name using reverse geocoding
            let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            
            // Attempt to get a readable name
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
              );
              if (response.ok) {
                const data = await response.json();
                if (data.city && data.principalSubdivision) {
                  locationName = `${data.city}, ${data.principalSubdivision}`;
                } else if (data.locality) {
                  locationName = data.locality;
                }
              }
            } catch (geocodeError) {
              console.warn('Reverse geocoding failed, using coordinates:', geocodeError);
            }
            
            const newLocation = {
              lat,
              lng,
              name: locationName,
              type: 'current',
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };
            
            setCurrentLocation(newLocation);
            setIsLoading(false);
            resolve(newLocation);
          } catch (error) {
            setLocationError('Failed to process location data');
            setIsLoading(false);
            reject(error);
          }
        },
        (error) => {
          let errorMessage = 'Failed to get current location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Using default location for satellite data.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'GPS unavailable. Using default location for satellite analysis.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using default location.';
              break;
            default:
              errorMessage = 'Location service unavailable. Using default location.';
              break;
          }
          
          console.warn(`🗺️ GPS Error: ${errorMessage}`);
          
          // Auto-fallback to default location instead of leaving user stranded
          console.log('🗺️ Auto-falling back to default location to ensure satellite services work');
          setCurrentLocation({
            ...DEFAULT_LOCATION,
            type: 'default-fallback',
            fallbackReason: errorMessage
          });
          
          setLocationError(errorMessage);
          setIsLoading(false);
          
          // Don't reject - instead resolve with default location
          resolve({
            ...DEFAULT_LOCATION,
            type: 'default-fallback',
            fallbackReason: errorMessage
          });
        },
        options
      );
    });
  };

  const requestLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.warn('Could not query geolocation permission:', error);
      return 'prompt';
    }
  };

  const getValidCoordinates = () => {
    // Always return valid coordinates for Google Earth Engine
    if (currentLocation?.hasValidCoordinates) {
      return {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        name: currentLocation.name,
        type: currentLocation.type
      };
    }
    
    // Fallback to default if current location is invalid
    console.log('🗺️ Using default coordinates for satellite services');
    return {
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.lng,
      name: DEFAULT_LOCATION.name,
      type: 'default-coordinates'
    };
  };

  const ensureValidLocation = () => {
    // Ensure we always have a valid location for satellite services
    if (!currentLocation || !currentLocation.hasValidCoordinates) {
      console.log('🗺️ No valid location found, setting default for satellite services');
      setCurrentLocation({
        ...DEFAULT_LOCATION,
        type: 'auto-default',
        reason: 'Ensuring satellite services have valid coordinates'
      });
    }
  };

  const resetToDefault = () => {
    setCurrentLocation({
      ...DEFAULT_LOCATION,
      type: 'manual-reset'
    });
    setLocationError(null);
  };

  const refreshLocation = async () => {
    if (currentLocation?.type === 'current') {
      try {
        await getCurrentPosition();
      } catch (error) {
        console.error('Failed to refresh location:', error);
        // Ensure we still have valid coordinates even if refresh fails
        ensureValidLocation();
      }
    }
  };

  // Auto-ensure valid location on context initialization
  useEffect(() => {
    // Give a brief moment for location to load, then ensure we have valid coordinates
    const timer = setTimeout(() => {
      ensureValidLocation();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const value = {
    currentLocation,
    updateLocation,
    resetToDefault,
    isLoading,
    setIsLoading,
    gpsAvailable,
    locationError,
    getCurrentPosition,
    requestLocationPermission,
    refreshLocation,
    getValidCoordinates,
    ensureValidLocation,
    DEFAULT_LOCATION
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;

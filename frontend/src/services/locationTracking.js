// Browser-based geolocation tracking service for mobile web users

let trackingInterval = null;
let watchId = null;

const TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const API_URL = process.env.REACT_APP_BACKEND_URL;

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.lastPosition = null;
  }

  // Start automatic location tracking
  async startTracking(token) {
    if (!navigator.geolocation) {
      return { success: false, message: 'Geolocation not supported' };
    }

    try {
      // Request permission and get initial position
      const position = await this.getCurrentPosition();
      
      // Send initial location
      await this.sendLocation(position, token);
      
      // Start periodic tracking
      this.isTracking = true;
      
      // Use watchPosition for real-time updates (more battery efficient than interval)
      watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position, token),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: false, // Battery-friendly
          timeout: 30000,
          maximumAge: TRACKING_INTERVAL
        }
      );

      // Also use interval as backup
      trackingInterval = setInterval(() => {
        this.updateLocation(token);
      }, TRACKING_INTERVAL);

      return { success: true };
    } catch (error) {
      // Permission denied or geolocation unavailable is a normal browser state, not an error
      console.warn('Location tracking unavailable:', error?.message || error);
      return { success: false, message: error?.message || 'Geolocation unavailable' };
    }
  }

  // Get current position as promise
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  }

  // Handle position updates from watchPosition
  async handlePositionUpdate(position, token) {
    // Only send if position changed significantly (>50 meters)
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.coords.latitude,
        this.lastPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );
      
      if (distance < 0.05) { // Less than 50 meters
        return; // Don't send duplicate positions
      }
    }

    this.lastPosition = position;
    await this.sendLocation(position, token);
  }

  // Handle position errors
  handlePositionError(error) {
    // Don't alert user - silent tracking
  }

  // Calculate distance between two coordinates (in km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Update location manually
  async updateLocation(token) {
    try {
      const position = await this.getCurrentPosition();
      await this.sendLocation(position, token);
    } catch (error) {
    }
  }

  // Send location to backend
  async sendLocation(position, token) {
    try {
      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        })
      });

      if (response.ok) {
      }
    } catch (error) {
      console.error('Failed to send location:', error);
      // Store in IndexedDB for retry when online
      this.storeOfflineLocation(position);
    }
  }

  // Store location offline for later sync
  storeOfflineLocation(position) {
    const offlineLocations = JSON.parse(localStorage.getItem('offline_locations') || '[]');
    offlineLocations.push({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp).toISOString()
    });
    localStorage.setItem('offline_locations', JSON.stringify(offlineLocations));
  }

  // Sync offline locations when back online
  async syncOfflineLocations(token) {
    const offlineLocations = JSON.parse(localStorage.getItem('offline_locations') || '[]');
    
    if (offlineLocations.length === 0) return;

    try {
      for (const location of offlineLocations) {
        await fetch(`${API_URL}/api/locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(location)
        });
      }
      
      // Clear synced locations
      localStorage.removeItem('offline_locations');
    } catch (error) {
      console.error('Failed to sync offline locations:', error);
    }
  }

  // Stop tracking
  stopTracking() {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    
    this.isTracking = false;
  }
}

export default new LocationTrackingService();

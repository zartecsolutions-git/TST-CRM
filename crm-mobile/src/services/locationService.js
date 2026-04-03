import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationAPI } from './api';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    try {
      await locationAPI.updateLocation(
        location.coords.latitude,
        location.coords.longitude
      );
      console.log('Location updated:', location.coords);
    } catch (err) {
      console.error('Failed to send location:', err);
    }
  }
});

export const requestLocationPermissions = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    return { success: false, message: 'Foreground location permission denied' };
  }
  
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  if (backgroundStatus !== 'granted') {
    return { success: false, message: 'Background location permission denied' };
  }
  
  return { success: true, message: 'Location permissions granted' };
};

export const startLocationTracking = async () => {
  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000, // Update every 1 minute
      distanceInterval: 50, // Or every 50 meters
      foregroundService: {
        notificationTitle: 'CRM Location Tracking',
        notificationBody: 'Your location is being shared',
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to start location tracking:', error);
    return { success: false, error: error.message };
  }
};

export const stopLocationTracking = async () => {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to stop location tracking:', error);
    return { success: false, error: error.message };
  }
};

export const isLocationTrackingActive = async () => {
  return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
};

import { Capacitor } from "@capacitor/core";

/**
 * Get current user location using Capacitor Geolocation or browser API
 * Tries with high accuracy first, then falls back to standard accuracy if timeout
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>}
 */
export async function getCurrentLocation() {
  // Check if we're running on a native platform
  if (Capacitor.isNativePlatform()) {
    return getNativeLocation();
  }
  
  // Web browser - use navigator.geolocation
  return getBrowserLocation();
}

/**
 * Get location using Capacitor Geolocation plugin (for native apps)
 */
async function getNativeLocation() {
  try {
    // Dynamically import Capacitor Geolocation to avoid issues if not installed
    const { Geolocation } = await import("@capacitor/geolocation");
    
    // Check and request permissions first
    let permissionStatus = await Geolocation.checkPermissions();
    console.log("[Geolocation] Permission status:", permissionStatus);
    
    if (permissionStatus.location !== "granted") {
      // Request permission
      permissionStatus = await Geolocation.requestPermissions();
      console.log("[Geolocation] Permission after request:", permissionStatus);
      
      if (permissionStatus.location !== "granted") {
        throw new Error("הרשאת מיקום לא אושרה. אנא אשר גישה למיקום בהגדרות.");
      }
    }
    
    // Get current position with high accuracy
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
    
    console.log("[Geolocation] Got position:", position);
    
    return {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error("[Geolocation] Native location error:", error);
    
    // If Capacitor Geolocation fails, try fallback to browser API
    console.log("[Geolocation] Trying browser API fallback...");
    try {
      return await getBrowserLocation();
    } catch (fallbackError) {
      // If both fail, throw a user-friendly error
      throw new Error("לא הצלחנו לקבל את המיקום. אנא ודא שהרשאת המיקום מופעלת.");
    }
  }
}

/**
 * Get location using browser navigator.geolocation API
 */
function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation not supported"));
    }

    // First try with high accuracy (more accurate but slower)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ lat: latitude, lon: longitude, accuracy });
      },
      (err) => {
        // If timeout or position unavailable, try again with lower accuracy (faster)
        if (err.code === 3 || err.code === 2) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              resolve({ lat: latitude, lon: longitude, accuracy });
            },
            (fallbackErr) => {
              reject(fallbackErr);
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
          );
        } else {
          // For other errors (permission denied), reject immediately
          reject(err);
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

/**
 * Calculate distance between two positions in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter out outlier positions (positions that are too far from the cluster)
 */
function filterOutliers(positions) {
  if (positions.length <= 2) {
    return positions;
  }

  // Calculate median position
  const sortedLats = positions.map((p) => p.lat).sort((a, b) => a - b);
  const sortedLons = positions.map((p) => p.lon).sort((a, b) => a - b);
  const medianLat =
    sortedLats.length % 2 === 0
      ? (sortedLats[sortedLats.length / 2 - 1] +
          sortedLats[sortedLats.length / 2]) /
        2
      : sortedLats[Math.floor(sortedLats.length / 2)];
  const medianLon =
    sortedLons.length % 2 === 0
      ? (sortedLons[sortedLons.length / 2 - 1] +
          sortedLons[sortedLons.length / 2]) /
        2
      : sortedLons[Math.floor(sortedLons.length / 2)];

  // Calculate distances from median
  const distances = positions.map((p) =>
    calculateDistance(medianLat, medianLon, p.lat, p.lon)
  );

  // Calculate median distance
  const sortedDistances = distances.sort((a, b) => a - b);
  const medianDistance =
    sortedDistances.length % 2 === 0
      ? (sortedDistances[sortedDistances.length / 2 - 1] +
          sortedDistances[sortedDistances.length / 2]) /
        2
      : sortedDistances[Math.floor(sortedDistances.length / 2)];

  // Filter positions that are within 2x median distance (or 100m, whichever is larger)
  const threshold = Math.max(medianDistance * 2, 100);
  const filtered = positions.filter((p, i) => distances[i] <= threshold);

  if (filtered.length < positions.length) {
  }

  return filtered.length > 0 ? filtered : positions;
}

/**
 * Calculate the best position from collected positions
 * Strategy:
 * 1. Filter out outliers
 * 2. Prefer the most recent accurate position if it's very good (< 15m)
 * 3. If we have positions with accuracy < 20m, average only those
 * 4. If we have positions with accuracy < 50m, average those
 * 5. Otherwise, use weighted average (more weight to accurate positions)
 */
function calculateBestPosition(positions, bestPosition) {
  if (!positions || positions.length === 0) {
    return bestPosition;
  }

  // Filter out outliers first
  const filteredPositions = filterOutliers(positions);

  // Prefer the most recent position if it's very accurate (< 10m)
  const lastPosition = filteredPositions[filteredPositions.length - 1];
  if (lastPosition && lastPosition.accuracy < 10) {
    return lastPosition;
  }

  // Filter positions with very good accuracy (< 10m)
  const veryAccuratePositions = filteredPositions.filter(
    (p) => p.accuracy < 10
  );
  if (veryAccuratePositions.length >= 2) {
    // Average positions with very good accuracy
    const avgLat =
      veryAccuratePositions.reduce((sum, p) => sum + p.lat, 0) /
      veryAccuratePositions.length;
    const avgLon =
      veryAccuratePositions.reduce((sum, p) => sum + p.lon, 0) /
      veryAccuratePositions.length;
    const avgAccuracy =
      veryAccuratePositions.reduce((sum, p) => sum + p.accuracy, 0) /
      veryAccuratePositions.length;

    return { lat: avgLat, lon: avgLon, accuracy: avgAccuracy };
  }

  // Filter positions with decent accuracy (< 50m)
  const accuratePositions = filteredPositions.filter((p) => p.accuracy < 50);
  if (accuratePositions.length >= 3) {
    // Average positions with decent accuracy
    const avgLat =
      accuratePositions.reduce((sum, p) => sum + p.lat, 0) /
      accuratePositions.length;
    const avgLon =
      accuratePositions.reduce((sum, p) => sum + p.lon, 0) /
      accuratePositions.length;
    const avgAccuracy =
      accuratePositions.reduce((sum, p) => sum + p.accuracy, 0) /
      accuratePositions.length;

    return { lat: avgLat, lon: avgLon, accuracy: avgAccuracy };
  }

  // If we have multiple positions, use weighted average (more weight to accurate positions)
  if (filteredPositions.length >= 3) {
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLon = 0;
    let minAccuracy = Infinity;

    filteredPositions.forEach((p) => {
      // Weight is inverse of accuracy (more accurate = higher weight)
      // Use square to give even more weight to accurate positions
      const weight = 1 / Math.pow(p.accuracy + 1, 2);
      totalWeight += weight;
      weightedLat += p.lat * weight;
      weightedLon += p.lon * weight;
      if (p.accuracy < minAccuracy) {
        minAccuracy = p.accuracy;
      }
    });

    const avgLat = weightedLat / totalWeight;
    const avgLon = weightedLon / totalWeight;

    return { lat: avgLat, lon: avgLon, accuracy: minAccuracy };
  }

  // Fallback to best single position
  return bestPosition || filteredPositions[0];
}

/**
 * Get improved location by watching position for a specified duration
 * Uses best practices for maximum accuracy:
 * 1. Waits for high-accuracy positions (GPS lock)
 * 2. Prefers positions with accuracy < 10m
 * 3. Uses median of recent accurate positions to filter noise
 * 4. Only uses positions from the last 70% of the duration (after GPS has stabilized)
 * @param {number} duration - Duration in milliseconds to watch for better accuracy (default: 5000ms = 5 seconds)
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>}
 */
export async function getImprovedLocation(duration = 5000) {
  // For native platforms, use Capacitor Geolocation
  if (Capacitor.isNativePlatform()) {
    return getImprovedNativeLocation(duration);
  }
  
  // For web, use browser API
  return getImprovedBrowserLocation(duration);
}

/**
 * Get improved location on native platform using Capacitor Geolocation
 */
async function getImprovedNativeLocation(duration = 5000) {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    
    // Check permissions first
    let permissionStatus = await Geolocation.checkPermissions();
    if (permissionStatus.location !== "granted") {
      permissionStatus = await Geolocation.requestPermissions();
      if (permissionStatus.location !== "granted") {
        throw new Error("הרשאת מיקום לא אושרה");
      }
    }
    
    const positions = [];
    let bestPosition = null;
    const startTime = Date.now();
    const stabilizationTime = duration * 0.3;
    
    // Watch position for the specified duration
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: duration + 5000, maximumAge: 0 },
      (position, err) => {
        if (err) {
          console.error("[Geolocation] Watch error:", err);
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const pos = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          elapsed: elapsed,
        };
        
        positions.push(pos);
        
        if (!bestPosition || pos.accuracy < bestPosition.accuracy) {
          bestPosition = pos;
        }
      }
    );
    
    // Wait for duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Clear watch
    await Geolocation.clearWatch({ id: watchId });
    
    // Calculate best position
    const accuratePositions = positions.filter(p => 
      p.accuracy < 50 && p.elapsed >= stabilizationTime
    );
    
    const result = calculateBestPosition(
      accuratePositions.length > 0 ? accuratePositions : positions,
      bestPosition
    );
    
    return result || bestPosition || await getCurrentLocation();
    
  } catch (error) {
    console.error("[Geolocation] Native improved location error:", error);
    // Fallback to simple getCurrentLocation
    return getCurrentLocation();
  }
}

/**
 * Get improved location on web using browser API
 */
function getImprovedBrowserLocation(duration = 5000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation not supported"));
    }

    let bestPosition = null;
    const positions = []; // Store all positions for averaging
    const accuratePositions = []; // Store only positions with good accuracy
    let watchId = null;
    const startTime = Date.now();
    let positionCount = 0;
    let hasReceivedPosition = false;
    const stabilizationTime = duration * 0.3; // Use only positions from last 70% of duration

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        positionCount++;
        hasReceivedPosition = true;
        const elapsed = Date.now() - startTime;

        const pos = {
          lat: latitude,
          lon: longitude,
          accuracy: accuracy,
          timestamp: Date.now(),
          elapsed: elapsed,
        };

        // Store all positions
        positions.push(pos);

        // Store only positions with good accuracy (< 50m) and from after stabilization period
        if (accuracy < 50 && elapsed >= stabilizationTime) {
          accuratePositions.push(pos);
        }

        // Keep track of the most accurate position
        if (!bestPosition || accuracy < bestPosition.accuracy) {
          bestPosition = pos;
        }

        // Log progress every 2 seconds
        if (elapsed > 0 && elapsed % 2000 < 100) {
        }

        // If we get a very accurate position (< 10m), we can resolve early
        // But only if we've been watching for at least 2 seconds
        if (accuracy < 10 && elapsed >= 2000 && accuratePositions.length >= 2) {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          const result = calculateBestPosition(accuratePositions, bestPosition);
          resolve(result);
        }
      },
      (err) => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
        // If we got at least one position, calculate best result
        if (hasReceivedPosition && (bestPosition || positions.length > 0)) {
          const result = calculateBestPosition(
            accuratePositions.length > 0 ? accuratePositions : positions,
            bestPosition
          );
          resolve(result);
        } else {
          reject(err);
        }
      },
      {
        enableHighAccuracy: true, // Request GPS-level accuracy
        timeout: duration + 10000, // Allow extra time for GPS lock
        maximumAge: 0, // Don't use cached positions - always get fresh position
      }
    );

    // Stop watching after the specified duration
    setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (hasReceivedPosition && (bestPosition || positions.length > 0)) {
        // Use accurate positions if available, otherwise use all positions
        const positionsToUse =
          accuratePositions.length > 0 ? accuratePositions : positions;
        const result = calculateBestPosition(positionsToUse, bestPosition);
        resolve(result);
      } else {
        reject(new Error("No position received during watch period"));
      }
    }, duration);
  });
}

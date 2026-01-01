/**
 * Get current user location using browser geolocation API
 * Tries with high accuracy first, then falls back to standard accuracy if timeout
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>}
 */
export async function getCurrentLocation() {
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

const { ObjectId } = require("mongodb");
const axios = require("axios");

/**
 * Calculate travel times for handymen using Mapbox API
 */
async function calculateTravelTimes(userLng, userLat, handymen) {
  try {
    if (!process.env.MAPBOX_TOKEN) {
      return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
    }

    // בדוק שהקואורדינטות של המשתמש תקינות
    if (
      !userLng ||
      !userLat ||
      isNaN(userLng) ||
      isNaN(userLat) ||
      userLng < -180 ||
      userLng > 180 ||
      userLat < -90 ||
      userLat > 90
    ) {
      return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
    }

    // סנן רק הנדימנים שיש להם קואורדינטות תקינות
    const handymenWithCoords = handymen
      .map((h, index) => {
        if (
          h.location &&
          h.location.coordinates &&
          Array.isArray(h.location.coordinates) &&
          h.location.coordinates.length === 2
        ) {
          const lng = parseFloat(h.location.coordinates[0]);
          const lat = parseFloat(h.location.coordinates[1]);

          // בדוק שהקואורדינטות תקינות
          if (
            !isNaN(lng) &&
            !isNaN(lat) &&
            lng >= -180 &&
            lng <= 180 &&
            lat >= -90 &&
            lat <= 90
          ) {
            return { handyman: h, lng, lat, originalIndex: index };
          }
        }
        return null;
      })
      .filter((item) => item !== null);

    if (handymenWithCoords.length === 0) {
      return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
    }

    // Mapbox מגביל ל-25 נקודות (1 מקור + 24 יעדים)
    // אם יש יותר, נחלק לכמה בקשות
    const maxDestinations = 24; // 25 כולל המקור
    const batches = [];
    for (let i = 0; i < handymenWithCoords.length; i += maxDestinations) {
      const batch = handymenWithCoords.slice(i, i + maxDestinations);
      if (batch.length > 0) {
        batches.push(batch);
      }
    }

    // תוצאות לכל הנדימנים
    const results = new Map();

    // עבד על כל batch במקביל (במקום ברצף) כדי להאיץ את הטעינה
    const batchPromises = batches.map(async (batch) => {
      // ודא שיש לפחות יעד אחד ב-batch
      if (batch.length === 0) {
        return;
      }

      // בדוק אם יש הנדימנים באותו מקום כמו המשתמש - תן להם 0 דקות בלי לשלוח ל-Mapbox
      const batchToProcess = [];
      batch.forEach((item) => {
        // בדוק אם זה אותו מקום (עם טולרנס קטן)
        const isSameLocation =
          Math.abs(userLng - item.lng) < 0.0001 &&
          Math.abs(userLat - item.lat) < 0.0001;

        if (isSameLocation) {
          results.set(item.originalIndex, 0); // 0 דקות = אותו מקום
        } else {
          batchToProcess.push(item);
        }
      });

      // אם אין הנדימנים לשלוח ל-Mapbox, סיים
      if (batchToProcess.length === 0) {
        return;
      }

      try {
        // בנה את מחרוזת הקואורדינטות: <LNG_USER>,<LAT_USER>;<LNG_H1>,<LAT_H1>;...
        const coordinates = [
          `${userLng},${userLat}`, // מקור (המשתמש)
          ...batchToProcess.map((item) => `${item.lng},${item.lat}`), // יעדים (הנדימנים)
        ].join(";");

        const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?access_token=${process.env.MAPBOX_TOKEN}&sources=0&annotations=duration`;

        const response = await axios.get(url, { timeout: 10000 });

        if (response.data && response.data.durations) {
          const durations = response.data.durations[0]; // רק המקור הראשון (המשתמש)
          batchToProcess.forEach((item, index) => {
            const durationSeconds = durations[index + 1]; // +1 כי index 0 הוא המקור
            if (durationSeconds !== null && durationSeconds !== undefined) {
              const durationMinutes = Math.round(durationSeconds / 60);
              results.set(item.originalIndex, durationMinutes);
            } else {
              results.set(item.originalIndex, null);
            }
          });
        }
      } catch (error) {
        // אם יש שגיאה, תן null לכל הנדימנים ב-batch הזה
        batchToProcess.forEach((item) => {
          results.set(item.originalIndex, null);
        });
      }
    });

    // חכה שכל ה-batches יסתיימו
    await Promise.all(batchPromises);

    // הוסף את התוצאות לכל הנדימנים
    return handymen.map((h, index) => ({
      ...h,
      travelTimeMinutes: results.get(index) ?? null,
    }));
  } catch (error) {
    // אם יש שגיאה כללית, החזר את כל הנדימנים בלי זמן נסיעה
    return handymen.map((h) => ({ ...h, travelTimeMinutes: null }));
  }
}

/**
 * Fetch user by ID
 */
async function fetchUser(userId, collection) {
  if (!collection) {
    throw new Error("Database not connected");
  }

  let userIdObject;
  try {
    userIdObject = new ObjectId(userId);
  } catch (objectIdError) {
    throw new Error("Invalid user ID format");
  }

  const user = await collection.findOne({ _id: userIdObject });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Fetch and filter jobs for dashboard
 */
async function fetchJobs(user, collectionJobs) {
  if (!collectionJobs) {
    return [];
  }

  // Fetch all jobs (excluding deleted/cancelled)
  let jobs = await collectionJobs
    .find(
      {
        isDeleted: { $ne: true },
        status: { $ne: "cancelled" },
      },
      {
        projection: {
          _id: 1,
          status: 1,
          category: 1,
          subcategoryInfo: 1,
          clientId: 1,
          clientName: 1,
          handymanId: 1,
          handymanName: 1,
          handymanIdSpecial: 1,
          coordinates: 1,
          location: 1,
          locationText: 1,
          when: 1,
          whenLabel: 1,
          imageUrl: 1,
          desc: 1,
          workType: 1,
          urgent: 1,
          createdAt: 1,
          updatedAt: 1,
          ratingSubmitted: 1,
          clientApproved: 1,
          handymanReceivedPayment: 1,
          paymentIntentId: 1,
          paymentStatus: 1,
          "handiman-Blocked": 1,
        },
      }
    )
    .toArray();

  // Filter out "done" jobs with ratingSubmitted for clients
  if (!user.isHandyman) {
    jobs = jobs.filter((job) => {
      // Priority 1: Keep "done" jobs that need client approval
      if (
        job.status === "done" &&
        (job.clientApproved === false || job.clientApproved == null)
      ) {
        return true;
      }
      // Priority 2: If job is done and rating was submitted, exclude it
      if (job.status === "done" && job.ratingSubmitted === true) {
        return false;
      }
      return true;
    });
  }

  // Filter jobs by handyman specialties if user is a handyman
  if (
    user.isHandyman &&
    user.specialties &&
    Array.isArray(user.specialties) &&
    user.specialties.length > 0
  ) {
    const handymanSpecialties = user.specialties;

    const jobMatchesSpecialties = (job) => {
      const subcategoryInfoArray = Array.isArray(job.subcategoryInfo)
        ? job.subcategoryInfo
        : job.subcategoryInfo
        ? [job.subcategoryInfo]
        : [];

      if (subcategoryInfoArray.length === 0) {
        const jobCategory = (job.category || "").trim().toLowerCase();
        const matches = handymanSpecialties.some((s) => {
          const specialtyName = (s.name || "").trim().toLowerCase();
          const isFullCategory =
            s.type === "category" || s.isFullCategory === true;
          const nameMatches = specialtyName === jobCategory;
          return nameMatches && isFullCategory;
        });
        return matches;
      }

      const allMatch = subcategoryInfoArray.every((subcatInfo) => {
        const jobCategory = (subcatInfo.category || "").trim().toLowerCase();
        const matches = handymanSpecialties.some((s) => {
          const specialtyName = (s.name || "").trim().toLowerCase();
          const isFullCategory =
            s.type === "category" || s.isFullCategory === true;
          const nameMatches = specialtyName === jobCategory;
          return nameMatches && isFullCategory;
        });
        return matches;
      });
      return allMatch;
    };

    jobs = jobs.filter(jobMatchesSpecialties);
  }

  // Filter handymanIdSpecial for handymen
  if (user.isHandyman && user._id) {
    const handymanIdString = String(user._id);
    const handymanObjectId =
      user._id instanceof ObjectId ? user._id : new ObjectId(user._id);

    jobs = jobs.filter((job) => {
      // Check if this handyman is blocked in this job
      if (job["handiman-Blocked"] && Array.isArray(job["handiman-Blocked"])) {
        const blockedIds = job["handiman-Blocked"].map((id) => String(id));
        if (blockedIds.includes(handymanIdString)) {
          return false;
        }
      }

      // If job has handymanIdSpecial, it should ONLY be shown to that specific handyman
      if (job.handymanIdSpecial) {
        let jobHandymanIdSpecialStr;
        if (job.handymanIdSpecial instanceof ObjectId) {
          jobHandymanIdSpecialStr = job.handymanIdSpecial.toString();
        } else if (job.handymanIdSpecial.toString) {
          jobHandymanIdSpecialStr = job.handymanIdSpecial.toString();
        } else {
          jobHandymanIdSpecialStr = String(job.handymanIdSpecial);
        }

        let isMatch = jobHandymanIdSpecialStr === handymanIdString;

        if (!isMatch) {
          try {
            const jobSpecialObjectId =
              job.handymanIdSpecial instanceof ObjectId
                ? job.handymanIdSpecial
                : new ObjectId(job.handymanIdSpecial);
            isMatch = jobSpecialObjectId.equals(handymanObjectId);
          } catch (e) {
            isMatch = false;
          }
        }

        return isMatch;
      }

      return true;
    });
  }

  // Filter out "done" jobs for clients
  if (!user.isHandyman) {
    jobs = jobs.filter((job) => {
      if (
        job.status === "done" &&
        (job.clientApproved === false || job.clientApproved == null)
      ) {
        return true;
      }
      if (job.status === "done") {
        return false;
      }
      return true;
    });
  }

  // Sort jobs: 1. Urgent first, 2. Special (handymanIdSpecial) second, 3. By creation time (newest first)
  jobs.sort((a, b) => {
    const aUrgent = a.urgent === true || a.isUrgent === true;
    const bUrgent = b.urgent === true || b.isUrgent === true;
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    const aSpecial = !!a.handymanIdSpecial;
    const bSpecial = !!b.handymanIdSpecial;
    if (aSpecial && !bSpecial) return -1;
    if (!aSpecial && bSpecial) return 1;

    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return jobs;
}

/**
 * Fetch handimands (handymen) for dashboard
 */
async function fetchHandimands(user, lng, lat, collection) {
  if (!collection) {
    return [];
  }

  let handimands = [];

  if (lng && lat) {
    const userLng = parseFloat(lng);
    const userLat = parseFloat(lat);

    if (!isNaN(userLng) && !isNaN(userLat)) {
      try {
        handimands = await collection
          .find({
            isHandyman: true,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [userLng, userLat],
                },
                $maxDistance: 10000, // 10 ק"מ במטר
              },
            },
          })
          .toArray();

        handimands = await calculateTravelTimes(userLng, userLat, handimands);
      } catch (geoError) {
        // Fallback: שלוף את כל ההנדימנים
        handimands = await collection.find({ isHandyman: true }).toArray();

        if (!isNaN(userLng) && !isNaN(userLat)) {
          handimands = await calculateTravelTimes(userLng, userLat, handimands);
        }
      }
    } else {
      handimands = await collection.find({ isHandyman: true }).toArray();
    }
  } else {
    handimands = await collection.find({ isHandyman: true }).toArray();
  }

  // Mark blocked handymen if user has handiman-Blocked array
  if (
    user &&
    !user.isHandyman &&
    user["handiman-Blocked"] &&
    Array.isArray(user["handiman-Blocked"])
  ) {
    const blockedIds = user["handiman-Blocked"].map((id) => String(id));
    handimands = handimands.map((handyman) => ({
      ...handyman,
      isBlocked: blockedIds.includes(String(handyman._id)),
    }));
  } else {
    handimands = handimands.map((handyman) => ({
      ...handyman,
      isBlocked: false,
    }));
  }

  return handimands;
}

/**
 * Fetch dashboard statistics
 */
async function fetchStats(collection) {
  if (!collection) {
    return {
      handymen: 0,
      clients: 0,
      total: 0,
    };
  }

  const [handymenCount, clientsCount, totalUsersCount] = await Promise.all([
    collection.countDocuments({ isHandyman: true }),
    collection.countDocuments({
      $or: [{ isHandyman: false }, { isHandyman: { $exists: false } }],
    }),
    collection.countDocuments({}),
  ]);

  return {
    handymen: handymenCount,
    clients: clientsCount,
    total: totalUsersCount,
  };
}

/**
 * Fetch all dashboard data in parallel
 */
async function fetchDashboardData(
  userId,
  lng,
  lat,
  collection,
  collectionJobs
) {
  // Validate collections
  if (!collection) {
    throw new Error("Database not connected");
  }

  // Fetch user first (needed for other queries)
  const user = await fetchUser(userId, collection);

  // Fetch all data in parallel
  const [jobs, handimands, stats] = await Promise.all([
    fetchJobs(user, collectionJobs),
    fetchHandimands(user, lng, lat, collection),
    fetchStats(collection),
  ]);

  return {
    user,
    jobs,
    handimands,
    stats,
  };
}

module.exports = {
  fetchUser,
  fetchJobs,
  fetchHandimands,
  fetchStats,
  fetchDashboardData,
  calculateTravelTimes,
};

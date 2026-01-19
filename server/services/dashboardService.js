const { ObjectId } = require("mongodb");
const axios = require("axios");
const { serverLogger } = require("../utils/logger");

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

  // Check if user has a payment method
  // Convert to plain object to avoid issues with MongoDB ObjectId
  const userObj = user.toObject ? user.toObject() : user;
  // Check if paymentMethodId exists and is not empty
  const hasPaymentMethodId = userObj.paymentMethodId && 
    (typeof userObj.paymentMethodId === 'string' ? userObj.paymentMethodId.trim().length > 0 : true);
  userObj.hasPaymentMethod = !!hasPaymentMethodId;

  return userObj;
}

/**
 * Fetch and filter jobs for dashboard using MongoDB aggregation (FAST!)
 */
async function fetchJobs(user, collectionJobs) {
  const fetchJobsStart = Date.now();

  if (!collectionJobs) {
    return [];
  }

  serverLogger.log("    📋 [FETCH-JOBS] Building aggregation pipeline...");
  const pipelineStart = Date.now();

  // Build aggregation pipeline to do ALL filtering in MongoDB (much faster than JS)
  const pipeline = [];

  // Stage 1: Base match - exclude deleted/cancelled
  // Also exclude expired jobs that expired more than 1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Base conditions that apply to all
  const baseConditions = {
    isDeleted: { $ne: true },
    status: { $ne: "cancelled" },
  };

  // Expired jobs filter - exclude expired jobs that expired more than 1 hour ago
  const expiredFilter = {
    $or: [
      // Not expired at all
      { status: { $ne: "expired" } },
      // Expired but within the last hour (use expiredAt if exists, otherwise updatedAt)
      {
        $and: [
          { status: "expired" },
          {
            $or: [
              { expiredAt: { $gte: oneHourAgo } },
              {
                $and: [
                  { expiredAt: { $exists: false } },
                  { updatedAt: { $gte: oneHourAgo } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  // Combine base conditions with expired filter
  const baseMatch = {
    $and: [
      baseConditions,
      expiredFilter,
    ],
  };

  // Stage 2: Filter by user type and status
  if (!user.isHandyman) {
    // For clients: exclude "done" jobs with ratingSubmitted, but keep "done" jobs that need approval
    baseMatch.$and.push({
      $or: [
        { status: { $ne: "done" } },
        {
          $and: [
            { status: "done" },
            {
              $or: [
                { clientApproved: false },
                { clientApproved: null },
                { clientApproved: { $exists: false } },
              ],
            },
          ],
        },
      ],
    });
  } else {
    // For handymen: exclude "done" jobs
    baseMatch.$and.push({
      status: { $nin: ["done", "cancelled"] },
    });
  }

  pipeline.push({ $match: baseMatch });

  // Stage 3: Filter by handyman specialties (if handyman)
  if (
    user.isHandyman &&
    user.specialties &&
    Array.isArray(user.specialties) &&
    user.specialties.length > 0
  ) {
    const handymanSpecialties = user.specialties;
    const specialtyNames = handymanSpecialties
      .filter((s) => s.type === "category" || s.isFullCategory === true)
      .map((s) => (s.name || "").trim().toLowerCase())
      .filter((name) => name.length > 0);

    if (specialtyNames.length > 0) {
      pipeline.push({
        $match: {
          $expr: {
            $or: [
              // Case 1: Has subcategoryInfo array - ALL items must match
              {
                $and: [
                  {
                    $and: [
                      { $isArray: "$subcategoryInfo" },
                      {
                        $gt: [
                          { $size: { $ifNull: ["$subcategoryInfo", []] } },
                          0,
                        ],
                      },
                    ],
                  },
                  {
                    $allElementsTrue: {
                      $map: {
                        input: { $ifNull: ["$subcategoryInfo", []] },
                        as: "subcat",
                        in: {
                          $in: [
                            {
                              $toLower: {
                                $trim: {
                                  input: {
                                    $ifNull: [
                                      { $ifNull: ["$$subcat.category", ""] },
                                      "",
                                    ],
                                  },
                                },
                              },
                            },
                            specialtyNames,
                          ],
                        },
                      },
                    },
                  },
                ],
              },
              // Case 2: No subcategoryInfo - check job.category
              {
                $and: [
                  {
                    $or: [
                      { $not: { $isArray: "$subcategoryInfo" } },
                      {
                        $lte: [
                          { $size: { $ifNull: ["$subcategoryInfo", []] } },
                          0,
                        ],
                      },
                    ],
                  },
                  {
                    $in: [
                      {
                        $toLower: {
                          $trim: {
                            input: {
                              $ifNull: [{ $ifNull: ["$category", ""] }, ""],
                            },
                          },
                        },
                      },
                      specialtyNames,
                    ],
                  },
                ],
              },
            ],
          },
        },
      });
    }
  }

  // Stage 4: Filter handymanIdSpecial and blocked handymen (if handyman)
  if (user.isHandyman && user._id) {
    const handymanIdString = String(user._id);
    const handymanObjectId =
      user._id instanceof ObjectId ? user._id : new ObjectId(user._id);

    pipeline.push({
      $match: {
        $and: [
          // Not blocked
          {
            $expr: {
              $not: {
                $or: [
                  {
                    $in: [
                      handymanObjectId,
                      { $ifNull: ["$handiman-Blocked", []] },
                    ],
                  },
                  {
                    $in: [
                      handymanIdString,
                      { $ifNull: ["$handiman-Blocked", []] },
                    ],
                  },
                ],
              },
            },
          },
          // handymanIdSpecial validation: if exists, must match
          {
            $or: [
              { handymanIdSpecial: { $exists: false } },
              { handymanIdSpecial: null },
              { handymanIdSpecial: handymanObjectId },
              { handymanIdSpecial: handymanIdString },
              {
                $expr: {
                  $eq: [{ $toString: "$handymanIdSpecial" }, handymanIdString],
                },
              },
            ],
          },
          // Job is open (handymanId is null or empty)
          {
            $or: [
              { handymanId: { $exists: false } },
              { handymanId: null },
              { handymanId: [] },
            ],
          },
        ],
      },
    });
  } else if (!user.isHandyman) {
    // For clients: filter out "done" jobs (except those needing approval)
    pipeline.push({
      $match: {
        $or: [
          { status: { $ne: "done" } },
          {
            $and: [
              { status: "done" },
              {
                $or: [
                  { clientApproved: false },
                  { clientApproved: null },
                  { clientApproved: { $exists: false } },
                ],
              },
            ],
          },
        ],
      },
    });
  }

  // Stage 5: Sort (urgent first, then special, then by createdAt desc)
  pipeline.push({
    $addFields: {
      _sortUrgent: {
        $or: ["$urgent", "$isUrgent"],
      },
      _sortSpecial: {
        $cond: {
          if: { $ifNull: ["$handymanIdSpecial", false] },
          then: 1,
          else: 0,
        },
      },
      _sortCreatedAt: {
        $ifNull: [{ $toLong: "$createdAt" }, 0],
      },
    },
  });

  pipeline.push({
    $sort: {
      _sortUrgent: -1,
      _sortSpecial: -1,
      _sortCreatedAt: -1,
    },
  });

  pipeline.push({
    $project: {
      _sortUrgent: 0,
      _sortSpecial: 0,
      _sortCreatedAt: 0,
    },
  });

  const pipelineBuildTime = ((Date.now() - pipelineStart) / 1000).toFixed(3);
  serverLogger.log(
    `    ✅ [FETCH-JOBS] Pipeline built: ${pipelineBuildTime}s, ${pipeline.length} stages`
  );

  // Execute aggregation
  serverLogger.log("    🚀 [FETCH-JOBS] Executing aggregation...");
  const dbQueryStart = Date.now();
  let jobs = await collectionJobs.aggregate(pipeline).toArray();

  const dbQueryTime = ((Date.now() - dbQueryStart) / 1000).toFixed(3);
  serverLogger.log(
    `    ✅ [FETCH-JOBS] Aggregation completed: ${dbQueryTime}s, found ${jobs.length} jobs`
  );

  const totalTime = ((Date.now() - fetchJobsStart) / 1000).toFixed(3);
  serverLogger.log(`    🎉 [FETCH-JOBS] Total time: ${totalTime}s`);

  return jobs;
}

/**
 * Fetch handimands (handymen) for dashboard
 */
async function fetchHandimands(user, lng, lat, collection) {
  const fetchHandimandsStart = Date.now();
  serverLogger.log(
    `    👷 [FETCH-HANDIMANDS] Starting (lng: ${lng}, lat: ${lat})...`
  );

  if (!collection) {
    return [];
  }

  let handimands = [];

  if (lng && lat) {
    const userLng = parseFloat(lng);
    const userLat = parseFloat(lat);

    if (!isNaN(userLng) && !isNaN(userLat)) {
      try {
        serverLogger.log("    📍 [FETCH-HANDIMANDS] Querying with geoNear...");
        const geoQueryStart = Date.now();
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
        const geoQueryTime = ((Date.now() - geoQueryStart) / 1000).toFixed(3);
        serverLogger.log(
          `    ✅ [FETCH-HANDIMANDS] Geo query completed: ${geoQueryTime}s, found ${handimands.length} handimands`
        );

        serverLogger.log(
          "    🗺️  [FETCH-HANDIMANDS] Calculating travel times..."
        );
        const travelTimesStart = Date.now();
        handimands = await calculateTravelTimes(userLng, userLat, handimands);
        const travelTimesTime = (
          (Date.now() - travelTimesStart) /
          1000
        ).toFixed(3);
        serverLogger.log(
          `    ✅ [FETCH-HANDIMANDS] Travel times calculated: ${travelTimesTime}s`
        );
      } catch (geoError) {
        serverLogger.log(
          "    ⚠️  [FETCH-HANDIMANDS] Geo query failed, using fallback:",
          geoError.message
        );
        // Fallback: שלוף את כל ההנדימנים
        const fallbackStart = Date.now();
        handimands = await collection.find({ isHandyman: true }).toArray();
        const fallbackTime = ((Date.now() - fallbackStart) / 1000).toFixed(3);
        serverLogger.log(
          `    ✅ [FETCH-HANDIMANDS] Fallback query completed: ${fallbackTime}s, found ${handimands.length} handimands`
        );

        if (!isNaN(userLng) && !isNaN(userLat)) {
          serverLogger.log(
            "    🗺️  [FETCH-HANDIMANDS] Calculating travel times (fallback)..."
          );
          const travelTimesStart = Date.now();
          handimands = await calculateTravelTimes(userLng, userLat, handimands);
          const travelTimesTime = (
            (Date.now() - travelTimesStart) /
            1000
          ).toFixed(3);
          serverLogger.log(
            `    ✅ [FETCH-HANDIMANDS] Travel times calculated: ${travelTimesTime}s`
          );
        }
      }
    } else {
      serverLogger.log(
        "    📋 [FETCH-HANDIMANDS] No coords, fetching all handimands..."
      );
      const allStart = Date.now();
      handimands = await collection.find({ isHandyman: true }).toArray();
      const allTime = ((Date.now() - allStart) / 1000).toFixed(3);
      serverLogger.log(
        `    ✅ [FETCH-HANDIMANDS] Query completed: ${allTime}s, found ${handimands.length} handimands`
      );
    }
  } else {
    serverLogger.log(
      "    📋 [FETCH-HANDIMANDS] No coords, fetching all handimands..."
    );
    const allStart = Date.now();
    handimands = await collection.find({ isHandyman: true }).toArray();
    const allTime = ((Date.now() - allStart) / 1000).toFixed(3);
    serverLogger.log(
      `    ✅ [FETCH-HANDIMANDS] Query completed: ${allTime}s, found ${handimands.length} handimands`
    );
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

  const totalTime = ((Date.now() - fetchHandimandsStart) / 1000).toFixed(3);
  serverLogger.log(`    🎉 [FETCH-HANDIMANDS] Total time: ${totalTime}s`);

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
  const startTime = Date.now();
  let lastCheckpoint = startTime;

  const logCheckpoint = (name) => {
    const now = Date.now();
    const elapsed = ((now - lastCheckpoint) / 1000).toFixed(3);
    const total = ((now - startTime) / 1000).toFixed(3);
    serverLogger.log(
      `  ✅ [DASHBOARD-SERVICE] ${name}: +${elapsed}s (total: ${total}s)`
    );
    lastCheckpoint = now;
  };

  serverLogger.log("🔄 [DASHBOARD-SERVICE] Starting fetchDashboardData...");

  // Validate collections
  if (!collection) {
    throw new Error("Database not connected");
  }

  // Fetch user first (needed for other queries)
  serverLogger.log("👤 [DASHBOARD-SERVICE] Fetching user...");
  const user = await fetchUser(userId, collection);
  logCheckpoint("Fetch user");
  serverLogger.log(
    "  ✅ [DASHBOARD-SERVICE] User found:",
    user.isHandyman ? "Handyman" : "Client"
  );

  // Fetch all data in parallel
  serverLogger.log("🔄 [DASHBOARD-SERVICE] Starting parallel fetches...");
  const parallelStart = Date.now();

  const [jobs, handimands, stats] = await Promise.all([
    (async () => {
      serverLogger.log("  📋 [DASHBOARD-SERVICE] Starting fetchJobs...");
      const jobsStart = Date.now();
      const result = await fetchJobs(user, collectionJobs);
      const jobsTime = ((Date.now() - jobsStart) / 1000).toFixed(3);
      serverLogger.log(
        `  ✅ [DASHBOARD-SERVICE] fetchJobs completed: ${jobsTime}s, found ${result.length} jobs`
      );
      return result;
    })(),
    (async () => {
      serverLogger.log("  👷 [DASHBOARD-SERVICE] Starting fetchHandimands...");
      const handimandsStart = Date.now();
      const result = await fetchHandimands(user, lng, lat, collection);
      const handimandsTime = ((Date.now() - handimandsStart) / 1000).toFixed(3);
      serverLogger.log(
        `  ✅ [DASHBOARD-SERVICE] fetchHandimands completed: ${handimandsTime}s, found ${result.length} handimands`
      );
      return result;
    })(),
    (async () => {
      serverLogger.log("  📊 [DASHBOARD-SERVICE] Starting fetchStats...");
      const statsStart = Date.now();
      const result = await fetchStats(collection);
      const statsTime = ((Date.now() - statsStart) / 1000).toFixed(3);
      serverLogger.log(
        `  ✅ [DASHBOARD-SERVICE] fetchStats completed: ${statsTime}s`
      );
      return result;
    })(),
  ]);

  const parallelTime = ((Date.now() - parallelStart) / 1000).toFixed(3);
  serverLogger.log(
    `✅ [DASHBOARD-SERVICE] All parallel fetches completed: ${parallelTime}s`
  );
  logCheckpoint("Parallel fetches");

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(3);
  serverLogger.log(
    `🎉 [DASHBOARD-SERVICE] fetchDashboardData complete: ${totalTime}s total`
  );

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

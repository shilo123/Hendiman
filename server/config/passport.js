const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { ObjectId } = require("mongodb");

function setupPassport(collection) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  // Use SERVER_URL from environment
  // In production, SERVER_URL MUST be set in .env (e.g., https://yourdomain.com)
  // In development, fallback to localhost
  let URL_SERVER = process.env.SERVER_URL;

  if (!URL_SERVER) {
    // In production, use the production URL
    if (process.env.NODE_ENV === "production") {
      URL_SERVER = "https://handiman-98cc6d1f0a79.herokuapp.com";
    } else {
      URL_SERVER = "http://localhost:3003";
    }
  }

  const callbackURL = `${URL_SERVER}/auth/google/callback`;

  const facebookCallbackURL = `${URL_SERVER}/auth/facebook/callback`;

  // Passport serialization (must be defined before strategies)
  passport.serializeUser((user, done) => {
    // Convert ObjectId to string if needed
    const id = user._id ? user._id.toString() : user.id || user.googleId;
    done(null, id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      if (!collection) {
        return done(new Error("Database not connected"), null);
      }
      let user;
      // Try to find by _id (ObjectId) or by googleId
      try {
        user = await collection.findOne({ _id: new ObjectId(id) });
      } catch (e) {
        // If ObjectId fails, try to find by googleId or other fields
        user = await collection.findOne({
          $or: [{ _id: id }, { googleId: id }, { id: id }],
        });
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    // Use the same URL_SERVER and callbackURL defined above
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: callbackURL,
          passReqToCallback: true, // Pass request to callback to access session
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            // Don't save to database here - only return user data
            // The user will be registered when they click "Register" button
            // This prevents duplicate registrations with incomplete data
            const user = {
              googleId: profile.id,
              username:
                profile.displayName ||
                (profile.emails && profile.emails[0]
                  ? profile.emails[0].value
                  : "user"),
              email:
                profile.emails && profile.emails[0]
                  ? profile.emails[0].value
                  : "",
              name: profile.displayName || "",
              picture:
                profile.photos && profile.photos[0]
                  ? profile.photos[0].value
                  : "",
            };

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: facebookCallbackURL,
          profileFields: [
            "id",
            "displayName",
            "emails",
            "name",
            "photos",
            "picture.type(large)",
            "location",
            "hometown",
          ],
          enableProof: true,
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const email =
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : "";

            const picture =
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : "";

            const locationName =
              profile?._json?.location?.name ||
              profile?._json?.hometown?.name ||
              "";

            const user = {
              facebookId: profile.id,
              username: profile.displayName || email || "user",
              email,
              name: profile.displayName || "",
              firstName: profile?.name?.givenName || "",
              lastName: profile?.name?.familyName || "",
              picture,
              location: locationName,
            };

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  return passport;
}

module.exports = setupPassport;

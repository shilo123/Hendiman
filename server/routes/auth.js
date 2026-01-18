const passport = require("passport");

function setupAuthRoutes(app, URL_CLIENT, collection) {
  // Handle malformed Facebook OAuth URLs
  app.get("/auth/facebook/:param1/:param2", (req, res) => {
    const param2 = req.params.param2;
    const source =
      param2 === "login" || param2 === "register" ? param2 : "login";
    res.redirect(`/auth/facebook?source=${source}`);
  });

  // Handle malformed Google OAuth URLs
  app.get("/auth/google/:param1/:param2", (req, res) => {
    const param2 = req.params.param2;
    const source =
      param2 === "login" || param2 === "register" ? param2 : "login";
    res.redirect(`/auth/google?source=${source}`);
  });

  // Google OAuth initiation
  app.get("/auth/google", (req, res, next) => {
    const source = req.query.source || "login";
    const tab = req.query.tab || "client";

    // Use state parameter to pass source and tab (more reliable than session)
    const state = JSON.stringify({ source, tab });

    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: state,
    })(req, res, next);
  });

  // Google OAuth callback
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${URL_CLIENT}/login?error=auth_failed`,
    }),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.redirect(`${URL_CLIENT}/login?error=no_user`);
        }

        // Get source and tab from state parameter (more reliable than session)
        let source = "login";
        let tab = "client";

        try {
          if (req.query.state) {
            const stateData = JSON.parse(req.query.state);
            source = stateData.source || "login";
            tab = stateData.tab || "client";
          }
        } catch (e) {
          // Silent fail - use defaults
        }

        // Check if user already exists in database
        let userExists = false;
        if (collection && req.user.googleId) {
          try {
            const existingUser = await collection.findOne({
              googleId: req.user.googleId,
            });
            userExists = !!existingUser;
          } catch (dbError) {
            // Silent fail
          }
        }

        // Successful authentication - redirect to frontend with token or user data
        const userData = encodeURIComponent(JSON.stringify(req.user));
        let redirectUrl;

        // If user exists, always redirect to login
        // If user doesn't exist and source is register, redirect to register
        // Otherwise, redirect to login
        if (userExists) {
          redirectUrl = `${URL_CLIENT}/login?googleAuth=success&user=${userData}`;
        } else if (source === "register") {
          redirectUrl = `${URL_CLIENT}/register?googleAuth=success&user=${userData}&tab=${tab}`;
        } else {
          redirectUrl = `${URL_CLIENT}/login?googleAuth=success&user=${userData}`;
        }

        res.redirect(redirectUrl);
      } catch (error) {
        return res.redirect(`${URL_CLIENT}/login?error=callback_error`);
      }
    }
  );

  // Facebook OAuth initiation
  app.get("/auth/facebook", (req, res, next) => {
    if (!passport._strategy || !passport._strategy("facebook")) {
      return res.redirect(`${URL_CLIENT}/login?error=facebook_not_configured`);
    }

    const source = req.query.source || "login";
    const tab = req.query.tab || "client";

    const state = JSON.stringify({ source, tab });

    passport.authenticate("facebook", {
      scope: ["email", "public_profile"],
      state,
    })(req, res, next);
  });

  // Facebook OAuth callback
  app.get(
    "/auth/facebook/callback",
    (req, res, next) => {
      if (!passport._strategy || !passport._strategy("facebook")) {
        return res.redirect(
          `${URL_CLIENT}/login?error=facebook_not_configured`
        );
      }
      return next();
    },
    passport.authenticate("facebook", {
      failureRedirect: `${URL_CLIENT}/login?error=auth_failed`,
    }),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.redirect(`${URL_CLIENT}/login?error=no_user`);
        }

        let source = "login";
        let tab = "client";

        try {
          if (req.query.state) {
            const stateData = JSON.parse(req.query.state);
            source = stateData.source || "login";
            tab = stateData.tab || "client";
          }
        } catch (e) {
          // Silent fail - use defaults
        }

        // Check if user already exists in database
        let userExists = false;
        if (collection && req.user.facebookId) {
          try {
            const existingUser = await collection.findOne({
              facebookId: req.user.facebookId,
            });
            userExists = !!existingUser;
          } catch (dbError) {
            // Silent fail
          }
        }

        const userData = encodeURIComponent(JSON.stringify(req.user));
        let redirectUrl;

        if (userExists) {
          redirectUrl = `${URL_CLIENT}/login?facebookAuth=success&user=${userData}`;
        } else if (source === "register") {
          redirectUrl = `${URL_CLIENT}/register?facebookAuth=success&user=${userData}&tab=${tab}`;
        } else {
          redirectUrl = `${URL_CLIENT}/login?facebookAuth=success&user=${userData}`;
        }

        res.redirect(redirectUrl);
      } catch (error) {
        return res.redirect(`${URL_CLIENT}/login?error=callback_error`);
      }
    }
  );

  // Logout route
  app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.json({ success: false, message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
}

module.exports = setupAuthRoutes;

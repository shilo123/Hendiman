const passport = require("passport");

function setupAuthRoutes(app, URL_CLIENT) {
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

    if (!req.session) {
      return res.redirect(`${URL_CLIENT}/login?error=no_session`);
    }

    req.session.oauthSource = source;
    req.session.oauthTab = tab;

    req.session.save((err) => {
      if (err) {
        return res.redirect(`${URL_CLIENT}/login?error=session_error`);
      }
      passport.authenticate("google", {
        scope: ["profile", "email"],
        state: source,
      })(req, res, next);
    });
  });

  // Google OAuth callback
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${URL_CLIENT}/login?error=auth_failed`,
    }),
    (req, res) => {
      try {
        if (!req.user) {
          return res.redirect(`${URL_CLIENT}/login?error=no_user`);
        }

        const source = req.session?.oauthSource || "login";
        const tab = req.session?.oauthTab || "client";

        // Clear session data
        if (req.session) {
          delete req.session.oauthSource;
          delete req.session.oauthTab;
        }

        // Successful authentication - redirect to frontend with token or user data
        const userData = encodeURIComponent(JSON.stringify(req.user));
        let redirectUrl;

        if (source === "register") {
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

import { Router } from "express";
import passport from "passport";
import GoogleService from "../services/google.service";

export default class AuthRoutes {
  router: Router;

  constructor(googleService: GoogleService) {
    passport.use(googleService.strategy);

    this.router = Router();
    this.createRoutes();
  }

  createRoutes() {
    this.router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );
    this.router.get(
      "/google/callback",
      passport.authenticate("google", { session: false }),
      (req, res) => {
        const { token } = req.user as any;

        res.cookie("access-token", token, {
          secure: false,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          httpOnly: false,
          sameSite: "lax",
          path: "/",
          signed: false,
        });

        res.redirect(process.env.FRONT_SERVICE_URL!);
        return;
      }
    );
  }
}

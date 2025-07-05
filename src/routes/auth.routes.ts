import { Router } from "express";
import passport from "passport";
import AuthController from "../controllers/auth.controller";
import FacebookService from "../services/facebook.service";
import GoogleService from "../services/google.service";
import LinkedinService from "../services/linkedIn.service";

export default class AuthRoutes {
  router: Router;

  constructor(
    googleService: GoogleService,
    facebookService: FacebookService,
    linkedInService: LinkedinService,
    private readonly authController: AuthController
  ) {
    passport.use(googleService.strategy);
    passport.use(facebookService.strategy);
    passport.use(linkedInService.strategy);

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

    this.router.get(
      "/facebook",
      passport.authenticate("facebook", { scope: ["email"] })
    );
    this.router.get(
      "/facebook/callback",
      passport.authenticate("facebook", { session: false }),
      (req, res) => {
        const { token } = req.user as any;

        res.cookie("access-token", token, {
          secure: false,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
          httpOnly: false,
          sameSite: "lax",
          path: "/",
          signed: false,
        });

        res.redirect(process.env.FRONT_SERVICE_URL!);
        return;
      }
    );

    this.router.get(
      "/linkedin",
      passport.authenticate("linkedin", { scope: ["email"] })
    );
    this.router.get(
      "/linkedin/callback",
      passport.authenticate("linkedin", { session: false }),
      (req, res) => {
        const { token } = req.user as any;
        res.cookie("access-token", token, {
          secure: process.env.NODE_ENV === "production", // Secure en prod uniquement
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
          httpOnly: false, // Accessible par JavaScript
          sameSite: "lax",
          path: "/",
          signed: false,
        });
        res.redirect(process.env.FRONT_SERVICE_URL || "/");
      }
    );

    this.router.post("/register", this.authController.register);
    this.router.post("/login", this.authController.login);
  }
}

import jwt from "jsonwebtoken";
import { fetchApi } from "./fetch.service";
const GoogleStrategy = require("passport-google-oauth20").Strategy;

export default class GoogleService {
  strategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.AUTH_SERVICE_URL}google/callback`,
    },
    async (_: any, __: any, profile: any, done: any) => {
      try {
        const { sub, given_name, family_name, email, email_verified } =
          profile._json;

        let user = { id: 0 };

        const getUserResponse = await fetchApi(
          `${process.env.DB_SERVICE_URL}auth/getUserByEmail/${email}`,
          "get"
        );

        if (!getUserResponse.success) {
          await fetchApi(
            `${process.env.DB_SERVICE_URL}auth/createUser`,
            "post",
            {
              email,
              firstname: given_name,
              lastname: family_name,
              emailVerified: email_verified,
              providerName: "google",
              providerId: sub,
            }
          );
        } else {
          user = getUserResponse.data;
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
          expiresIn: "7d",
        });

        return done(null, { token });
      } catch (error) {
        return done(error, null);
      }
    }
  );
}

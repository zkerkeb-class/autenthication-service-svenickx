import jwt from "jsonwebtoken";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { fetchApi } from "./fetch.service";

export default class FacebookService {
  strategy = new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: `${process.env.AUTH_SERVICE_URL}facebook/callback`,
      profileFields: ["id", "emails", "name"], // Important pour récupérer prénom, nom, email
    },
    async (_: any, __: any, profile: any, done: any) => {
      try {
        const {
          id: providerId,
          emails,
          name: { givenName, familyName },
        } = profile;

        const email = emails?.[0]?.value;

        if (!email) {
          return done(new Error("Aucun email fourni par Facebook"), null);
        }

        let user = { id: 0 };

        const getUserResponse = await fetchApi(
          `${process.env.DB_SERVICE_URL}auth/getUserByEmail/${email}`,
          "get"
        );

        if (!getUserResponse.success) {
          const [u] = await Promise.all([
            fetchApi(`${process.env.DB_SERVICE_URL}auth/createUser`, "post", {
              email,
              firstname: givenName,
              lastname: familyName,
              emailVerified: true, // Facebook ne fournit pas de champ email_verified
              providerName: "facebook",
              providerId,
            }),
            fetchApi(`${process.env.NOTIF_SERVICE_URL}user/register`, "post", {
              email,
            }),
          ]);
          if (u.success) {
            user = u.data.data;
          }
        } else {
          user = getUserResponse.data.data;
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

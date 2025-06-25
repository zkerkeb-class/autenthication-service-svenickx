import jwt from "jsonwebtoken";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { fetchApi } from "./fetch.service";

export default class LinkedinService {
  strategy = new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: `${process.env.AUTH_SERVICE_URL}linkedin/callback`,
      scope: ["email"], // Utiliser les nouveaux scopes
      passReqToCallback: true, // Pour avoir accès à la requête dans le callback
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        const providerId = profile.id;
        const email = profile.emails?.[0]?.value;
        const givenName = profile.name?.givenName;
        const familyName = profile.name?.familyName;

        if (!email) {
          return done(new Error("Aucun email fourni par LinkedIn"), null);
        }

        // Tentative de récupération de l'utilisateur
        let user = { id: 0 };
        try {
          const getUserResponse = await fetchApi(
            `${process.env.DB_SERVICE_URL}auth/getUserByEmail/${email}`,
            "get"
          );

          if (!getUserResponse.success) {
            // Création d'un nouvel utilisateur si non existant
            const createUserResponse = await fetchApi(
              `${process.env.DB_SERVICE_URL}auth/createUser`,
              "post",
              {
                email,
                firstname: givenName,
                lastname: familyName,
                emailVerified: true,
                providerName: "linkedin",
                providerId,
              }
            );

            if (createUserResponse.success && createUserResponse.data) {
              user = createUserResponse.data.data || {
                id: createUserResponse.data.id,
              };
            } else {
              throw new Error("Échec de la création de l'utilisateur");
            }
          } else {
            user = getUserResponse.data.data;
          }

          // Création du token JWT
          const token = jwt.sign(
            {
              id: user.id,
              email,
              provider: "linkedin",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
          );

          return done(null, { token, user });
        } catch (error) {
          console.error("Erreur lors de l'accès à la base de données:", error);
          return done(error, null);
        }
      } catch (error) {
        console.error("Erreur d'authentification LinkedIn:", error);
        return done(error, null);
      }
    }
  );
}

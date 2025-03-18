import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import AuthRoutes from "./routes/auth.routes";
import GoogleService from "./services/google.service";

dotenv.config({ path: __dirname + "/../../.env" });

const app: Express = express();
const port = process.env.AUTH_SERVICE_PORT || 2001;

const googleService = new GoogleService();

const authRoutes = new AuthRoutes(googleService);

app.use(authRoutes.router);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import client from "prom-client";
import AuthController from "./controllers/auth.controller";
import AuthRoutes from "./routes/auth.routes";
import FacebookService from "./services/facebook.service";
import GoogleService from "./services/google.service";
import LinkedinService from "./services/linkedIn.service";

dotenv.config({ path: __dirname + "/../../.env" });

const app: Express = express();

client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total des requêtes HTTP",
  labelNames: ["method", "route", "status"],
});

const port = process.env.AUTH_SERVICE_PORT || 2001;
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.on("finish", () => {
    requestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });
  next();
});

// Endpoint pour exposer les métriques
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

const googleService = new GoogleService();
const facebookService = new FacebookService();
const linkedInService = new LinkedinService();

const authController = new AuthController();

const authRoutes = new AuthRoutes(
  googleService,
  facebookService,
  linkedInService,
  authController
);

app.use(authRoutes.router);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Auth is running at http://localhost:${port}`);
});

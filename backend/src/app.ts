import express from "express";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use("/api", routes);

  app.use((_req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next();
    res.status(404).json({ message: "Not found" });
  });

  app.use(errorMiddleware);

  return app;
}

import events from "node:events";
import type http from "node:http";
import express, { type Express, type Request, type Response } from "express";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";
import { pino } from "pino";
import type { OAuthClient } from "@atproto/oauth-client-node";
import type { Jetstream } from "@skyware/jetstream";

import { createDb, migrateToLatest, type Database } from "#/db";
import { env } from "#/lib/env";
import { createClient } from "#/auth/client";
import { createIngester } from "#/ingester";
import {
  BidirectionalResolver,
  createBidirectionalResolver,
  createIdResolver,
} from "#/id-resolver";
import { createRouter } from "#/routes";

export type AppContext = {
  db: Database;
  ingester: Jetstream;
  logger: pino.Logger;
  oauthClient: OAuthClient;
  resolver: BidirectionalResolver;
};

export type RequestContext = AppContext & {
  req: Request;
  res: Response;
};

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext
  ) {}

  static async create(): Promise<Server> {
    const { NODE_ENV, HOST, PORT, DB_PATH } = env;
    const logger = pino({ name: "server start" });

    const db = createDb(DB_PATH);
    await migrateToLatest(db);

    const oauthClient = await createClient(db);
    const baseIdResolver = createIdResolver();
    const ingester = createIngester(db);
    const resolver = createBidirectionalResolver(baseIdResolver);
    const ctx: AppContext = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
    };

    ingester.start();

    const app: Express = express();
    app.set("trust proxy", true);

    if (env.NODE_ENV === "development") {
      const liveReloadServer = livereload.createServer();
      liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
          liveReloadServer.refresh("/");
        }, 100);
      });
      app.use(connectLiveReload());
    }

    const router = createRouter(ctx);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use((_req, res) => {
      res.sendStatus(404);
    });

    const server = app.listen(env.PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    return new Server(app, server, ctx);
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    await this.ctx.ingester.close();
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info("server closed");
        resolve();
      });
    });
  }
}

const run = async () => {
  const server = await Server.create();

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref();
    await server.close();
    process.exit();
  };

  process.on("SIGINT", onCloseSignal);
  process.on("SIGTERM", onCloseSignal);
};

run();

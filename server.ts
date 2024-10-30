import events from "node:events";
import type http from "node:http";
import express, { type Express, type Request, type Response } from "express";
import { pino } from "pino";
import type { OAuthClient } from "@atproto/oauth-client-node";
import { Firehose } from "@atproto/sync";

import { handler as ssrHandler } from "./dist/server/entry.mjs";
import { createDb, migrateToLatest, type Database } from "#/db";
import { env } from "#/lib/env";
import { createClient } from "#/auth/client";
import { createIngester } from "#/ingester";
import {
  BidirectionalResolver,
  createBidirectionalResolver,
  createIdResolver,
} from "#/id-resolver";

export type AppContext = {
  db: Database;
  ingester: Firehose;
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
    const ingester = createIngester(db, baseIdResolver);
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
    // Change this based on your astro.config.mjs, `base` option.
    // They should match. The default value is "/".
    const base = "/";
    app.use(base, express.static("dist/client/"));
    app.use((req, res, next) => {
      const locals: RequestContext = {
        ...ctx,
        req,
        res,
      };

      ssrHandler(req, res, next, locals);
    });

    const server = app.listen(env.PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    return new Server(app, server, ctx);
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    await this.ctx.ingester.destroy();
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

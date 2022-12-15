import Fastify, { FastifyInstance } from "fastify";
import createHttpError from "http-errors";

import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

import type { EnvConfig } from "./config";
import { UserSchema } from "./routes/user";

function buildServer(config: EnvConfig): FastifyInstance {
  const opts = {
    ...config,
    logger: {
      transport: {
        target: "pino-pretty",
      },
    },
  };

  const fastify = Fastify(opts);

  for (const schema of UserSchema) {
    fastify.addSchema(schema);
  }

  fastify.register(import("./plugins/authenticate"), opts);
  fastify.register(import("./routes/user"), { prefix: "api/users" });

  fastify.setErrorHandler(function (error, request, reply) {
    if (error instanceof PrismaClientKnownRequestError) {
      const code = error.code;
      if (code === "P2002") {
        reply.status(400).send({
          ok: false,
          message: `Duplicate Value: ${error.meta.target.join(" ")}`,
        });
      }
    }

    if (error instanceof createHttpError.BadRequest) {
      return reply.code(400).send({ ok: false, message: error.message });
    }

    if (error instanceof Fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
      // Log error
      this.log.error(error);
      // Send error response
      reply.status(500).send({ ok: false });
    }
  });

  fastify.log.info("Fastify is starting up");
  return fastify;
}

export default buildServer;

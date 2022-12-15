import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { EnvConfig } from "../config";

async function authenticate(fastify: FastifyInstance, opts: EnvConfig) {
  fastify.register(import("@fastify/jwt"), {
    secret: opts.JWT_SECRET,
  });

  fastify.decorate(
    "authenticate",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch (error) {
        reply.send(error);
      }
    },
  );
}

authenticate[Symbol.for("skip-override")] = true;

export default authenticate;

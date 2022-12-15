import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";
import errors from "http-errors";

import { hashPassword } from "../utils/hash";

const userCore = {
  email: z.string({
    required_error: "email is required",
    invalid_type_error: "email must be a string",
  }).email(),
  name: z.string(),
};

const createUserSchema = z.object({
  ...userCore,
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "password must be a string",
  }),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

const createUserReponseSchema = z.object({
  ...userCore,
});

const loginSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  }).email(),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }),
});

type loginUserInput = z.infer<typeof loginSchema>;

const loginResponseSchema = z.object({
  access_token: z.string(),
});

export const { schemas: UserSchema, $ref } = buildJsonSchemas({
  createUserSchema,
  createUserReponseSchema,
  loginSchema,
  loginResponseSchema,
});

export default async function users(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  fastify.post("/", {
    schema: {
      body: $ref("createUserSchema"),
      response: {
        201: $ref("createUserReponseSchema"),
      },
    },
  }, async (
    req: FastifyRequest<{
      Body: CreateUserInput;
    }>,
    reply: FastifyReply,
  ) => {
    const { password, ...rest } = req.body;
    const { hash, salt } = hashPassword(password);

    try {
      const user = await prisma.user.create({
        data: { ...rest, salt, password: hash },
      });

      return reply.code(201).send(user);
    } catch (error) {
      // throw errors.BadRequest();
      return error;
    }
  });

  fastify.post("/login", {
    schema: {
      body: $ref("loginSchema"),
      response: {
        200: $ref("loginResponseSchema"),
      },
    },
  }, async function (
    req: FastifyRequest<{
      Body: loginUserInput;
    }>,
    reply: FastifyReply,
  ) {
  });
}

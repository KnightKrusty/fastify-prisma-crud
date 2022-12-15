import buildServer from ".";
import config from "./config";

const fastify = buildServer(config);

fastify.get("/healthcheck", async () => {
  return { status: "Ok" };
});

async function main(): Promise<void> {
  try {
    const server = await fastify.listen({ port: 3000 });
  } catch (error) {
    console.error("Error", error);
    process.exit(1);
  }
}

main();

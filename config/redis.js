import { createClient } from "redis";

export const client = createClient({
  url: "redis://localhost:6379",
});

client.on("error", (error) => {
  console.log("Redis error");
});
export async function redisConnect() {
  client.connect();
  console.log("redis connected");
}

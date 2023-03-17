import { defineConfig } from "vitest/config";

export default defineConfig({
  compilerOptions: {
    types: ["vitest/globals"],
  },
  test: {
    environment: "jsdom",
    global: true,
    include: ["**/*.vitest.{js,ts}"],
  },
  singleThread: false,
});

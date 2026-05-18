import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
  migrate: {
    async adapter() {
      return new PrismaNeon({
        connectionString: process.env.DATABASE_URL as string,
      });
    },
  },
});
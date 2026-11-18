/** Drops & recreates data by re-running the seed. */
import { mkdirSync } from "fs";
mkdirSync("./data", { recursive: true });

// The seed script clears all tables before inserting, so re-seeding is a reset.
import "./seed";

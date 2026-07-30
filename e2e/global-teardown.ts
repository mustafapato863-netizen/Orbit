import { cleanupQaData } from "./qa-database";

export default async function globalTeardown() {
  await cleanupQaData();
}

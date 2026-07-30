import { prepareQaData } from "./qa-database";

export default async function globalSetup() {
  await prepareQaData();
}

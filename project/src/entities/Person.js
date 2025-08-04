import { createEntityClient } from "../utils/entityWrapper";
import schema from "./Person.json";
export const Person = createEntityClient("Person", schema);

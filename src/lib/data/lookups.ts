import { INTERNAL_PROJECT, PEOPLE, TEAMS } from "./reference-data";
import { PROJECTS } from "./seed";

/** O(1) lookups by id, shared by the reporting and import modules. */

export const projectById = new Map([...PROJECTS, INTERNAL_PROJECT].map((p) => [p.id, p]));
export const personById = new Map(PEOPLE.map((p) => [p.id, p]));
export const teamById = new Map(TEAMS.map((t) => [t.id, t]));

export const getProject = (id: string) => projectById.get(id);
export const getPerson = (id: string) => personById.get(id);
export const teamName = (id: string) => teamById.get(id as never)?.name ?? id;

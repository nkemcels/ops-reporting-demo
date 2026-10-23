import type { Person, Project, Team, TeamId } from "@/lib/domain/types";
import { addMonths, monthRange } from "@/lib/utils/months";

/**
 * Reference data for the demo: teams, staff roster and project register.
 * In the real application these are PostgreSQL tables maintained by admins
 * (or synced from HR / CRM), not constants.
 */

export const FIRST_MONTH = "2025-09";
export const LAST_SEED_MONTH = "2026-08";
export const SEED_MONTHS = monthRange(FIRST_MONTH, LAST_SEED_MONTH);

/** The month-end close still waiting for uploads; the bundled sample files fill it. */
export const OPEN_MONTH = addMonths(LAST_SEED_MONTH, 1);

export const CURRENT_USER = { name: "Jordan Ellis", role: "Head of Delivery", initials: "JE" };

export const TEAMS: Team[] = [
  { id: "platform", name: "Platform Engineering" },
  { id: "data", name: "Data & Analytics" },
  { id: "design", name: "Product Design" },
  { id: "qa", name: "QA & Automation" },
  { id: "cloud", name: "Cloud Operations" },
];

function person(
  id: string,
  name: string,
  role: string,
  team: TeamId,
  costRate: number,
  billRate: number,
  capacity = 160,
): Person {
  return { id, name, role, team, costRate, billRate, capacity };
}

export const PEOPLE: Person[] = [
  person("p01", "Amara Okafor", "Engineering Lead", "platform", 92, 165),
  person("p02", "Daniel Brooks", "Senior Engineer", "platform", 78, 145),
  person("p03", "Mei Lin", "Senior Engineer", "platform", 76, 145),
  person("p04", "Lucas Ferreira", "Engineer", "platform", 61, 120),
  person("p05", "Hannah Weber", "Engineer", "platform", 58, 120),
  person("p06", "Tomás Rivera", "Engineer", "platform", 55, 115, 120),
  person("p07", "Priya Nair", "Analytics Lead", "data", 88, 160),
  person("p08", "Owen Gallagher", "Data Engineer", "data", 72, 140),
  person("p09", "Sofia Rossi", "Data Engineer", "data", 70, 140),
  person("p10", "Kwame Mensah", "BI Analyst", "data", 57, 115),
  person("p11", "Elena Petrova", "BI Analyst", "data", 55, 110),
  person("p12", "Grace Kim", "Design Lead", "design", 84, 150),
  person("p13", "Noah Fischer", "Product Designer", "design", 64, 125),
  person("p14", "Aisha Bello", "Product Designer", "design", 62, 125),
  person("p15", "Ryan Walsh", "UX Researcher", "design", 60, 120, 120),
  person("p16", "Fatima Haddad", "QA Lead", "qa", 74, 135),
  person("p17", "Ben Carter", "QA Engineer", "qa", 54, 105),
  person("p18", "Yuki Tanaka", "QA Engineer", "qa", 53, 105),
  person("p19", "Chloe Martin", "Automation Engineer", "qa", 59, 115),
  person("p20", "Marcus Johnson", "Cloud Lead", "cloud", 90, 165),
  person("p21", "Ines Duarte", "DevOps Engineer", "cloud", 73, 140),
  person("p22", "Samuel Adeyemi", "DevOps Engineer", "cloud", 71, 140),
  person("p23", "Laura Novak", "SRE", "cloud", 75, 145),
  person("p24", "Ethan Price", "Engineer", "platform", 57, 115),
  person("p25", "Zara Ahmed", "Data Engineer", "data", 66, 130),
  person("p26", "Leo Schmidt", "Product Designer", "design", 60, 120),
];

/** A project as registered, plus the knobs the seed generator uses to shape its history. */
export interface ProjectPlan extends Omit<Project, "percentComplete" | "progress"> {
  members: string[];
  /** Load multiplier: above 1 means the team logs more hours than planned. */
  burn: number;
  /** Share of logged hours that is billable (0 for internal projects). */
  billableShare: number;
  /** Cost efficiency (CPI) the demo story wants this project to land on. */
  targetCpi: number;
  completed?: boolean;
}

export const PROJECT_PLANS: ProjectPlan[] = [
  { id: "pr01", code: "PRJ-1042", name: "Customer Portal Rebuild", client: "Halcyon Insurance", team: "platform", leadId: "p01", contract: "Fixed fee", budget: 640000, startMonth: "2025-09", endMonth: "2026-12", members: ["p01", "p02", "p04", "p13", "p17"], burn: 1.0, billableShare: 0.92, targetCpi: 1.0 },
  { id: "pr02", code: "PRJ-1047", name: "Claims Data Warehouse", client: "Halcyon Insurance", team: "data", leadId: "p07", contract: "Time & materials", budget: 410000, startMonth: "2025-11", endMonth: "2026-10", members: ["p07", "p08", "p09", "p10"], burn: 1.04, billableShare: 0.95, targetCpi: 1.03 },
  { id: "pr03", code: "PRJ-1051", name: "Mobile Banking App v3", client: "Northgate Bank", team: "platform", leadId: "p02", contract: "Fixed fee", budget: 720000, startMonth: "2025-09", endMonth: "2027-01", members: ["p02", "p03", "p05", "p14", "p18", "p19"], burn: 1.22, billableShare: 0.9, targetCpi: 0.78 },
  { id: "pr04", code: "PRJ-1055", name: "Cloud Migration Phase 2", client: "Northgate Bank", team: "cloud", leadId: "p20", contract: "Time & materials", budget: 380000, startMonth: "2026-01", endMonth: "2026-11", members: ["p20", "p21", "p22", "p23"], burn: 0.97, billableShare: 0.93, targetCpi: 1.06 },
  { id: "pr05", code: "PRJ-1058", name: "Design System 2.0", client: "Internal", team: "design", leadId: "p12", contract: "Fixed fee", budget: 150000, startMonth: "2025-09", endMonth: "2026-06", members: ["p12", "p13", "p26"], burn: 0.94, billableShare: 0, targetCpi: 1, completed: true },
  { id: "pr06", code: "PRJ-1061", name: "Retail Demand Forecasting", client: "Brightmart", team: "data", leadId: "p07", contract: "Fixed fee", budget: 290000, startMonth: "2026-02", endMonth: "2026-12", members: ["p09", "p11", "p25"], burn: 1.15, billableShare: 0.91, targetCpi: 0.9 },
  { id: "pr07", code: "PRJ-1064", name: "E-commerce Checkout Revamp", client: "Brightmart", team: "platform", leadId: "p03", contract: "Time & materials", budget: 260000, startMonth: "2026-03", endMonth: "2026-11", members: ["p03", "p06", "p24", "p14"], burn: 0.92, billableShare: 0.94, targetCpi: 1.08 },
  { id: "pr08", code: "PRJ-1066", name: "Test Automation Framework", client: "Veridian Health", team: "qa", leadId: "p16", contract: "Fixed fee", budget: 175000, startMonth: "2025-12", endMonth: "2026-09", members: ["p16", "p17", "p19"], burn: 1.08, billableShare: 0.88, targetCpi: 0.93 },
  { id: "pr09", code: "PRJ-1070", name: "Patient Scheduling Platform", client: "Veridian Health", team: "platform", leadId: "p01", contract: "Fixed fee", budget: 540000, startMonth: "2026-04", endMonth: "2027-03", members: ["p01", "p04", "p05", "p15", "p18", "p23"], burn: 1.31, billableShare: 0.9, targetCpi: 0.83 },
  { id: "pr10", code: "PRJ-1073", name: "Observability Rollout", client: "Internal", team: "cloud", leadId: "p20", contract: "Time & materials", budget: 120000, startMonth: "2026-02", endMonth: "2026-10", members: ["p21", "p23"], burn: 1.0, billableShare: 0, targetCpi: 0.98 },
  { id: "pr11", code: "PRJ-1076", name: "Executive KPI Dashboards", client: "Solace Energy", team: "data", leadId: "p07", contract: "Time & materials", budget: 145000, startMonth: "2026-05", endMonth: "2026-12", members: ["p08", "p10", "p12", "p26"], burn: 0.95, billableShare: 0.96, targetCpi: 1.04 },
  { id: "pr12", code: "PRJ-1079", name: "Field Service App", client: "Solace Energy", team: "platform", leadId: "p02", contract: "Fixed fee", budget: 330000, startMonth: "2026-06", endMonth: "2027-02", members: ["p24", "p06", "p12", "p13", "p17", "p22"], burn: 1.06, billableShare: 0.9, targetCpi: 0.92 },
  { id: "pr13", code: "PRJ-1082", name: "Loyalty App UX Redesign", client: "Brightmart", team: "design", leadId: "p12", contract: "Fixed fee", budget: 210000, startMonth: "2026-03", endMonth: "2026-12", members: ["p12", "p14", "p15", "p26"], burn: 1.0, billableShare: 0.93, targetCpi: 1.02 },
];

export const EXPENSE_CATEGORIES = ["Software & licences", "Cloud hosting", "Contractors", "Travel"];

/** Bucket for training, pre-sales and admin time. Counts toward hours, never toward project cost. */
export const INTERNAL_PROJECT: Project = {
  id: "internal",
  code: "INT-0000",
  name: "Internal & non-billable",
  client: "Internal",
  team: "platform",
  leadId: "p01",
  contract: "Time & materials",
  budget: 0,
  startMonth: FIRST_MONTH,
  endMonth: addMonths(LAST_SEED_MONTH, 12),
  percentComplete: 0,
  progress: {},
};

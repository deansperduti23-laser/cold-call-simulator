// Job titles, scenario presets, and dynamic persona generation for the
// "Who are you calling?" selector. Replaces the old fixed PERSONAS list.

export interface JobTitle {
  id: string;
  label: string;       // Short label e.g. "CEO"
  fullTitle: string;   // Full title e.g. "Chief Executive Officer"
  description: string; // One-line description of the role
  hot?: boolean;       // Featured in "Hot Right Now"
}

export interface Scenario {
  id: string;
  label: string;
  description: string;
  promptFragment: string; // Inserted into the persona prompt
}

// "Hot Right Now" entries are flagged with hot: true. The two top positions
// are CEO and VP of Sales as required.
export const JOB_TITLES: JobTitle[] = [
  { id: "ceo",          label: "CEO",                 fullTitle: "Chief Executive Officer", description: "Ultimate decision-maker, sets strategy and approves spend.", hot: true },
  { id: "vp_sales",     label: "VP of Sales",         fullTitle: "Vice President of Sales", description: "Owns the commercial org, evaluates new sales tools and vendors.", hot: true },
  { id: "cmo",          label: "CMO",                 fullTitle: "Chief Marketing Officer", description: "Owns demand generation, brand and pipeline marketing." },
  { id: "cfo",          label: "CFO",                 fullTitle: "Chief Financial Officer", description: "Controls capital allocation and signs off on vendor spend." },
  { id: "director_ops", label: "Director of Ops",     fullTitle: "Director of Operations",  description: "Runs day-to-day operations and process efficiency." },
  { id: "procurement",  label: "Procurement Manager", fullTitle: "Procurement Manager",     description: "Vendor selection, contract negotiation and purchasing." },
];

export const SCENARIOS: Scenario[] = [
  {
    id: "standard",
    label: "Standard - Skeptical Buyer",
    description: "Cautious, time-pressed, has been pitched many times.",
    promptFragment: "You are wary of cold callers. You have been pitched constantly and your default is skepticism. You will give the rep about 30 seconds to prove they are worth your time. Push back on weak openers, demand specifics, and disengage if they cannot articulate a clear, relevant reason for the call.",
  },
  {
    id: "warm",
    label: "Warm Lead - Curious",
    description: "Open-minded, willing to engage if the rep gets to a point.",
    promptFragment: "You happen to be in a good mood and are open to hearing the rep out. You are curious by nature and will give them a fair hearing. Engage with thoughtful follow-up questions, but still expect them to articulate value clearly.",
  },
  {
    id: "hostile",
    label: "Hostile - Busy & Dismissive",
    description: "Extremely busy and irritated by interruptions.",
    promptFragment: "You are extremely busy and irritated by cold calls. You will try to get off the phone within 60 seconds unless the rep says something genuinely compelling. Be curt, interrupt, and look for any excuse to end the call.",
  },
  {
    id: "evaluating",
    label: "Actively Evaluating Vendors",
    description: "Currently shopping in this category and asks sharp questions.",
    promptFragment: "You are coincidentally evaluating vendors in this exact category right now. You will engage if the rep is competent and ask sharp comparison questions. You want references, pricing context, and proof points before committing to a follow-up.",
  },
  {
    id: "custom",
    label: "Custom Prompt",
    description: "Write your own persona instructions from scratch.",
    promptFragment: "",
  },
];

export type Gender = "male" | "female";

const MALE_FIRST = ["David", "Michael", "Robert", "James", "Marcus", "Derek", "Jason", "Brian", "Andrew", "Eric"];
const FEMALE_FIRST = ["Christine", "Sarah", "Angela", "Linda", "Rachel", "Emily", "Karen", "Diana", "Megan", "Laura"];
const LAST = ["Hartley", "Park", "Walker", "Mills", "Trevino", "Russo", "Webb", "Chen", "Kim", "Nguyen"];
const COMPANIES = [
  "NovaPulse Medical",
  "Vertex MedTech",
  "ClearVision Diagnostics",
  "LuminarX Surgical",
  "Apex BioDevice",
  "Helios Med Systems",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export interface CallConfig {
  jobTitleId: string;
  jobLabel: string;
  jobFullTitle: string;
  scenarioId: string;
  scenarioLabel: string;
  customPrompt: string;
  gender: Gender;
  displayName: string;
  company: string;
  voice?: string; // Kokoro voice id; if omitted, defaults from gender
}

export function generateCallConfig(opts: {
  jobTitleId: string;
  scenarioId: string;
  customPrompt: string;
  gender: Gender;
}): CallConfig {
  const job = JOB_TITLES.find(j => j.id === opts.jobTitleId) || JOB_TITLES[0];
  const scenario = SCENARIOS.find(s => s.id === opts.scenarioId) || SCENARIOS[0];
  const seed = hashString(`${opts.jobTitleId}-${opts.scenarioId}-${opts.gender}-${Date.now()}`);
  const first = opts.gender === "female" ? pick(FEMALE_FIRST, seed) : pick(MALE_FIRST, seed);
  const last = pick(LAST, seed >> 3);
  const company = pick(COMPANIES, seed >> 5);
  return {
    jobTitleId: job.id,
    jobLabel: job.label,
    jobFullTitle: job.fullTitle,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    customPrompt: opts.customPrompt || "",
    gender: opts.gender,
    displayName: `${first} ${last}`,
    company,
  };
}

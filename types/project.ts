/** Project shape used by content/projects.json and the agent for "point to evidence" answers */
export type Project = {
  title: string;
  slug: string;
  url: string;
  skills: string[];
  summary: string;
  context?: string;
  "the problem"?: string;
  "the solution"?: string;
  "My Role"?: string;
  Impact?: string;
  images?: string[];
  videos?: string[];
  "Tools Used"?: string[];
  "Tech Stack"?: string[];
  notes?: string;
  role?: string; // Used for agent context only, not displayed in UI
  company?: string; // Used for agent context only, not displayed in UI
  evidence?: string; // Used for agent context only, not displayed in UI
  featured?: boolean;
};

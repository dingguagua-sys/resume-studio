export type SectionKey = "summary" | "experience" | "education" | "skills" | "projects";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
];

export type TemplateId = "classic" | "modern" | "minimal" | "bold" | "academic";

export const TEMPLATE_OPTIONS: { id: TemplateId; label: string; hint: string }[] = [
  { id: "classic", label: "经典商务", hint: "侧栏 + 主栏" },
  { id: "modern", label: "现代极简", hint: "大标题与留白" },
  { id: "minimal", label: "纯净线性", hint: "单栏细线" },
  { id: "bold", label: "高对比", hint: "深色顶栏" },
  { id: "academic", label: "学术严谨", hint: "衬线标题" },
];

export type Basics = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
};

export type SkillItem = { id: string; name: string; level: string };

export type ProjectItem = {
  id: string;
  name: string;
  description: string;
  link: string;
  tech: string;
};

export type ResumeData = {
  basics: Basics;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
};

export function emptyResumeData(): ResumeData {
  return {
    basics: {
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };
}

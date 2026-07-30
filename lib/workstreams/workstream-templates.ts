export const projectTypes = [
  "CUSTOM",
  "SOFTWARE",
  "BUSINESS",
  "OPERATIONS",
  "CONSTRUCTION",
  "MARKETING",
  "HR",
  "PROCUREMENT",
] as const;

export type ProjectType = (typeof projectTypes)[number];
export type WorkstreamTemplateKey = ProjectType;

type TemplateItem = {
  code: string;
  name: string;
  description: string;
  colorToken: string;
  iconKey: string;
};

const item = (
  code: string,
  name: string,
  description: string,
  colorToken: string,
  iconKey: string,
): TemplateItem => ({ code, name, description, colorToken, iconKey });

export const workstreamTemplates: Record<
  WorkstreamTemplateKey,
  { label: string; description: string; workstreams: TemplateItem[] }
> = {
  CUSTOM: {
    label: "Blank / Custom",
    description: "Start without predefined teams.",
    workstreams: [],
  },
  SOFTWARE: {
    label: "Software delivery",
    description: "Product and software delivery.",
    workstreams: [
      item("PRODUCT", "Product & UX", "Product scope, experience, and acceptance.", "#7157e8", "layout"),
      item("FRONTEND", "Frontend", "User-facing interfaces and client delivery.", "#2f73e8", "monitor"),
      item("BACKEND", "Backend", "Services, integrations, and business logic.", "#129b68", "server"),
      item("DATABASE", "Data & Database", "Data models, quality, and persistence.", "#e8860b", "database"),
      item("QA_RELEASE", "QA & Release", "Verification, readiness, and deployment.", "#d14b72", "shield-check"),
    ],
  },
  BUSINESS: {
    label: "Business initiative",
    description: "Strategy, process, stakeholders, and adoption.",
    workstreams: [
      item("STRATEGY", "Strategy & Scope", "Objectives, scope, and business outcomes.", "#7157e8", "target"),
      item("PROCESS", "Process Design", "Operating model and process improvement.", "#2f73e8", "workflow"),
      item("STAKEHOLDERS", "Stakeholders", "Engagement, approvals, and communication.", "#129b68", "users"),
      item("CHANGE", "Change & Adoption", "Readiness, training, and adoption.", "#e8860b", "refresh-cw"),
    ],
  },
  OPERATIONS: {
    label: "Operations improvement",
    description: "Service, quality, people, and improvement.",
    workstreams: [
      item("OPERATIONS", "Operations", "Operating workflows and controls.", "#2f73e8", "settings"),
      item("SERVICE", "Service Delivery", "Service levels and customer outcomes.", "#129b68", "handshake"),
      item("QUALITY", "Quality & Compliance", "Quality gates and compliance.", "#e8860b", "shield-check"),
      item("PEOPLE", "People & Enablement", "Capacity, training, and readiness.", "#7157e8", "users"),
    ],
  },
  CONSTRUCTION: {
    label: "Construction project",
    description: "Design, procurement, site, and handover.",
    workstreams: [
      item("DESIGN", "Design & Engineering", "Design packages and technical coordination.", "#7157e8", "ruler"),
      item("PROCUREMENT", "Procurement", "Materials, vendors, and commercial packages.", "#2f73e8", "shopping-cart"),
      item("SITE", "Site Execution", "Construction and site coordination.", "#129b68", "hard-hat"),
      item("HSE_QUALITY", "HSE & Quality", "Safety, inspections, and assurance.", "#e8860b", "shield-check"),
      item("COMMISSIONING", "Commissioning & Handover", "Testing and final handover.", "#d14b72", "check-circle"),
    ],
  },
  MARKETING: {
    label: "Marketing campaign",
    description: "Strategy, content, channels, and measurement.",
    workstreams: [
      item("STRATEGY", "Campaign Strategy", "Audience, proposition, and plan.", "#7157e8", "target"),
      item("CREATIVE", "Creative & Content", "Creative assets and content production.", "#d14b72", "palette"),
      item("CHANNELS", "Channels & Media", "Media and channel execution.", "#2f73e8", "megaphone"),
      item("ANALYTICS", "Analytics & Optimization", "Measurement and optimization.", "#129b68", "chart"),
    ],
  },
  HR: {
    label: "People / HR initiative",
    description: "Policy, talent, learning, and engagement.",
    workstreams: [
      item("POLICY", "Policy & Governance", "Policies, controls, and approvals.", "#7157e8", "file-check"),
      item("TALENT", "Talent & Organization", "Roles, structure, and talent.", "#2f73e8", "users"),
      item("LEARNING", "Learning & Enablement", "Training and capability.", "#129b68", "graduation-cap"),
      item("ENGAGEMENT", "Engagement & Change", "Communication and employee experience.", "#e8860b", "messages"),
    ],
  },
  PROCUREMENT: {
    label: "Procurement program",
    description: "Demand, sourcing, contracting, and delivery.",
    workstreams: [
      item("DEMAND", "Demand & Specification", "Requirements and demand validation.", "#7157e8", "clipboard-list"),
      item("SOURCING", "Sourcing", "Market engagement and sourcing.", "#2f73e8", "search"),
      item("EVALUATION", "Evaluation & Award", "Technical and commercial evaluation.", "#129b68", "scale"),
      item("CONTRACT", "Contracting", "Negotiation, contract, and approvals.", "#e8860b", "file-signature"),
      item("SUPPLIER", "Supplier Delivery", "Performance and acceptance.", "#d14b72", "truck"),
    ],
  },
};

export function templateWorkstreams(template: WorkstreamTemplateKey) {
  return workstreamTemplates[template].workstreams.map((workstream, index) => ({
    ...workstream,
    slug: workstream.code.toLowerCase().replaceAll("_", "-"),
    sortOrder: (index + 1) * 10,
  }));
}

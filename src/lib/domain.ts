import { z } from "zod";
export const accountRoles = ["COMPANY", "WORKER", "VENDOR", "ADMIN"] as const;
export type AccountRole = (typeof accountRoles)[number];
export const jobStatuses = [
  "DRAFT",
  "OPEN",
  "PAUSED",
  "CLOSED",
  "FILLED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;
export const applicationStatuses = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_REQUESTED",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
  "DEPLOYMENT_CONFIRMED",
  "COMPLETED",
] as const;
export const proposalStatuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "NEGOTIATION",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "DEPLOYMENT_CONFIRMED",
  "COMPLETED",
] as const;
export const rateBases = [
  "DAY",
  "SHIFT",
  "MONTH",
  "HOUR",
  "PROJECT",
  "NEGOTIATED",
] as const;
export const manpowerRateTypes = [
  "DAY",
  "SHIFT",
  "MONTH",
  "PROJECT",
  "NEGOTIATED",
] as const;
export const manpowerListingStatuses = [
  "ACTIVE",
  "PAUSED",
  "UNAVAILABLE",
  "EXPIRED",
] as const;
export const invitationStatuses = [
  "PENDING",
  "VIEWED",
  "PROPOSAL_SUBMITTED",
  "DECLINED",
  "CANCELLED",
] as const;
export const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
const text = z.string().trim().max(5000);
const uuid = z.uuid();
export const roleLineSchema = z.object({
  role_id: uuid,
  quantity: z.coerce.number().int().min(1).max(1000),
  min_experience: z.coerce.number().min(0).max(60),
  certifications: text.max(1000).default(""),
  desired_skills: text.max(1000).default(""),
  budget: z.coerce.number().min(0).default(0),
});
export const jobSchema = z
  .object({
    title: text.min(8).max(180),
    description: text.min(30),
    scope: text.min(20),
    category_id: uuid,
    city: text.min(2).max(100),
    state: text.min(2).max(100),
    site_name: text.max(180),
    project_type: text.max(120).default(""),
    elevator_type: text.max(120).default(""),
    elevator_count: z.coerce.number().int().min(0).max(10000).default(0),
    overtime: z.coerce.boolean().default(false),
    overtime_rate: z.coerce.number().min(0).default(0),
    uniform: z.enum(["YES", "NO", "NEGOTIABLE"]).default("NO"),
    local_transport: z.enum(["YES", "NO", "NEGOTIABLE"]).default("NO"),
    certifications: text.max(1000).default(""),
    documents_required: text.max(1000).default(""),
    preferred_locations: text.max(500).default(""),
    min_team_size: z.coerce.number().int().min(1).max(10000).default(1),
    max_team_size: z.coerce.number().int().min(1).max(10000).default(10000),
    address: text.max(1000),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    deadline: z.iso.date(),
    duration: text.min(1).max(100),
    shift: text.max(100),
    hours: z.coerce.number().min(1).max(16),
    rate_basis: z.enum(rateBases),
    min_rate: z.coerce.number().min(0),
    max_rate: z.coerce.number().min(0),
    payment_terms: text.min(3),
    individuals: z.boolean(),
    vendors: z.boolean(),
    accommodation: z.enum(["YES", "NO", "NEGOTIABLE"]),
    food: z.enum(["YES", "NO", "NEGOTIABLE"]),
    travel: z.enum(["YES", "NO", "NEGOTIABLE"]),
    ppe: z.enum(["YES", "NO", "NEGOTIABLE"]),
    tools: z.enum(["YES", "NO", "NEGOTIABLE"]),
    safety: text,
    skills: z.array(uuid).max(30),
    lines: z.array(roleLineSchema).min(1).max(20),
    publish: z.boolean(),
  })
  .superRefine((j, ctx) => {
    if (j.max_team_size < j.min_team_size)
      ctx.addIssue({
        code: "custom",
        message: "Maximum team size must be at least the minimum team size.",
      });
    if (j.end_date < j.start_date)
      ctx.addIssue({
        code: "custom",
        message: "End date must follow the start date.",
      });
    if (j.deadline > j.start_date)
      ctx.addIssue({
        code: "custom",
        message: "Application deadline must be on or before the start date.",
      });
    if (j.max_rate < j.min_rate)
      ctx.addIssue({
        code: "custom",
        message: "Maximum rate must be at least the minimum rate.",
      });
    if (!j.individuals && !j.vendors)
      ctx.addIssue({
        code: "custom",
        message: "Accept individual workers, vendors, or both.",
      });
    if (new Set(j.lines.map((l) => l.role_id)).size !== j.lines.length)
      ctx.addIssue({
        code: "custom",
        message: "Each manpower role should appear only once.",
      });
  });
export const submissionSchema = z
  .object({
    job_id: uuid,
    kind: z.enum(["application", "proposal"]),
    job_role_id: uuid.optional(),
    rate: z.coerce.number().min(0).max(100000000),
    rate_basis: z.enum(rateBases),
    start_date: z.iso.date(),
    message: text.min(10),
    experience: text.min(5),
    mobilization_days: z.coerce.number().int().min(0).max(365),
    terms: text,
    confirmed: z.literal(true),
    items: z
      .array(
        z.object({
          job_role_id: uuid,
          quantity: z.coerce.number().int().min(1).max(1000),
        }),
      )
      .max(20),
  })
  .superRefine((s, ctx) => {
    if (s.kind === "application" && !s.job_role_id)
      ctx.addIssue({
        code: "custom",
        message: "Choose the role you are applying for.",
      });
    if (s.kind === "proposal" && !s.items.length)
      ctx.addIssue({ code: "custom", message: "Offer at least one worker." });
    if (new Set(s.items.map((i) => i.job_role_id)).size !== s.items.length)
      ctx.addIssue({ code: "custom", message: "Do not repeat roles." });
  });
const optionalAmount = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? null
      : Number(value),
  z.number().min(0).max(100000000).nullable(),
);
const optionalExperience = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? null
      : Number(value),
  z.number().min(0).max(60).nullable(),
);
export const manpowerListingItemSchema = z
  .object({
    worker_role_id: uuid,
    quantity_available: z.coerce.number().int().min(1).max(1000),
    minimum_experience_years: z.coerce.number().min(0).max(60),
    maximum_experience_years: optionalExperience,
  })
  .superRefine((item, ctx) => {
    if (
      item.maximum_experience_years !== null &&
      item.maximum_experience_years < item.minimum_experience_years
    )
      ctx.addIssue({
        code: "custom",
        message: "Maximum experience must be at least the minimum experience.",
      });
  });
export const manpowerListingSchema = z
  .object({
    id: uuid.optional(),
    title: text.min(8).max(180),
    description: text.min(30).max(5000),
    city: text.min(2).max(100),
    state: text.min(2).max(100),
    available_from: z.iso.date(),
    mobilization_days: z.coerce.number().int().min(0).max(365),
    willing_to_travel: z.coerce.boolean(),
    minimum_engagement_days: z.coerce.number().int().min(0).max(3650),
    rate_type: z.enum(manpowerRateTypes),
    minimum_rate: optionalAmount,
    maximum_rate: optionalAmount,
    currency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/)
      .default("INR"),
    categories: z.array(uuid).max(30).default([]),
    skills: z.array(uuid).max(30).default([]),
    items: z.array(manpowerListingItemSchema).min(1).max(20),
    publish: z.coerce.boolean().default(false),
  })
  .superRefine((listing, ctx) => {
    if (
      listing.maximum_rate !== null &&
      listing.minimum_rate !== null &&
      listing.maximum_rate < listing.minimum_rate
    )
      ctx.addIssue({
        code: "custom",
        message: "Maximum rate must be at least the minimum rate.",
      });
    if (
      listing.rate_type !== "NEGOTIATED" &&
      (listing.minimum_rate === null || listing.maximum_rate === null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Enter a minimum and maximum rate, or choose Negotiable.",
      });
    if (
      new Set(listing.items.map((item) => item.worker_role_id)).size !==
      listing.items.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Each manpower role should appear only once.",
      });
  });
export type Taxon = { id: string; name: string };
export type Profile = {
  supplied_roles?: Taxon[];
  photo_path?: string;
  preferred_locations?: string;
  elevator_types?: string;
  year_established?: number;
  company_size?: string;
  contact_person?: string;
  id: string;
  name: string;
  kind: AccountRole;
  city: string;
  state: string;
  bio: string;
  experience: number;
  primary_role: string;
  availability: string;
  expected_rate: number;
  verified: boolean;
  rating: number;
  completed_count: number;
  phone?: string;
  website?: string;
  languages?: string;
  brands?: string;
  travel?: boolean;
  team_size?: number;
  skills?: Taxon[];
};
export type JobLine = {
  certifications?: string;
  desired_skills?: string;
  budget?: number;
  id: string;
  role_id: string;
  quantity: number;
  min_experience: number;
  filled: number;
  worker_roles: Taxon;
};
export type Job = {
  project_type?: string;
  elevator_type?: string;
  elevator_count?: number;
  overtime?: boolean;
  overtime_rate?: number;
  uniform?: string;
  local_transport?: string;
  certifications?: string;
  documents_required?: string;
  preferred_locations?: string;
  min_team_size?: number;
  max_team_size?: number;
  id: string;
  owner_id: string;
  title: string;
  description: string;
  scope: string;
  category_id: string;
  city: string;
  state: string;
  site_name: string;
  start_date: string;
  end_date: string;
  deadline: string;
  duration: string;
  shift: string;
  hours: number;
  rate_basis: string;
  min_rate: number;
  max_rate: number;
  payment_terms: string;
  individuals: boolean;
  vendors: boolean;
  accommodation: string;
  food: string;
  travel: string;
  ppe: string;
  tools: string;
  safety: string;
  status: (typeof jobStatuses)[number];
  created_at: string;
  profiles: Profile;
  categories: Taxon;
  job_roles: JobLine[];
  job_skills?: { skills: Taxon }[];
};
export type Submission = {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  rate: number;
  rate_basis: string;
  start_date: string;
  message: string;
  experience: string;
  mobilization_days?: number;
  terms?: string;
  job_role_id?: string;
  profiles: Profile;
  jobs: Pick<Job, "id" | "title" | "owner_id">;
  proposal_items?: {
    quantity: number;
    job_role_id: string;
    job_roles: { worker_roles: Taxon };
  }[];
  created_at: string;
  kind: "application" | "proposal";
};
export type ManpowerListingItem = {
  id: string;
  worker_role_id: string;
  quantity_available: number;
  minimum_experience_years: number;
  maximum_experience_years: number | null;
  worker_roles: Taxon;
};
export type ManpowerListing = {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  available_from: string;
  mobilization_days: number;
  willing_to_travel: boolean;
  minimum_engagement_days: number;
  rate_type: (typeof manpowerRateTypes)[number];
  minimum_rate: number | null;
  maximum_rate: number | null;
  currency: string;
  status: (typeof manpowerListingStatuses)[number];
  created_at: string;
  updated_at: string;
  profiles: Profile;
  items: ManpowerListingItem[];
  categories: Taxon[];
  skills: Taxon[];
};
export type VendorInvitation = {
  id: string;
  company_id: string;
  vendor_id: string;
  manpower_listing_id: string;
  requirement_id: string;
  status: (typeof invitationStatuses)[number];
  created_at: string;
  responded_at: string | null;
  jobs: Pick<Job, "id" | "title" | "owner_id" | "status" | "deadline">;
  vendor_manpower_listings: Pick<ManpowerListing, "id" | "title" | "status">;
  company: Pick<Profile, "id" | "name" | "verified">;
  vendor: Pick<Profile, "id" | "name" | "verified">;
};
export type ManpowerFilters = {
  keyword?: string;
  city?: string;
  state?: string;
  role?: string;
  category?: string;
  skill?: string;
  minimumQuantity?: number;
  availableBy?: string;
  willingToTravel?: boolean;
  rateType?: string;
  verified?: boolean;
  sort?: "newest" | "availability" | "capacity";
};
export const totalManpower = (listing: ManpowerListing) =>
  listing.items.reduce((total, item) => total + item.quantity_available, 0);
export const filterManpowerListings = (
  listings: ManpowerListing[],
  filters: ManpowerFilters,
) => {
  const keyword = filters.keyword?.trim().toLowerCase() ?? "";
  return listings
    .filter(
      (listing) =>
        (!keyword ||
          [
            listing.title,
            listing.description,
            listing.city,
            listing.state,
            listing.profiles.name,
            listing.profiles.brands ?? "",
            ...listing.items.map((item) => item.worker_roles.name),
            ...listing.categories.map((category) => category.name),
            ...listing.skills.map((skill) => skill.name),
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword)) &&
        (!filters.city || listing.city === filters.city) &&
        (!filters.state || listing.state === filters.state) &&
        (!filters.role ||
          listing.items.some((item) => item.worker_role_id === filters.role)) &&
        (!filters.category ||
          listing.categories.some((item) => item.id === filters.category)) &&
        (!filters.skill ||
          listing.skills.some((item) => item.id === filters.skill)) &&
        (!filters.minimumQuantity ||
          totalManpower(listing) >= filters.minimumQuantity) &&
        (!filters.availableBy ||
          listing.available_from <= filters.availableBy) &&
        (!filters.willingToTravel || listing.willing_to_travel) &&
        (!filters.rateType || listing.rate_type === filters.rateType) &&
        (!filters.verified || listing.profiles.verified),
    )
    .sort((a, b) =>
      filters.sort === "availability"
        ? a.available_from.localeCompare(b.available_from)
        : filters.sort === "capacity"
          ? totalManpower(b) - totalManpower(a)
          : b.created_at.localeCompare(a.created_at),
    );
};
export const canAllocate = (
  capacity: number,
  filled: number,
  offered: number,
) => Number.isInteger(offered) && offered > 0 && filled + offered <= capacity;

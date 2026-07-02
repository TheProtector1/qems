export type InstituteGoal = {
  title: string;
  description: string;
};

export type InstituteValue = {
  title: string;
  description: string;
};

export type InstituteAchievement = {
  year: string;
  title: string;
  description: string;
};

export type InstituteProfilePayload = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  tagline: string | null;
  vision: string | null;
  mission: string | null;
  goals: InstituteGoal[];
  values: InstituteValue[];
  achievements: InstituteAchievement[];
  foundedYear: number | null;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string;
  directorName: string | null;
};

export function parseGoals(raw: unknown): InstituteGoal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is InstituteGoal => Boolean(g && typeof g === "object" && "title" in g))
    .map((g) => ({
      title: String((g as InstituteGoal).title || ""),
      description: String((g as InstituteGoal).description || ""),
    }))
    .filter((g) => g.title.trim());
}

export function parseValues(raw: unknown): InstituteValue[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is InstituteValue => Boolean(v && typeof v === "object" && "title" in v))
    .map((v) => ({
      title: String((v as InstituteValue).title || ""),
      description: String((v as InstituteValue).description || ""),
    }))
    .filter((v) => v.title.trim());
}

export function parseAchievements(raw: unknown): InstituteAchievement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is InstituteAchievement => Boolean(a && typeof a === "object" && "title" in a))
    .map((a) => ({
      year: String((a as InstituteAchievement).year || ""),
      title: String((a as InstituteAchievement).title || ""),
      description: String((a as InstituteAchievement).description || ""),
    }))
    .filter((a) => a.title.trim());
}

export function serializeInstituteProfile(institute: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  tagline: string | null;
  vision: string | null;
  mission: string | null;
  goals: unknown;
  values: unknown;
  achievements: unknown;
  foundedYear: number | null;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string;
  directorName: string | null;
}): InstituteProfilePayload {
  return {
    id: institute.id,
    name: institute.name,
    slug: institute.slug,
    logo: institute.logo,
    coverImage: institute.coverImage,
    description: institute.description,
    tagline: institute.tagline,
    vision: institute.vision,
    mission: institute.mission,
    goals: parseGoals(institute.goals),
    values: parseValues(institute.values),
    achievements: parseAchievements(institute.achievements),
    foundedYear: institute.foundedYear,
    email: institute.email,
    phone: institute.phone,
    website: institute.website,
    address: institute.address,
    city: institute.city,
    country: institute.country,
    directorName: institute.directorName,
  };
}

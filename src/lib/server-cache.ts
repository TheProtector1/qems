import { unstable_cache } from "next/cache";
import { fetchActiveHolidays } from "@/lib/institute-holidays";

export function getCachedInstituteHolidays(instituteId: string) {
  return unstable_cache(
    () => fetchActiveHolidays(instituteId),
    [`institute-holidays-${instituteId}`],
    { revalidate: 300, tags: [`holidays-${instituteId}`] }
  )();
}

export function getCachedInstituteAnalytics(instituteId: string) {
  return unstable_cache(
    async () => {
      const { getInstituteAnalytics } = await import("@/lib/institute-analytics");
      return getInstituteAnalytics(instituteId);
    },
    [`institute-analytics-${instituteId}`],
    { revalidate: 120, tags: [`analytics-${instituteId}`] }
  )();
}

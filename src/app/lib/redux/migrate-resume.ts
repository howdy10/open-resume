import type { ResumeDescriptionItem } from "lib/redux/types";

const toDescriptionItem = (
  item: string | ResumeDescriptionItem
): ResumeDescriptionItem =>
  typeof item === "string" ? { content: item, isIncluded: true } : item;

/**
 * Work experience descriptions used to be stored as string[]. Resumes saved to
 * localStorage before ResumeDescriptionItem[] was introduced still have that
 * shape, and deepMerge (lib/deep-merge.ts) overwrites arrays wholesale rather
 * than merging them, so the legacy shape would otherwise flow straight into
 * state. This normalizes it before it reaches the store.
 */
export const migrateLegacyResume = (resume: any): any => {
  if (!resume || !Array.isArray(resume.workExperiences)) return resume;

  return {
    ...resume,
    workExperiences: resume.workExperiences.map((workExperience: any) => ({
      ...workExperience,
      descriptions: Array.isArray(workExperience.descriptions)
        ? workExperience.descriptions.map(toDescriptionItem)
        : workExperience.descriptions,
    })),
  };
};

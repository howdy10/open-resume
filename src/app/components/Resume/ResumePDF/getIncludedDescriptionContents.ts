import type { ResumeDescriptionItem } from "lib/redux/types";

export const getIncludedDescriptionContents = (
  descriptions: ResumeDescriptionItem[]
): string[] =>
  descriptions
    .filter(({ isIncluded }) => isIncluded)
    .map(({ content }) => content);

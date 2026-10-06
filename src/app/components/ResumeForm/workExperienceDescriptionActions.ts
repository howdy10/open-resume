import type { ResumeDescriptionItem } from "lib/redux/types";

export const setDescriptionContent = (
  descriptions: ResumeDescriptionItem[],
  idx: number,
  content: string
): ResumeDescriptionItem[] =>
  descriptions.map((description, i) =>
    i === idx ? { ...description, content } : description
  );

export const setDescriptionIncluded = (
  descriptions: ResumeDescriptionItem[],
  idx: number,
  isIncluded: boolean
): ResumeDescriptionItem[] =>
  descriptions.map((description, i) =>
    i === idx ? { ...description, isIncluded } : description
  );

export const moveDescription = (
  descriptions: ResumeDescriptionItem[],
  idx: number,
  direction: "up" | "down"
): ResumeDescriptionItem[] => {
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= descriptions.length) return descriptions;

  const newDescriptions = [...descriptions];
  [newDescriptions[idx], newDescriptions[targetIdx]] = [
    newDescriptions[targetIdx],
    newDescriptions[idx],
  ];
  return newDescriptions;
};

export const deleteDescription = (
  descriptions: ResumeDescriptionItem[],
  idx: number
): ResumeDescriptionItem[] => descriptions.filter((_, i) => i !== idx);

export const addDescription = (
  descriptions: ResumeDescriptionItem[]
): ResumeDescriptionItem[] => [
  ...descriptions,
  { content: "", isIncluded: true },
];

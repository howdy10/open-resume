import { extractWorkExperience } from "lib/parse-resume-from-pdf/extract-resume-from-sections/extract-work-experience";
import type {
  Lines,
  ResumeSectionToLines,
  TextItem,
} from "lib/parse-resume-from-pdf/types";

const makeTextItem = (text: string, overrides: Partial<TextItem> = {}) =>
  ({
    text,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fontName: "Arial",
    hasEOL: true,
    ...overrides,
  } as TextItem);

describe("extractWorkExperience", () => {
  it("wraps each parsed bullet as a ResumeDescriptionItem", () => {
    const lines: Lines = [
      [makeTextItem("ABC Company", { y: 100, fontName: "Arial-Bold" })],
      [makeTextItem("• Led the project to success", { y: 90 })],
      [makeTextItem("• Shipped on time", { y: 80 })],
    ];
    const sections: ResumeSectionToLines = { workExperiences: lines };

    const { workExperiences } = extractWorkExperience(sections);

    expect(workExperiences).toHaveLength(1);
    expect(workExperiences[0].descriptions).toEqual([
      { content: "Led the project to success", isIncluded: true },
      { content: "Shipped on time", isIncluded: true },
    ]);
  });
});

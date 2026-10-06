import {
  addDescription,
  deleteDescription,
  moveDescription,
  setDescriptionContent,
  setDescriptionIncluded,
} from "components/ResumeForm/workExperienceDescriptionActions";
import type { ResumeDescriptionItem } from "lib/redux/types";

const descriptions: ResumeDescriptionItem[] = [
  { content: "a", isIncluded: true },
  { content: "b", isIncluded: true },
  { content: "c", isIncluded: false },
];

describe("setDescriptionContent", () => {
  it("updates only the targeted bullet's content", () => {
    expect(setDescriptionContent(descriptions, 1, "b2")).toEqual([
      { content: "a", isIncluded: true },
      { content: "b2", isIncluded: true },
      { content: "c", isIncluded: false },
    ]);
  });
});

describe("setDescriptionIncluded", () => {
  it("updates only the targeted bullet's isIncluded flag", () => {
    expect(setDescriptionIncluded(descriptions, 0, false)).toEqual([
      { content: "a", isIncluded: false },
      { content: "b", isIncluded: true },
      { content: "c", isIncluded: false },
    ]);
  });
});

describe("moveDescription", () => {
  it("swaps a bullet with its previous neighbor when moving up", () => {
    expect(moveDescription(descriptions, 1, "up")).toEqual([
      { content: "b", isIncluded: true },
      { content: "a", isIncluded: true },
      { content: "c", isIncluded: false },
    ]);
  });

  it("swaps a bullet with its next neighbor when moving down", () => {
    expect(moveDescription(descriptions, 1, "down")).toEqual([
      { content: "a", isIncluded: true },
      { content: "c", isIncluded: false },
      { content: "b", isIncluded: true },
    ]);
  });

  it("is a no-op moving the first bullet up", () => {
    expect(moveDescription(descriptions, 0, "up")).toEqual(descriptions);
  });

  it("is a no-op moving the last bullet down", () => {
    expect(moveDescription(descriptions, 2, "down")).toEqual(descriptions);
  });
});

describe("deleteDescription", () => {
  it("removes only the targeted bullet", () => {
    expect(deleteDescription(descriptions, 1)).toEqual([
      { content: "a", isIncluded: true },
      { content: "c", isIncluded: false },
    ]);
  });
});

describe("addDescription", () => {
  it("appends a new, visible, empty bullet", () => {
    expect(addDescription(descriptions)).toEqual([
      ...descriptions,
      { content: "", isIncluded: true },
    ]);
  });
});

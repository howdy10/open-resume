import { getIncludedDescriptionContents } from "components/Resume/ResumePDF/getIncludedDescriptionContents";

describe("getIncludedDescriptionContents", () => {
  it("returns only the content of included bullets, in order", () => {
    expect(
      getIncludedDescriptionContents([
        { content: "a", isIncluded: true },
        { content: "b", isIncluded: false },
        { content: "c", isIncluded: true },
      ])
    ).toEqual(["a", "c"]);
  });

  it("returns an empty array when every bullet is hidden", () => {
    expect(
      getIncludedDescriptionContents([{ content: "a", isIncluded: false }])
    ).toEqual([]);
  });

  it("returns an empty array for no bullets", () => {
    expect(getIncludedDescriptionContents([])).toEqual([]);
  });
});

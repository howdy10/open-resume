import { migrateLegacyResume } from "lib/redux/migrate-resume";

describe("migrateLegacyResume", () => {
  it("converts legacy string[] work experience descriptions into ResumeDescriptionItem[]", () => {
    const legacyResume = {
      workExperiences: [
        {
          company: "A",
          jobTitle: "Eng",
          date: "2020",
          descriptions: ["did x", "did y"],
        },
      ],
    };

    const migrated = migrateLegacyResume(legacyResume);

    expect(migrated.workExperiences[0].descriptions).toEqual([
      { content: "did x", isIncluded: true },
      { content: "did y", isIncluded: true },
    ]);
  });

  it("leaves already-migrated descriptions untouched", () => {
    const resume = {
      workExperiences: [
        {
          company: "A",
          jobTitle: "Eng",
          date: "2020",
          descriptions: [{ content: "did x", isIncluded: false }],
        },
      ],
    };

    const migrated = migrateLegacyResume(resume);

    expect(migrated.workExperiences[0].descriptions).toEqual([
      { content: "did x", isIncluded: false },
    ]);
  });

  it("passes through resumes with no work experiences untouched", () => {
    expect(migrateLegacyResume(undefined)).toBeUndefined();
    expect(migrateLegacyResume({ profile: { name: "x" } })).toEqual({
      profile: { name: "x" },
    });
  });
});

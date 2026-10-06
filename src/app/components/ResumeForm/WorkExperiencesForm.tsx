import { Form, FormSection } from "components/ResumeForm/Form";
import { Input, InputGroupWrapper } from "components/ResumeForm/Form/InputGroup";
import type { CreateHandleChangeArgsWithDescriptions } from "components/ResumeForm/types";
import { WorkExperienceDescriptionBulletRow } from "components/ResumeForm/WorkExperienceDescriptionBulletRow";
import {
  addDescription,
  deleteDescription,
  moveDescription,
  setDescriptionContent,
  setDescriptionIncluded,
} from "components/ResumeForm/workExperienceDescriptionActions";
import { PlusSmallIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "lib/redux/hooks";
import {
  changeWorkExperiences,
  selectWorkExperiences,
} from "lib/redux/resumeSlice";
import type {
  ResumeDescriptionItem,
  ResumeWorkExperience,
} from "lib/redux/types";

export const WorkExperiencesForm = () => {
  const workExperiences = useAppSelector(selectWorkExperiences);
  const dispatch = useAppDispatch();

  const showDelete = workExperiences.length > 1;

  return (
    <Form form="workExperiences" addButtonText="Add Job">
      {workExperiences.map(({ company, jobTitle, date, descriptions }, idx) => {
        const handleWorkExperienceChange = (
          ...[
            field,
            value,
          ]: CreateHandleChangeArgsWithDescriptions<ResumeWorkExperience>
        ) => {
          // TS doesn't support passing union type to single call signature
          // https://github.com/microsoft/TypeScript/issues/54027
          // any is used here as a workaround
          dispatch(changeWorkExperiences({ idx, field, value } as any));
        };
        const handleDescriptionsChange = (
          newDescriptions: ResumeDescriptionItem[]
        ) => {
          dispatch(
            changeWorkExperiences({
              idx,
              field: "descriptions",
              value: newDescriptions,
            } as any)
          );
        };
        const showMoveUp = idx !== 0;
        const showMoveDown = idx !== workExperiences.length - 1;

        return (
          <FormSection
            key={idx}
            form="workExperiences"
            idx={idx}
            showMoveUp={showMoveUp}
            showMoveDown={showMoveDown}
            showDelete={showDelete}
            deleteButtonTooltipText="Delete job"
          >
            <Input
              label="Company"
              labelClassName="col-span-full"
              name="company"
              placeholder="Khan Academy"
              value={company}
              onChange={handleWorkExperienceChange}
            />
            <Input
              label="Job Title"
              labelClassName="col-span-4"
              name="jobTitle"
              placeholder="Software Engineer"
              value={jobTitle}
              onChange={handleWorkExperienceChange}
            />
            <Input
              label="Date"
              labelClassName="col-span-2"
              name="date"
              placeholder="Jun 2022 - Present"
              value={date}
              onChange={handleWorkExperienceChange}
            />
            <InputGroupWrapper label="Description" className="col-span-full">
              <div className="mt-1 flex flex-col gap-2">
                {descriptions.map((description, descriptionIdx) => (
                  <WorkExperienceDescriptionBulletRow
                    key={descriptionIdx}
                    description={description}
                    showMoveUp={descriptionIdx !== 0}
                    showMoveDown={descriptionIdx !== descriptions.length - 1}
                    onContentChange={(content) =>
                      handleDescriptionsChange(
                        setDescriptionContent(
                          descriptions,
                          descriptionIdx,
                          content
                        )
                      )
                    }
                    onIncludedChange={(isIncluded) =>
                      handleDescriptionsChange(
                        setDescriptionIncluded(
                          descriptions,
                          descriptionIdx,
                          isIncluded
                        )
                      )
                    }
                    onMove={(direction) =>
                      handleDescriptionsChange(
                        moveDescription(descriptions, descriptionIdx, direction)
                      )
                    }
                    onDelete={() =>
                      handleDescriptionsChange(
                        deleteDescription(descriptions, descriptionIdx)
                      )
                    }
                  />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    handleDescriptionsChange(addDescription(descriptions))
                  }
                  className="flex w-fit items-center rounded-md bg-white py-1 pl-2 pr-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <PlusSmallIcon
                    className="-ml-0.5 mr-1 h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                  Add bullet point
                </button>
              </div>
            </InputGroupWrapper>
          </FormSection>
        );
      })}
    </Form>
  );
};

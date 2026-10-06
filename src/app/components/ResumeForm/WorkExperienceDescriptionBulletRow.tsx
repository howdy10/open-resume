import {
  DeleteIconButton,
  MoveIconButton,
  ShowIconButton,
} from "components/ResumeForm/Form/IconButton";
import { INPUT_CLASS_NAME } from "components/ResumeForm/Form/InputGroup";
import { useAutosizeTextareaHeight } from "lib/hooks/useAutosizeTextareaHeight";
import type { ResumeDescriptionItem } from "lib/redux/types";

export const WorkExperienceDescriptionBulletRow = ({
  description,
  showMoveUp,
  showMoveDown,
  onContentChange,
  onIncludedChange,
  onMove,
  onDelete,
}: {
  description: ResumeDescriptionItem;
  showMoveUp: boolean;
  showMoveDown: boolean;
  onContentChange: (content: string) => void;
  onIncludedChange: (isIncluded: boolean) => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}) => {
  const { content, isIncluded } = description;
  const textareaRef = useAutosizeTextareaHeight({ value: content });

  return (
    <div
      className={`flex items-start gap-1 transition-opacity duration-200 ${
        isIncluded ? "" : "opacity-50"
      }`}
    >
      <textarea
        ref={textareaRef}
        className={`${INPUT_CLASS_NAME} mt-0 resize-none overflow-hidden`}
        placeholder="Bullet point"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
      <div className="mt-1 flex shrink-0 items-center gap-0.5">
        <ShowIconButton
          show={isIncluded}
          setShow={onIncludedChange}
          size="small"
          tooltipText={{
            show: "Show bullet point",
            hide: "Hide bullet point",
          }}
        />
        {showMoveUp && (
          <MoveIconButton type="up" size="small" onClick={onMove} />
        )}
        {showMoveDown && (
          <MoveIconButton type="down" size="small" onClick={onMove} />
        )}
        <DeleteIconButton
          onClick={onDelete}
          tooltipText="Delete bullet point"
        />
      </div>
    </div>
  );
};

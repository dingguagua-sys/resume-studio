import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SectionKey } from "../types/resume";

const LABELS: Record<SectionKey, string> = {
  summary: "个人总结",
  experience: "工作经历",
  education: "教育背景",
  skills: "技能",
  projects: "项目",
};

function SortableRow({ id, children }: { id: SectionKey; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="dnd-row">
      <button type="button" className="dnd-handle" {...attributes} {...listeners} aria-label="拖拽排序">
        ⣿
      </button>
      <div className="dnd-row-main">{children}</div>
    </div>
  );
}

type Props = {
  order: SectionKey[];
  onChange: (next: SectionKey[]) => void;
  renderPanel: (key: SectionKey) => ReactNode;
};

export function SortableSections({ order, onChange, renderPanel }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as SectionKey);
    const newIndex = order.indexOf(over.id as SectionKey);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="dnd-list">
          {order.map((key) => (
            <SortableRow key={key} id={key}>
              <div className="dnd-label">{LABELS[key]}</div>
              {renderPanel(key)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

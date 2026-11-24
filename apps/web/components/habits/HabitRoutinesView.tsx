// Habit Stacking & Sequential Routines View with Drag & Drop Reordering
"use client";

import { useMemo } from "react";
import {
  Link2,
  ArrowDown,
  Check,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
} from "lucide-react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Habit } from "@/components/habits/types";
import { HabitIcon } from "./HabitIcon";
import { useHabitStore } from "@/store/habitStore";

interface HabitRoutinesViewProps {
  onOpenCreateStackModal: () => void;
  onOpenEditStackModal: (title: string) => void;
}

interface RoutineStack {
  id: string;
  title: string;
  habits: Habit[];
}

interface SortableHabitStepProps {
  habit: Habit;
  index: number;
  isLast: boolean;
  selectedDate: string;
  isDone: boolean;
  onToggle: (habitId: string) => void;
}

function SortableHabitStep({
  habit,
  index,
  isLast,
  isDone,
  onToggle,
}: SortableHabitStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFirst = index === 0;

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      <div
        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
          isDragging
            ? "shadow-lg opacity-90 scale-102 border-[var(--p)] z-30 bg-[var(--surface-card)]"
            : isDone
              ? "bg-[var(--surface-card)] border-[var(--h)]"
              : "bg-[var(--bg)] border-[var(--h)] hover:border-[var(--m)]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Drag Handle */}
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[var(--m)] hover:text-[var(--i)] touch-none transition-colors"
            title="Drag to reorder habit"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>

          {/* Step Number Badge */}
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-[var(--s)] text-[var(--m)] border border-[var(--h)] flex-shrink-0">
            {index + 1}
          </div>

          {/* Icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${habit.color}15`,
              color: habit.color,
              border: `1px solid ${habit.color}30`,
            }}
          >
            <HabitIcon name={habit.icon} size={18} color={habit.color} />
          </div>

          {/* Habit details */}
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[var(--i)] block truncate">
              {habit.name}
            </span>
            <span className="text-[11px] text-[var(--m)] block truncate">
              {isFirst
                ? "Trigger cue: Wake up / Start routine"
                : `Triggers immediately after Step ${index}`}
            </span>
          </div>
        </div>

        {/* Interactive Check-in */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(habit.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isDone
                ? "bg-[#10b981] text-white"
                : "border border-[var(--h)] text-transparent hover:text-[var(--m)]"
            }`}
            title={isDone ? "Mark incomplete" : "Mark complete"}
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Directional Connector Arrow */}
      {!isLast && (
        <div className="flex items-center justify-center py-1">
          <ArrowDown size={14} className="text-[var(--m)]" />
        </div>
      )}
    </div>
  );
}

function RoutineStackCard({
  stack,
  selectedDate,
  onToggleCheckIn,
  onEditStack,
  onDeleteStack,
  onReorderStack,
}: {
  stack: RoutineStack;
  selectedDate: string;
  onToggleCheckIn: (id: string, date: string) => void;
  onEditStack: (title: string) => void;
  onDeleteStack: (title: string) => void;
  onReorderStack: (title: string, habitIds: string[]) => void;
}) {
  const { checkIns } = useHabitStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const completedCount = stack.habits.filter(
    (h) => checkIns[`${h.id}_${selectedDate}`]?.completed,
  ).length;
  const totalCount = stack.habits.length;
  const isComplete = totalCount > 0 && completedCount >= totalCount;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stack.habits.findIndex((h) => h.id === active.id);
      const newIndex = stack.habits.findIndex((h) => h.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(stack.habits, oldIndex, newIndex);
        onReorderStack(
          stack.title,
          reordered.map((h) => h.id),
        );
      }
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg)] border border-[var(--h)] shadow-2xs">
      {/* Stack Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--h)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--i)]">
              {stack.title}
            </h3>
            <span
              className={`badge-pill text-[10px] font-medium ${
                isComplete
                  ? "bg-[#10b981]/15 text-[#059669] border-[#10b981]/30"
                  : "bg-[var(--s)] text-[var(--m)] border-[var(--h)]"
              }`}
            >
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <p className="text-xs text-[var(--m)] mt-0.5">
            {stack.habits.length} habits chained · Drag grip to reorder steps
          </p>
        </div>

        {/* Stack Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEditStack(stack.title)}
            className="ib w-7 h-7 flex items-center justify-center text-[var(--m)] hover:text-[var(--i)]"
            title="Edit stack"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Unlink all habits from "${stack.title}"?`)) {
                onDeleteStack(stack.title);
              }
            }}
            className="ib w-7 h-7 flex items-center justify-center text-[var(--error)] hover:bg-[var(--s)]"
            title="Unlink stack"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Sortable Habits List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stack.habits.map((h) => h.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {stack.habits.map((habit, index) => (
              <SortableHabitStep
                key={habit.id}
                habit={habit}
                index={index}
                isLast={index === stack.habits.length - 1}
                selectedDate={selectedDate}
                isDone={Boolean(
                  checkIns[`${habit.id}_${selectedDate}`]?.completed,
                )}
                onToggle={(id) => onToggleCheckIn(id, selectedDate)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function HabitRoutinesView({
  onOpenCreateStackModal,
  onOpenEditStackModal,
}: HabitRoutinesViewProps) {
  const {
    habits,
    selectedDate,
    toggleCheckIn,
    reorderRoutineStack,
    deleteHabitStack,
  } = useHabitStore();

  // Group habits by routine or stacked chains
  const routineStacks: RoutineStack[] = useMemo(() => {
    const active = habits.filter((h) => h.status === "active");

    const routineMap = new Map<string, Habit[]>();

    for (const h of active) {
      if (h.stackRoutineTitle) {
        if (!routineMap.has(h.stackRoutineTitle)) {
          routineMap.set(h.stackRoutineTitle, []);
        }
        routineMap.get(h.stackRoutineTitle)!.push(h);
      }
    }

    const stacks: RoutineStack[] = [];
    routineMap.forEach((groupHabits, title) => {
      // Order habits by stack predecessor
      const ordered: Habit[] = [];
      const visited = new Set<string>();

      const root = groupHabits.find(
        (h) =>
          !h.stackedAfterHabitId ||
          !groupHabits.some((other) => other.id === h.stackedAfterHabitId),
      );

      let curr: Habit | undefined = root;
      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);
        ordered.push(curr);
        curr = groupHabits.find((h) => h.stackedAfterHabitId === curr?.id);
      }

      for (const h of groupHabits) {
        if (!visited.has(h.id)) {
          ordered.push(h);
        }
      }

      stacks.push({
        id: `stack-${title.toLowerCase().replace(/\s+/g, "-")}`,
        title,
        habits: ordered,
      });
    });

    return stacks;
  }, [habits]);

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Intro Banner */}
      <div className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-[var(--accent)]" />
            <h2 className="text-base font-semibold text-[var(--i)] tracking-tight">
              Habit Stacking & Sequential Routines
            </h2>
          </div>
          <p className="text-xs text-[var(--m)] max-w-xl mt-1">
            Build bulletproof consistency using behavioral momentum: anchor a
            new habit directly after an existing cue or routine (&quot;After I
            [Current Habit], I will [Next Habit]&quot;). Drag habits to
            instantly reorder sequence steps.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateStackModal}
          className="bt p flex items-center gap-2 text-xs font-semibold self-start sm:self-auto shadow-xs"
        >
          <Plus size={14} />
          <span>New Habit Stack</span>
        </button>
      </div>

      {/* Routine Stacks */}
      {routineStacks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface-card)] border border-[var(--h)] flex flex-col items-center">
          <div className="p-3.5 rounded-2xl bg-[var(--s)] text-[var(--m)] mb-3">
            <Link2 size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--i)]">
            No Habit Stacks Created
          </h3>
          <p className="text-xs text-[var(--m)] max-w-sm mt-1 mb-4">
            Link habits together into automated routines like a Morning Ritual
            or Evening Wind-Down.
          </p>
          <button
            type="button"
            onClick={onOpenCreateStackModal}
            className="bt p text-xs font-semibold flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Create First Habit Stack</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {routineStacks.map((stack) => (
            <RoutineStackCard
              key={stack.id}
              stack={stack}
              selectedDate={selectedDate}
              onToggleCheckIn={toggleCheckIn}
              onEditStack={onOpenEditStackModal}
              onDeleteStack={deleteHabitStack}
              onReorderStack={reorderRoutineStack}
            />
          ))}
        </div>
      )}
    </div>
  );
}

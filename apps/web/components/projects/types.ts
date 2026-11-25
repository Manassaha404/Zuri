// Projects & Kanban Board Types and Interfaces

export type SwimlaneMode = "none" | "priority" | "assignee";

export type CardPriority = "low" | "medium" | "high" | "urgent";

export interface BoardLabel {
  id: string;
  name: string;
  color: string;
}

export interface BoardChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface BoardComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  projectId: string;
  title: string;
  position: string;
  wipLimit?: number;
  isDoneColumn?: boolean;
}

export interface BoardCard {
  id: string;
  projectId: string;
  columnId: string;
  position: string;
  title: string;
  description?: string;
  labels: BoardLabel[];
  priority: CardPriority;
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  assignee?: string;
  checklist: BoardChecklistItem[];
  comments: BoardComment[];
  sprintId?: string;
  milestoneId?: string;
  storyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardSprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface BoardMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
}

export interface BoardFilterState {
  searchQuery: string;
  labelFilter: string | null;
  assigneeFilter: string | "all";
  priorityFilter: CardPriority | "all";
  sprintFilter: string | "all";
}

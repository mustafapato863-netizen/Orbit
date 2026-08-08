"use client";

import {
  Check,
  CheckCircle2,
  Circle,
  ListTodo,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type TodoPriority = "low" | "medium" | "high";

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: TodoPriority;
};

const STORAGE_KEY = "orbit_header_todo_items_v1";

const DEFAULT_TODOS: TodoItem[] = [
  {
    id: "default-1",
    text: "Review Pilot release entry criteria",
    completed: false,
    createdAt: Date.now() - 3600000,
    priority: "high",
  },
  {
    id: "default-2",
    text: "Check UAT approval status with PM",
    completed: true,
    createdAt: Date.now() - 7200000,
    priority: "medium",
  },
];

export function HeaderTodoWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<TodoPriority>("medium");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTodos(JSON.parse(stored));
      } else {
        setTodos(DEFAULT_TODOS);
      }
    } catch {
      setTodos(DEFAULT_TODOS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.error("Failed to save todos to localStorage", err);
    }
  }, [todos, isLoaded]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const completionPercentage =
    todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = todos
    .filter((todo) => {
      if (filterTab === "active") return !todo.completed;
      if (filterTab === "completed") return todo.completed;
      return true;
    })
    .filter((todo) =>
      todo.text.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    );

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;

    const newItem: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      priority: newPriority,
    };

    setTodos((prev) => [newItem, ...prev]);
    setNewText("");
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Header Icon Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex size-[34px] items-center justify-center rounded-[9px] border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--orbit-purple)]",
          isOpen
            ? "border-[var(--orbit-purple)] bg-[#f3f0ff] text-[var(--orbit-purple)] dark:bg-slate-800 dark:text-purple-400"
            : "border-transparent text-[var(--orbit-text-muted)] hover:border-[var(--orbit-border)] hover:bg-[var(--orbit-grey-soft)]",
        )}
        aria-label="Personal To-Do List & Quick Notes"
        title="Personal To-Do List & Quick Notes"
      >
        <ListTodo className="size-4" />
        {isLoaded && activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-indigo-600 text-[0.625rem] font-bold text-white shadow-2xs">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 transition-all animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: "min(24rem, 90vw)" }}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <ListTodo className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Quick To-Do & Notes
                </h3>
                <p className="text-[0.6875rem] text-slate-500 dark:text-slate-400">
                  Stored locally in browser
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close notes popover"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Progress Bar */}
          {todos.length > 0 && (
            <div className="my-3 space-y-1">
              <div className="flex items-center justify-between text-[0.6875rem] font-semibold text-slate-600 dark:text-slate-400">
                <span>Progress</span>
                <span>
                  {completedCount} of {todos.length} ({completionPercentage}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Add a task or note..."
                className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!newText.trim()}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-[0.6875rem]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Priority:
              </span>
              <div className="flex gap-1">
                {(["low", "medium", "high"] as TodoPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={cn(
                      "rounded-md px-2 py-0.5 capitalize transition-colors text-[0.625rem] font-bold cursor-pointer",
                      newPriority === p
                        ? p === "high"
                          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-500/30 dark:bg-rose-950 dark:text-rose-300"
                          : p === "medium"
                            ? "bg-amber-100 text-amber-700 ring-1 ring-amber-500/30 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700 ring-1 ring-blue-500/30 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Filter & Search Bar */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {(["all", "active", "completed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[0.625rem] font-bold capitalize transition-colors cursor-pointer",
                    filterTab === tab
                      ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-700 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {todos.some((t) => t.completed) && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-[0.625rem] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
              >
                Clear done
              </button>
            )}
          </div>

          {/* Todo List */}
          <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
            {filteredTodos.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                {searchQuery
                  ? "No matching notes found."
                  : filterTab === "active"
                    ? "No pending tasks! 🎉"
                    : filterTab === "completed"
                      ? "No completed tasks yet."
                      : "No notes added yet. Create one above!"}
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "group flex items-start justify-between gap-2 rounded-lg border p-2 text-xs transition-all",
                    todo.completed
                      ? "border-slate-100 bg-slate-50/60 text-slate-400 dark:border-slate-800/60 dark:bg-slate-800/30"
                      : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTodo(todo.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <Circle className="size-4" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "flex-1 break-words font-medium text-[0.75rem] leading-snug",
                      todo.completed && "line-through text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {todo.text}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.25 text-[0.5625rem] font-bold uppercase",
                        todo.priority === "high"
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                          : todo.priority === "medium"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
                      )}
                    >
                      {todo.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

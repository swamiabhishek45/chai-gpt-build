"use client";

import React, { useState, useRef, useEffect } from "react";
import { GitBranch, ChevronDown, Plus, Pencil, Trash, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranches, useSwitchBranch, useRenameBranch, useDeleteBranch, useCreateBranch } from "../hooks/use-branches";

interface BranchSelectorProps {
  conversationId: string;
  currentBranchId: string | null;
}

export function BranchSelector({ conversationId, currentBranchId }: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: branches, isLoading } = useBranches(conversationId);
  const createBranchMutation = useCreateBranch(conversationId);
  const switchBranchMutation = useSwitchBranch(conversationId);
  const renameBranchMutation = useRenameBranch(conversationId);
  const deleteBranchMutation = useDeleteBranch(conversationId);

  // Resolve current active branch
  const activeBranch = branches?.find((b) => b.id === currentBranchId) || branches?.[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingBranchId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    // Branch from the current branch's latest message (which is leafMessageId)
    // If no leafMessageId, it will branch from null (start of chat)
    const activeLeafId = activeBranch?.leafMessageId || null;

    try {
      await createBranchMutation.mutateAsync({
        name: newBranchName,
        branchingMessageId: activeLeafId,
      });
      setNewBranchName("");
      setIsCreating(false);
      setIsOpen(false);
    } catch {
      // Error handled in hook toast
    }
  };

  const handleRenameBranch = async (branchId: string) => {
    if (!editingName.trim()) return;

    try {
      await renameBranchMutation.mutateAsync({
        branchId,
        name: editingName,
      });
      setEditingBranchId(null);
    } catch {
      // Error handled in hook toast
    }
  };

  const handleDeleteBranch = async (e: React.MouseEvent, branchId: string) => {
    e.stopPropagation(); // Prevent switching to branch when deleting
    
    if (confirm("Are you sure you want to delete this branch? All messages unique to this branch will be permanently lost.")) {
      try {
        await deleteBranchMutation.mutateAsync(branchId);
      } catch {
        // Error handled in hook toast
      }
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 select-none",
          isOpen
            ? "bg-accent/80 border-accent text-accent-foreground shadow-sm"
            : "bg-muted/40 hover:bg-muted/75 border-border/80 text-muted-foreground hover:text-foreground"
        )}
      >
        <GitBranch size={13} className="text-primary" />
        <span className="max-w-[120px] truncate">
          {isLoading ? "Loading..." : activeBranch?.name || "Main"}
        </span>
        <ChevronDown size={12} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-popover/95 backdrop-blur-md border border-border rounded-xl shadow-lg p-2.5 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Branches
          </div>

          <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
            {branches?.map((branch) => {
              const isActive = branch.id === activeBranch?.id;
              const isEditing = branch.id === editingBranchId;

              return (
                <div
                  key={branch.id}
                  onClick={() => {
                    if (!isActive && !isEditing) {
                      switchBranchMutation.mutate(branch.id);
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all duration-150 group select-none",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "hover:bg-muted/80 text-foreground cursor-pointer"
                  )}
                >
                  {isEditing ? (
                    // Rename input state
                    <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameBranch(branch.id)}
                        className="text-emerald-500 hover:text-emerald-600 p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 rounded transition-colors"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setEditingBranchId(null)}
                        className="text-destructive hover:text-destructive/80 p-0.5 hover:bg-destructive/10 rounded transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    // Standard display state
                    <>
                      <span className="truncate max-w-[150px]">{branch.name}</span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBranchId(branch.id);
                            setEditingName(branch.name);
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5 hover:bg-muted rounded transition-colors"
                          title="Rename branch"
                        >
                          <Pencil size={11} />
                        </button>
                        {branches.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteBranch(e, branch.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5 hover:bg-muted rounded transition-colors"
                            title="Delete branch"
                          >
                            <Trash size={11} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create Branch form/trigger */}
          {isCreating ? (
            <form onSubmit={handleCreateBranch} className="border-t border-border mt-2 pt-2 px-1 flex flex-col gap-1.5">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Branch name (e.g. Draft 1)"
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2 py-1 text-[11px] font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBranchMutation.isPending}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/95 transition-colors inline-flex items-center gap-1"
                >
                  {createBranchMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center justify-center gap-1.5 border-t border-border mt-2 pt-2 pb-0.5 w-full text-[11px] text-primary hover:text-primary-foreground hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-all font-semibold"
            >
              <Plus size={12} />
              Create new branch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

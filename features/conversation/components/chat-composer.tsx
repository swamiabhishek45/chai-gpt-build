"use client";

import * as React from "react";
import { ArrowUp, Paperclip, Mic, Globe, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  onSend: (content: string) => Promise<void> | void;
  isSending?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function ChatComposer({
  onSend,
  isSending = false,
  placeholder = "Message ChaiGPT…",
  className,
  autoFocus = false,
}: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const [webSearchActive, setWebSearchActive] = React.useState(true);
  const [reasoningActive, setReasoningActive] = React.useState(false);
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow height logic
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`; // cap at 192px (max-h-48)
  }, [value]);

  React.useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const content = value.trim();
    if (!content || isSending) return;

    setValue("");
    await onSend(content);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !isSending;

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={cn("mx-auto w-full max-w-4xl px-4 pb-6 md:px-8 shrink-0", className)}
    >
      <div className="relative flex flex-col w-full rounded-2xl border border-border/60 bg-background/95 dark:bg-card/40 shadow-lg p-2 transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20 backdrop-blur-md">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSending}
          rows={1}
          className="w-full resize-none bg-transparent py-2.5 px-3.5 text-[15px] leading-relaxed placeholder:text-muted-foreground/45 focus:outline-none max-h-48 min-h-[44px] text-foreground"
        />

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30 px-2.5">
          {/* Left Toggles / Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 rounded-xl transition-all cursor-pointer"
              title="Attach files (disabled)"
            >
              <Paperclip size={14.5} />
            </button>
            <button
              type="button"
              className="p-2 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 rounded-xl transition-all cursor-pointer"
              title="Voice Input (disabled)"
            >
              <Mic size={14.5} />
            </button>

            <div className="h-4 w-px bg-border/40 mx-1.5" />

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={() => setWebSearchActive(!webSearchActive)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200 cursor-pointer select-none",
                webSearchActive
                  ? "bg-primary/5 text-primary border-primary/20 dark:bg-primary/10"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Globe size={11.5} className={cn("transition-colors", webSearchActive ? "text-primary animate-pulse" : "text-muted-foreground")} />
              <span className="hidden sm:inline">Web Search</span>
            </button>

            {/* Reasoning Toggle */}
            <button
              type="button"
              onClick={() => setReasoningActive(!reasoningActive)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-200 cursor-pointer select-none",
                reasoningActive
                  ? "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:bg-amber-500/10"
                  : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Sparkles size={11.5} className={cn("transition-colors", reasoningActive ? "text-amber-500 animate-pulse" : "text-muted-foreground")} />
              <span className="hidden sm:inline">Reasoning</span>
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!canSend}
            className={cn(
              "flex size-8.5 items-center justify-center rounded-xl transition-all duration-200 shadow-sm cursor-pointer",
              canSend
                ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                : "bg-muted/40 text-muted-foreground/30 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="size-4.5 animate-spin" /> : <ArrowUp size={15} />}
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground/60 select-none">
        ChaiGPT can make mistakes. Consider checking important sources.
      </p>
    </form>
  );
}
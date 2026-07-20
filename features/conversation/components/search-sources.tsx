"use client";

import React from "react";
import { Search, Globe, ChevronDown, Check, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchResult } from "@/features/ai/utils/search";

interface SearchSourcesProps {
  query: string;
  isCompleted: boolean;
  result?: any;
}

export function SearchSources({ query, isCompleted, result }: SearchSourcesProps) {
  // Check for error responses
  const isError = result && typeof result === "object" && "error" in result && result.error;
  const errorMessage = isError ? result.message || "Failed to retrieve results" : null;

  // Extract source results
  let sources: SearchResult[] = [];
  if (Array.isArray(result)) {
    sources = result;
  } else if (result && typeof result === "object" && "results" in result && Array.isArray(result.results)) {
    sources = result.results;
  } else if (result && typeof result === "object" && Array.isArray(result)) {
    sources = result;
  }

  // Extract hostname domain and favicon url helper
  const getDomain = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      return url.hostname.replace("www.", "");
    } catch {
      return "";
    }
  };

  const hasSources = sources.length > 0;

  return (
    <div className="w-full">
      <Accordion className="w-full border-none">
        <AccordionItem value="sources" className="border-none">
          {/* Custom Accordion Trigger header styling */}
          <AccordionTrigger className="w-full flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:no-underline transition-all duration-300 group">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground/80 group-hover:text-foreground transition-colors select-none">
              {isError ? (
                <AlertTriangle size={14} className="text-destructive animate-pulse" />
              ) : !isCompleted ? (
                <Loader2 size={13} className="text-primary animate-spin" />
              ) : (
                <Check size={13} className="text-emerald-500 font-bold" />
              )}
              
              <span className="flex-1 text-left">
                {isError
                  ? `Search failed: "${query}"`
                  : !isCompleted
                  ? `Searching web: "${query}"...`
                  : `Searched web: "${query}"`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 shrink-0 font-medium select-none pr-1">
              {isCompleted && !isError && (
                <>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {sources.length} sources
                  </span>
                  <span>•</span>
                  <span>0.7s</span>
                </>
              )}
            </div>
          </AccordionTrigger>

          {/* Accordion Content rendering citation cards */}
          <AccordionContent className="pt-2 px-1 pb-1">
            {isError && (
              <div className="text-xs text-destructive flex items-start gap-1.5 p-3 rounded-xl bg-destructive/5 border border-destructive/15 mt-2 animate-in fade-in duration-200">
                <span>{errorMessage}</span>
              </div>
            )}

            {hasSources && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {sources.map((source, index) => {
                  const domain = getDomain(source.url);
                  const faviconUrl = domain
                    ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
                    : null;

                  return (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border/50 bg-card/30 text-left hover:bg-card/90 hover:border-primary/20 transition-all duration-300 group shadow-sm hover:shadow-md relative overflow-hidden"
                    >
                      {/* Top bar: favicon & domain name */}
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1.5">
                          {faviconUrl ? (
                            <img
                              src={faviconUrl}
                              alt=""
                              className="w-3.5 h-3.5 rounded-sm object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Globe size={11} className="text-muted-foreground/60" />
                          )}
                          <span className="text-[10px] text-muted-foreground/75 font-sans font-medium truncate max-w-[140px]">
                            {domain}
                          </span>
                        </div>
                        <ExternalLink size={9.5} className="text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Title */}
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-normal">
                        {source.title}
                      </div>

                      {/* Snippet snippet */}
                      <p className="text-[10.5px] text-muted-foreground/75 line-clamp-2 leading-relaxed">
                        {source.content}
                      </p>
                    </a>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

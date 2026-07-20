"use client";
import React, { useState } from "react";
import { Search, Globe, ChevronDown, ChevronUp, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/features/ai/utils/search";
interface SearchSourcesProps {
    query: string;
    isCompleted: boolean;
    result?: any;
}
export function SearchSources({ query, isCompleted, result }: SearchSourcesProps) {
    const [isOpen, setIsOpen] = useState(false);
    // If there's an error response
    const isError = result && typeof result === "object" && "error" in result && result.error;
    const errorMessage = isError ? result.message || "Failed to retrieve results" : null;
    // Extract results array
    let sources: SearchResult[] = [];
    if (Array.isArray(result)) {
        sources = result;
    } else if (result && typeof result === "object" && "results" in result && Array.isArray(result.results)) {
        sources = result.results;
    } else if (result && typeof result === "object" && Array.isArray(result)) {
        sources = result;
    }
    // Get domain name for display and favicon
    const getDomain = (urlStr: string) => {
        try {
            const url = new URL(urlStr);
            return url.hostname.replace("www.", "");
        } catch {
            return "";
        }
    };
    return (
        <div className="w-full flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-muted-foreground/30">
            {/* Header / Pill */}
            <div
                className={cn(
                    "flex items-center justify-between cursor-pointer select-none",
                    sources.length > 0 && "hover:opacity-90"
                )}
                onClick={() => sources.length > 0 && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {isError ? (
                        <AlertTriangle size={14} className="text-destructive animate-pulse" />
                    ) : !isCompleted ? (
                        <Search size={14} className="text-primary animate-pulse" />
                    ) : (
                        <Check size={14} className="text-emerald-500" />
                    )}
                    <span>
                        {isError
                            ? `Search failed for: "${query}"`
                            : !isCompleted
                                ? `Searching the web for: "${query}"...`
                                : `Searched the web for: "${query}"`}
                    </span>
                </div>
                {sources.length > 0 && (
                    <button className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors">
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>
            {/* Error State */}
            {isError && (
                <div className="mt-2 text-xs text-destructive flex items-start gap-1.5 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <span>{errorMessage}</span>
                </div>
            )}
            {/* Expanded Sources Grid */}
            {isOpen && sources.length > 0 && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
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
                                className="flex flex-col gap-1 p-2.5 rounded-lg border border-border/80 bg-muted/30 text-left hover:bg-muted/80 hover:border-muted-foreground/20 transition-all duration-200 group relative overflow-hidden"
                            >
                                {/* Source Top: Favicon & Domain */}
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
                                            <Globe size={12} className="text-muted-foreground" />
                                        )}
                                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-30">
                                            {domain}
                                        </span>
                                    </div>
                                    <ExternalLink size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {/* Title */}
                                <div className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {source.title}
                                </div>
                                {/* Content snippet */}
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {source.content}
                                </p>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

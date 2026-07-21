"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Code, FileText, ArrowUpRight, Plus, Terminal } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface ChatEmptyProps {
  onSend?: (content: string) => void;
}

export function ChatEmpty({ onSend }: ChatEmptyProps) {
  const suggestions = [
    {
      title: "Build a SaaS App",
      description: "Design a clean landing page schema with React and Tailwind.",
      icon: Code,
      prompt: "Build a modern SaaS landing page component in React using Tailwind CSS, featuring a responsive navigation bar, a hero section with a gradient, and a pricing table.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Debug my React App",
      description: "Find issues in a state update function or infinite rendering loops.",
      icon: Terminal,
      prompt: "Analyze why my React component is triggering an infinite render loop. Here is the code snippet:\n\nuseEffect(() => {\n  const data = fetchData();\n  setResponse(data);\n}, [response]);",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Summarize a Document",
      description: "Extract core metrics, takeaways, and action items.",
      icon: FileText,
      prompt: "Extract the key metrics, main takeaways, and critical action items from this text, and present them in a clean markdown table.",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  // Container motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  } as const;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col items-center text-center gap-10 py-12"
      >
        {/* Glowing Geometric Logo */}
        <motion.div variants={itemVariants} className="relative flex items-center justify-center">
          <div className="absolute inset-0 size-16 bg-primary/25 rounded-2xl blur-xl animate-pulse" />
          <div className="relative size-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/25 overflow-hidden">
            <Logo className="size-8 stroke-primary-foreground fill-primary-foreground" />
          </div>
        </motion.div>

        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-3 max-w-lg">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What can we build today?
          </h2>
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed">
            ChaiGPT is enhanced with web search, tree-style branching, and precise reasoning. Ask anything to begin.
          </p>
        </motion.div>

        {/* Suggestions Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4"
        >
          {suggestions.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => onSend?.(item.prompt)}
                className={cn(
                  "flex flex-col text-left p-5 rounded-2xl border bg-card/30 border-border/60 hover:border-primary/30 hover:bg-card/70 transition-all duration-300 group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
                )}
              >
                {/* Visual Accent Hover Effect */}
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} className="text-primary" />
                </div>

                <div className={cn("size-8 rounded-xl flex items-center justify-center mb-3 border", item.bg, item.border)}>
                  <Icon size={14} className={item.color} />
                </div>

                <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                  {item.title}
                </h3>
                
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1.5 flex-1">
                  {item.description}
                </p>
              </button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
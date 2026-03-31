'use client';

import React, { Suspense, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GenerativeSection } from "@/types/flow";
import { TEMPLATE_REGISTRY, REQUIRED_PROPS } from "@/data/templateRegistry";

const SELF_ANIMATED_TEMPLATES = new Set([
  "JobDetailSheet",
  "JobSearchSheet", 
  "Dashboard",
]);

interface DynamicSectionLoaderProps {
  sections: GenerativeSection[];
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders ALL active sections sent by the Runtime Agent via navigateToSection.
 *
 * Each section is rendered as an `absolute inset-0` layer stacked in array order
 * (first section = bottom, last section = top). This enables simultaneous
 * composition, e.g. Dashboard (profile button) + ProfileSheet (bottom card)
 * or Dashboard + JobSearchSheet, etc.
 */
export function DynamicSectionLoader({ sections }: DynamicSectionLoaderProps) {
  // Validation runs on the last (most recently added) section.
  const current = sections[sections.length - 1];
  const loadCountRef = useRef(0);
  const prevIdRef = useRef<string>("");

  useEffect(() => {
    if (!current) return;

    if (current.id !== prevIdRef.current) {
      prevIdRef.current = current.id;
      loadCountRef.current += 1;
    }

    // Validate required props on the newest section only
    const required = REQUIRED_PROPS[current.templateId] ?? [];
    const missing = required.filter(
      (k) => !(k in current.props) || current.props[k] == null
    );
    if (missing.length > 0) {
      console.warn(
        `Template "${current.templateId}" is missing required props: ${missing.join(", ")}`
      );
    }
  }, [current]);

  useEffect(() => {
    if (!current || TEMPLATE_REGISTRY[current.templateId]) return;
    console.warn(
      `templateId "${current.templateId}" not found. Available: ${Object.keys(TEMPLATE_REGISTRY).join(", ")}`
    );
  }, [current?.templateId]);

  if (sections.length === 0) return null;

  return (
    <AnimatePresence>
      {sections.map((section) => {
        const Template = TEMPLATE_REGISTRY[section.templateId];

        if (!Template) {
          return (
            <motion.div
              key={section.id}
              data-testid="section-not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-[var(--bg)] flex items-center justify-center"
            >
              <div className="text-white/60">Template not found: {section.templateId}</div>
            </motion.div>
          );
        }

        const sanitizedProps = Object.fromEntries(
          Object.entries(section.props).filter(([, v]) => v !== null)
        );

        const skipFade = SELF_ANIMATED_TEMPLATES.has(section.templateId);

        if (skipFade) {
          return (
            <div
              key={section.id}
              data-testid={`section-${section.templateId}`}
              className="absolute inset-0"
            >
              <ErrorBoundary fallback={<div className="w-full h-full" />}>
                <Suspense fallback={<div className="w-full h-full" />}>
                  <Template {...sanitizedProps} />
                </Suspense>
              </ErrorBoundary>
            </div>
          );
        }

        return (
          <motion.div
            key={section.id}
            data-testid={`section-${section.templateId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <ErrorBoundary fallback={<div className="w-full h-full" />}>
              <Suspense fallback={<div className="w-full h-full" />}>
                <Template {...sanitizedProps} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
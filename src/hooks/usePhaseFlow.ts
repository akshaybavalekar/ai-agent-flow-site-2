import { useState, useCallback, useEffect, useRef } from "react";
import type { GenerativeSection } from "@/types/flow";

const INITIAL_SECTIONS: GenerativeSection[] = [
  { id: "welcome", templateId: "WelcomeLanding", props: {} },
];

/**
 * Simplified version of trainco's usePhaseFlow hook.
 * Manages the active generativeSubsections driven by navigateToSection calls.
 */
export function usePhaseFlow() {
  const [generativeSubsections, setGenerativeSections] =
    useState<GenerativeSection[]>(INITIAL_SECTIONS);

  const navigateToSection = useCallback(
    (...args: unknown[]): boolean | { disableNewResponseCreation: boolean } => {
      try {
        console.log('navigateToSection called with:', args);
        
        // Handle simple template navigation for now
        if (args.length === 1 && typeof args[0] === 'string') {
          const templateId = args[0];
          const newSection: GenerativeSection = {
            id: `${templateId}-${Date.now()}`,
            templateId,
            props: {}
          };
          
          setGenerativeSections([newSection]);
          return true;
        }

        // Handle object payload
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
          const payload = args[0] as any;
          
          if (payload.generativeSubsections && Array.isArray(payload.generativeSubsections)) {
            const sections = payload.generativeSubsections.map((section: any, index: number) => ({
              id: section.id || `${section.templateId}-${Date.now()}-${index}`,
              templateId: section.templateId,
              props: section.props || {}
            }));
            
            setGenerativeSections(sections);
            return true;
          }
          
          if (payload.templateId) {
            const newSection: GenerativeSection = {
              id: payload.id || `${payload.templateId}-${Date.now()}`,
              templateId: payload.templateId,
              props: payload.props || {}
            };
            
            setGenerativeSections([newSection]);
            return true;
          }
        }

        return false;
      } catch (error) {
        console.error('navigateToSection error:', error);
        return false;
      }
    },
    []
  );

  // Patch UIFrameworkSiteFunctions so the voice AI can call navigateToSection
  useEffect(() => {
    const siteFns = (
      window as unknown as {
        UIFrameworkSiteFunctions?: Record<string, unknown>;
      }
    ).UIFrameworkSiteFunctions;

    if (!siteFns || typeof siteFns !== "object") {
      (window as any).UIFrameworkSiteFunctions = {};
    }

    (window as any).UIFrameworkSiteFunctions.navigateToSection = navigateToSection;

    console.log('Patched UIFrameworkSiteFunctions.navigateToSection');
  }, [navigateToSection]);

  return { generativeSubsections };
}
import { usePhaseFlow } from '@/hooks/usePhaseFlow';
import { DynamicSectionLoader } from '@/components/DynamicSectionLoader';
import { SceneLayout } from '@/components/voice/SceneLayout';

/**
 * Wraps the existing talent (job-seeker) AI journey.
 * Uses the template system for navigation after voice connection.
 */
export function TalentApp() {
  const { generativeSubsections } = usePhaseFlow();

  return (
    <SceneLayout>
      <DynamicSectionLoader sections={generativeSubsections} />
    </SceneLayout>
  );
}
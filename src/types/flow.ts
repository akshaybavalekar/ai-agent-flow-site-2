export interface GenerativeSection {
  id: string;
  templateId: string;
  props: Record<string, unknown>;
}

export type Journey = "landing" | "connecting" | "talent";
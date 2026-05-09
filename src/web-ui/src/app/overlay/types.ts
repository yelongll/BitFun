export type OverlaySceneId = string;

export interface OverlayScene {
  id: OverlaySceneId;
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
}

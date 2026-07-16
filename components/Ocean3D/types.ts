import { Plane, Scene } from "three";

// Shared handle every scene builder receives: where to add objects, the
// disposal tracker, and the y=0 clip plane that hides above-water-only
// geometry once the camera dives.
export interface SceneCtx {
	scene: Scene;
	track: <T extends { dispose: () => void }>(d: T) => T;
	aboveWaterClip: Plane;
}

import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import HeroScene from './video_scenes/HeroScene';
import LoginScene from './video_scenes/LoginScene';
import IdeasScene from './video_scenes/IdeasScene';
import BreakdownScene from './video_scenes/BreakdownScene';
import PersonaScene from './video_scenes/PersonaScene';
import SessionScene from './video_scenes/SessionScene';
import ReadinessScene from './video_scenes/ReadinessScene';
import OutroScene from './video_scenes/OutroScene';

export const SCENE_DURATIONS: Record<string, number> = {
  hero: 7000,
  login: 6000,
  ideas: 7000,
  breakdown: 7000,
  persona: 7000,
  session: 9000,
  readiness: 8000,
  outro: 6000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hero: HeroScene,
  login: LoginScene,
  ideas: IdeasScene,
  breakdown: BreakdownScene,
  persona: PersonaScene,
  session: SessionScene,
  readiness: ReadinessScene,
  outro: OutroScene,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0D0D0D' }}>
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}

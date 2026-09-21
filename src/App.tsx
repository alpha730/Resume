import { useState } from 'react';
import GalaxyHero from './GalaxyHero';
import SpaceField from './SpaceField';

export default function App() {
  const [scene, setScene] = useState<'hero' | 'system'>('hero');

  return (
    <div className="absolute inset-0 bg-[#000000] overflow-hidden">
      {scene === 'hero' ? (
        <GalaxyHero onOpen={() => setScene('system')} />
      ) : (
        <SpaceField onExit={() => setScene('hero')} />
      )}
    </div>
  );
}

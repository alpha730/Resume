import { useState } from 'react';
import NetworkHero from './NetworkHero';
import SpaceField from './SpaceField';

export default function App() {
  const [scene, setScene] = useState<'hero' | 'system'>('hero');

  return (
    <div className="absolute inset-0 bg-[#000000] overflow-hidden">
      {scene === 'hero' ? (
        <NetworkHero onOpen={() => setScene('system')} />
      ) : (
        <SpaceField onExit={() => setScene('hero')} />
      )}
    </div>
  );
}

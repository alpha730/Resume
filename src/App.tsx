import { useState } from 'react';
import NetworkHero from './NetworkHero';
import CardCarousel from './CardCarousel';

export default function App() {
  const [scene, setScene] = useState<'hero' | 'cards'>('hero');

  return (
    <div className="absolute inset-0 bg-[#000000] overflow-hidden">
      {scene === 'hero' ? (
        <NetworkHero onOpen={() => setScene('cards')} />
      ) : (
        <CardCarousel onExit={() => setScene('hero')} />
      )}
    </div>
  );
}

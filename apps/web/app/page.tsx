import { GrainOverlay } from '@/components/homepage/GrainOverlay';
import { Hero } from '@/components/homepage/Hero';
import { FeatureGrid } from '@/components/homepage/FeatureGrid';
import { Differentiator } from '@/components/homepage/Differentiator';
import { Footer } from '@/components/homepage/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: '#0a0a0c' }}>
      <GrainOverlay />
      <Hero />
      <FeatureGrid />
      <Differentiator />
      <Footer />
    </main>
  );
}

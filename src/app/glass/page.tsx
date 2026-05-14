import React from 'react';
import GlassNavbar from '@/components/glass/GlassNavbar';
import GlassHero from '@/components/glass/GlassHero';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import { Zap, Shield, BarChart3, Globe } from 'lucide-react';

export default function GlassDemoPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#DE6449]/30">
      <GlassNavbar />

      <main>
        {/* Hero Section */}
        <GlassHero
          title="The Future is Glass."
          subtitle="Experience a 3D glassmorphism design system inspired by Stride. High performance, beautiful aesthetics, and smooth 3D interactions."
        />

        {/* Features Section */}
        <section className="py-24 container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Design System Components</h2>
            <p className="text-foreground/60 max-w-xl mx-auto">
              Our components are built with pure CSS and React, focusing on performance and 3D depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <GlassCard
              title="Frosted Glass"
              description="Backdrop-filter blur creates a premium frosted look that adapts to any background."
              icon={<Zap className="w-8 h-8 text-[#DE6449]" />}
            />
            <GlassCard
              title="3D Perspective"
              description="Using CSS perspective and transforms to simulate depth and physical presence."
              icon={<Shield className="w-8 h-8 text-[#407899]" />}
            />
            <GlassCard
              title="Fluid Animations"
              description="60FPS animations using transform and opacity for buttery smooth user experience."
              icon={<BarChart3 className="w-8 h-8 text-[#DE6449]" />}
            />
            <GlassCard
              title="Themed System"
              description="Easily customize colors and blur amounts through CSS custom properties."
              icon={<Globe className="w-8 h-8 text-[#407899]" />}
            />
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="py-24 bg-white/5 border-y border-white/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold mb-6">Interactive 3D Buttons</h2>
                <p className="text-foreground/70 mb-8">
                  Hover over the buttons to see the shimmer effect, and click to feel the 3D press interaction.
                </p>
                <div className="flex flex-wrap gap-4">
                  <GlassButton variant="primary">Primary Action</GlassButton>
                  <GlassButton variant="secondary">Secondary View</GlassButton>
                  <GlassButton>Glass Default</GlassButton>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#DE6449] to-[#407899] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-[#0A0A0A] p-8 rounded-2xl border border-white/10">
                  <pre className="text-sm text-blue-400">
                    <code>{`// Glass Properties
--glass-bg: rgba(255,255,255,0.1);
--blur-amount: 14px;
--glass-border: 1px solid rgba(255,255,255,0.2);`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6 text-center text-foreground/40 text-sm">
          <p>© 2024 Stride Glass Design System. Built with React + Vite.</p>
        </div>
      </footer>
    </div>
  );
}

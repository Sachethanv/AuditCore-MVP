import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <Zap className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">HackJudge</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth">
            Sign In
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-50">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                The AI-Powered Judging Platform for Hackathons
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Stop relying on messy spreadsheets. HackJudge uses AI to analyze codebases and brief judges, ensuring fair and fast evaluations.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/auth">Get Started Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Fair Evaluation</h3>
                <p className="text-gray-500">AI analysis eliminates score drift and ensures every project is judged on the same technical criteria.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Zap className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">AI Code Briefing</h3>
                <p className="text-gray-500">Judges get a 200-word summary of the project's technical stack, complexity, and standout features before they score.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <BarChart3 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Real-time Leaderboard</h3>
                <p className="text-gray-500">Organizers see scores roll in live and can export final results with a single click.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">© 2024 HackJudge. All rights reserved.</p>
      </footer>
    </div>
  );
}

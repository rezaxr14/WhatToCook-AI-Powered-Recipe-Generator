import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Sparkles, Play, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomCursor } from '../components/ui/CustomCursor';
import { journey } from '../components/three/journey/state';

/**
 * The landing experience: a single continuous 3D journey from a dark kitchen,
 * into the fridge, through the AI constellation and the recipe galaxy, into
 * the cooking sequence and the finished dish. Scroll is the timeline; the
 * JourneyScene canvas is the world; these overlays are the narration.
 */

const JourneyScene = lazy(() =>
  import('../components/three/journey/JourneyScene').then((m) => ({ default: m.JourneyScene }))
);

/** Linear 0?1 ramp between two progress points (clamped). */
const lin = (v: number, a: number, b: number) => (b === a ? 1 : Math.min(1, Math.max(0, (v - a) / (b - a))));

/** Shared display typeface style — module-level so its identity never changes. */
const DISPLAY_FONT: React.CSSProperties = { fontFamily: "'Sora', 'Inter', system-ui, sans-serif" };

/**
 * Full-screen narration overlay bound to a journey-progress window.
 * Uses callback transforms — framer's keyframe path engages a WAAPI
 * scroll-timeline fast path that misbehaves for fixed overlays.
 */
const Chapter: React.FC<{
  p: MotionValue<number>;
  range: [number, number, number, number];
  drift?: number;
  startVisible?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ p, range, drift = 40, startVisible = false, className = '', children }) => {
  const [a, b, c, d] = range;
  const opacity = useTransform(p, (v) => (startVisible ? 1 - lin(v, c, d) : lin(v, a, b) * (1 - lin(v, c, d))));
  const y = useTransform(p, (v) => (startVisible ? -drift * lin(v, c, d) : drift * (1 - lin(v, a, b)) - drift * lin(v, c, d)));
  return (
    <motion.div style={{ opacity, y }} className={`pointer-events-none fixed inset-0 z-10 flex ${className}`}>
      {children}
    </motion.div>
  );
};

/** Overlay that only fades in (used for the finale). */
const ChapterIn: React.FC<{
  p: MotionValue<number>;
  range: [number, number];
  className?: string;
  children: React.ReactNode;
}> = ({ p, range, className = '', children }) => {
  const [a, b] = range;
  const opacity = useTransform(p, (v) => lin(v, a, b));
  const y = useTransform(p, (v) => 48 * (1 - lin(v, a, b)));
  return (
    <motion.div style={{ opacity, y }} className={`pointer-events-none fixed inset-0 z-10 flex ${className}`}>
      {children}
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const [ready, setReady] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const [stats, setStats] = useState<{ total_recipes: number; total_ingredients: number } | null>(null);

  // Unmount the loading veil after its fade-out transition completes.
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => setVeilGone(true), 900);
    return () => clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    fetch('/api/stats/')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => {});
  }, []);

  // Drive the 3D journey timeline from the page scroll position.
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    journey.progress = v;
  });

  const handleDemo = useCallback(async () => {
    try {
      await demoLogin();
      navigate('/recipes');
    } catch {
      /* toast surfaced by AuthContext */
    }
  }, [demoLogin, navigate]);

  const scrollDown = useCallback(() => {
    window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
  }, []);

  const cueOpacity = useTransform(scrollYProgress, (v) => 1 - lin(v, 0, 0.035));

  // Stable identity for the scene-ready callback so the lazy JourneyScene
  // never re-renders because of a fresh inline closure.
  const handleSceneReady = useCallback(() => {
    setTimeout(() => setReady(true), 500);
  }, []);

  // Authenticated users go straight to their kitchen dashboard.
  // NOTE: must stay BELOW every hook — an early return above a hook breaks
  // the Rules of Hooks once the session resolves after mount.
  if (user) return <Navigate to="/recipes" replace />;

  return (
    <div className="relative -mt-8 bg-[#070503] text-stone-100">
      {/* Scroll timeline: taller on desktop for a slower, more cinematic ride */}
      <div className="h-[760vh] md:h-[900vh]" />

      {/* The 3D world */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={null}>
          <JourneyScene onReady={handleSceneReady} />
        </Suspense>
        {/* Cinematic vignette + film grain */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_52%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* Loading experience */}
      {!veilGone && (
        <div
          className={`fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-[#070503] transition-opacity duration-700 ${
            ready ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/30">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300/80 border-t-transparent" />
          </div>
          <div className="text-center">
            <div className="text-sm font-black tracking-[0.45em] text-amber-100" style={DISPLAY_FONT}>
              WHATTOCOOK
            </div>
            <div className="mt-2 text-xs font-medium text-stone-400">{t('story.loading')}</div>
          </div>
        </div>
      )}

      {/* ---------- Chapter I — Arrival ---------- */}
      <Chapter p={scrollYProgress} range={[0, 0.001, 0.075, 0.13]} startVisible className="items-center">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="text-[11px] font-black tracking-[0.5em] text-amber-300/90" style={DISPLAY_FONT}>
            {t('story.heroKicker')}
          </div>
          <h1
            className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-stone-50 sm:text-7xl lg:text-8xl"
            style={DISPLAY_FONT}
          >
            {t('story.heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base font-medium text-stone-300/90 sm:text-lg">
            {t('story.heroSub')}
          </p>
          <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleDemo}
              data-cursor="COOK"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 text-sm font-extrabold text-stone-950 shadow-[0_8px_40px_rgba(251,146,60,0.35)] transition-transform hover:scale-105"
            >
              <Play className="h-4 w-4 fill-stone-950" />
              {t('landing.tryDemo')}
            </button>
            <button
              onClick={scrollDown}
              data-cursor="EXPLORE"
              className="inline-flex items-center gap-2 rounded-full border border-stone-100/25 bg-stone-100/5 px-7 py-3.5 text-sm font-bold text-stone-100 backdrop-blur-md transition-colors hover:border-amber-200/60"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              {t('story.heroCta')}
            </button>
          </div>
        </div>
      </Chapter>

      {/* Scroll cue */}
      <motion.div style={{ opacity: cueOpacity }} className="pointer-events-none fixed inset-x-0 bottom-24 z-10 flex justify-center">
        <button onClick={scrollDown} className="pointer-events-auto flex flex-col items-center gap-1 text-stone-400">
          <span className="text-[10px] font-bold tracking-[0.35em]">{t('story.scrollCue')}</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </motion.div>

      {/* ---------- Chapter II — The fridge ---------- */}
      <Chapter p={scrollYProgress} range={[0.2, 0.24, 0.295, 0.34]} className="items-center justify-start">
        <div className="max-w-md px-8 sm:px-16">
          <div className="text-[11px] font-black tracking-[0.4em] text-amber-300/90" style={DISPLAY_FONT}>
            01 — {t('story.heroCta')}
          </div>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-stone-50 sm:text-5xl" style={DISPLAY_FONT}>
            {t('story.fridgeTitle')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-stone-300/90 sm:text-base">
            {t('story.fridgeSub')}
          </p>
        </div>
      </Chapter>

      {/* ---------- Chapter III — AI vision ---------- */}
      <Chapter p={scrollYProgress} range={[0.355, 0.4, 0.445, 0.49]} className="items-center justify-end">
        <div className="max-w-md px-8 text-right sm:px-20">
          <div className="text-[11px] font-black tracking-[0.4em] text-amber-300/90" style={DISPLAY_FONT}>
            02 — AI
          </div>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-stone-50 sm:text-5xl" style={DISPLAY_FONT}>
            {t('story.aiTitle')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-stone-300/90 sm:text-base">
            {t('story.aiSub')}
          </p>
        </div>
      </Chapter>

      {/* ---------- Chapter IV — Recipe galaxy ---------- */}
      <Chapter p={scrollYProgress} range={[0.485, 0.525, 0.565, 0.605]} className="items-start justify-center pt-24">
        <div className="max-w-2xl px-8 text-center">
          <h2 className="text-4xl font-black leading-tight tracking-tight text-stone-50 sm:text-6xl" style={DISPLAY_FONT}>
            {t('story.galaxyTitle')}
          </h2>
          <p className="mt-4 text-sm font-medium text-stone-300/90 sm:text-base">{t('story.galaxySub')}</p>
        </div>
      </Chapter>

      {/* ---------- Chapter V — Cooking steps ---------- */}
      {([
        [0.575, 0.6, 0.635, 0.66, '01', t('story.prep')],
        [0.635, 0.66, 0.695, 0.72, '02', t('story.cook')],
        [0.695, 0.72, 0.745, 0.77, '03', t('story.combine')],
        [0.745, 0.77, 0.8, 0.83, '04', t('story.serve')],
      ] as Array<[number, number, number, number, string, string]>).map(([a, b, c, d, num, word]) => (
        <Chapter key={num} p={scrollYProgress} range={[a, b, c, d]} className="items-end">
          <div className="p-10 sm:p-16">
            <div className="text-6xl font-black text-amber-300/25 sm:text-8xl" style={DISPLAY_FONT}>
              {num}
            </div>
            <div className="mt-1 text-sm font-black tracking-[0.4em] text-stone-100" style={DISPLAY_FONT}>
              {word.toUpperCase()}
            </div>
          </div>
        </Chapter>
      ))}

      {/* ---------- Chapter VI — Dinner, discovered ---------- */}
      <Chapter p={scrollYProgress} range={[0.795, 0.83, 0.88, 0.915]} className="items-center">
        <div className="mx-auto grid max-w-6xl gap-10 px-8 sm:px-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-stone-50 sm:text-6xl" style={DISPLAY_FONT}>
              {t('story.finalTitle')}
            </h2>
            <p className="mt-5 max-w-md text-sm font-medium text-stone-300/90 sm:text-base">{t('story.finalSub')}</p>
          </div>
          <div className="pointer-events-auto ml-auto w-full max-w-xs rounded-3xl border border-stone-100/15 bg-stone-950/60 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-black tracking-widest text-amber-300">
                94% {t('story.match')}
              </span>
              <span className="text-[10px] font-bold text-stone-400">
                {t('story.cardTime')} · {t('story.cardLevel')}
              </span>
            </div>
            <div className="mt-3 text-xl font-black tracking-tight text-stone-50" style={DISPLAY_FONT}>
              {t('story.cardName')}
            </div>
            <div className="mt-4 text-[10px] font-black tracking-[0.25em] text-stone-400">{t('story.cardIng')}</div>
            <ul className="mt-2 space-y-1 text-xs font-medium text-stone-300">
              {['Tomatoes', 'Pasta', 'Garlic', 'Basil', 'Parmesan', 'Olive Oil'].map((ing) => (
                <li key={ing} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  {ing}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-400/5 p-3">
              <div className="text-[9px] font-black tracking-[0.25em] text-amber-300/80">{t('story.cardAi')}</div>
              <div className="mt-1 text-xs font-medium text-stone-300">{t('story.cardAiText')}</div>
            </div>
            <button
              onClick={() => navigate('/recipes')}
              data-cursor="COOK"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-extrabold text-stone-950 transition-transform hover:scale-[1.03]"
            >
              {t('story.makeThis')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Chapter>

      {/* ---------- Chapter VII — Finale / CTA ---------- */}
      <ChapterIn p={scrollYProgress} range={[0.93, 0.975]} className="items-center justify-center">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-5xl font-black tracking-tight text-stone-50 sm:text-7xl" style={DISPLAY_FONT}>
            {t('story.ctaTitle')}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm font-medium text-stone-300/90 sm:text-base">
            {t('story.ctaSub')}
          </p>
          <div className="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleDemo}
              data-cursor="COOK"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3.5 text-sm font-extrabold text-stone-950 shadow-[0_8px_40px_rgba(251,146,60,0.4)] transition-transform hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              {t('story.ctaStart')}
            </button>
            <button
              onClick={() => navigate('/recipes')}
              data-cursor="EXPLORE"
              className="inline-flex items-center gap-2 rounded-full border border-stone-100/25 bg-stone-100/5 px-8 py-3.5 text-sm font-bold text-stone-100 backdrop-blur-md transition-colors hover:border-amber-200/60"
            >
              {t('landing.exploreRecipes')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Live platform stats */}
          {stats && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {[
                [`${stats.total_recipes}+`, t('landing.statsRecipes')],
                [`${stats.total_ingredients}+`, t('landing.statsIngredients')],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-stone-100/15 bg-stone-950/50 px-5 py-3 backdrop-blur-md"
                >
                  <div className="text-lg font-black text-amber-200" style={DISPLAY_FONT}>
                    {value}
                  </div>
                  <div className="text-[10px] font-semibold text-stone-400">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ChapterIn>

      {/* Minimal footer of the journey */}
      <div className="relative z-10 border-t border-stone-100/10 bg-[#070503]/90 py-10 text-center backdrop-blur-md">
        <div className="text-xs font-black tracking-[0.45em] text-stone-200" style={DISPLAY_FONT}>
          WHATTOCOOK
        </div>
        <p className="mt-2 text-[11px] font-medium text-stone-500">{t('story.finalSub')}</p>
        <p className="mt-3 text-[10px] text-stone-600">© {new Date().getFullYear()} WhatToCook · {t('footer.rights')}</p>
      </div>

      <CustomCursor />
    </div>
  );
};

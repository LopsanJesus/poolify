"use client";

import { savePredictions } from "@/app/actions/predictions";
import type { Dict, Locale } from "@/lib/i18n/dictionaries";
import { stageLabel } from "@/lib/stages";
import type { Match, Prediction, PredScore } from "@/lib/types";
import { Loader2, Shuffle } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlagImage } from "@/app/_components/FlagImage";
import { translateTeam } from "@/lib/team-flags";
import { SuccessToast } from "@/app/_components/SuccessToast";
import { ScoreButtons, SCORE_OPTIONS } from "@/app/_components/ScoreSelector";
import { isKnockoutRound, matchRound } from "@/lib/rounds";
import { deriveQualifierFromScore, whoAdvances } from "@/lib/scoring";
import type { RoundDeadlineInfo } from "@/app/actions/predictions";

type MatchWithPrediction = Match & { prediction: Prediction | null; matchDeadlinePassed: boolean };

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
};

export function PredictionsForm({
  clanId,
  matchesWithPreds,
  roundDeadlines,
  dict,
  commonDict,
  locale,
  pointsExact,
  pointsSign,
  pointsAdvance,
}: {
  clanId: string;
  matchesWithPreds: MatchWithPrediction[];
  roundDeadlines: RoundDeadlineInfo[];
  dict: Dict["predictions"];
  commonDict: Dict["common"];
  locale: Locale;
  pointsExact: number;
  pointsSign: number;
  pointsAdvance: number;
}) {
  const [state, action, pending] = useActionState(savePredictions, undefined);
  const [dirty, setDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setDirty(false);
      setShowToast(true);
    }
  }, [state?.success]);

  const allUpcoming = matchesWithPreds
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  const upcomingEditable = allUpcoming.filter((m) => !m.matchDeadlinePassed);
  const upcomingEmpty  = upcomingEditable.filter((m) => m.prediction === null);
  const upcomingFilled = upcomingEditable.filter((m) => m.prediction !== null);

  const locked = matchesWithPreds.filter((m) => m.status !== "upcoming" || m.matchDeadlinePassed);

  const now = new Date();

  // Map round → deadline for quick lookup
  const deadlineByRound = new Map<string, Date>(
    roundDeadlines.map((rd) => [rd.round, rd.deadline])
  );

  return (
    <>
      <div className="space-y-8">
        <form id="predictions-form" action={action} className="space-y-4">
          <input type="hidden" name="clan_id" value={clanId} />

          {upcomingEditable.length === 0 ? (
            <p className="text-center text-blue-400/70 text-sm py-6">
              {dict.no_upcoming_predictions}
            </p>
          ) : (
            <>
              {upcomingEmpty.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  dict={dict}
                  locale={locale}
                  editable
                  onDirty={() => setDirty(true)}
                  pointsExact={pointsExact}
                  pointsSign={pointsSign}
                  pointsAdvance={pointsAdvance}
                  roundDeadline={deadlineByRound.get(matchRound(match.stage))}
                />
              ))}

              {upcomingFilled.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs font-semibold text-blue-400/50 uppercase tracking-wide whitespace-nowrap">
                      {dict.already_predicted}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  {upcomingFilled.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      dict={dict}
                      locale={locale}
                      editable
                      onDirty={() => setDirty(true)}
                      pointsExact={pointsExact}
                      pointsSign={pointsSign}
                      pointsAdvance={pointsAdvance}
                      roundDeadline={deadlineByRound.get(matchRound(match.stage))}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {state?.error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
              {state.error}
            </div>
          )}

          {upcomingEditable.length > 0 && (
            <button
              type="submit"
              disabled={pending}
              className="hidden md:flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? commonDict.saving : dict.save_cta}
            </button>
          )}
        </form>

        {locked.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-400/60 uppercase tracking-wide">
              {dict.status_finished_ro}
            </p>
            {locked.map((match) => (
              <MatchCard key={match.id} match={match} dict={dict} locale={locale} editable={false} pointsExact={pointsExact} pointsSign={pointsSign} pointsAdvance={pointsAdvance} />
            ))}
          </div>
        )}
      </div>

      <SuccessToast
        show={showToast}
        message={dict.saved}
        onDone={() => setShowToast(false)}
      />

      <AnimatePresence>
        {dirty && upcomingEditable.length > 0 && (
          <motion.div
            className="md:hidden fixed inset-x-0 z-40 px-4 pb-3"
            style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <button
              type="submit"
              form="predictions-form"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/50 transition disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? commonDict.saving : dict.save_cta}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function randomPick(): PredScore {
  return SCORE_OPTIONS[Math.floor(Math.random() * SCORE_OPTIONS.length)];
}

// ── Match card ────────────────────────────────────────────────

function MatchCard({
  match,
  dict,
  locale,
  editable,
  onDirty,
  pointsExact,
  pointsSign,
  pointsAdvance,
  roundDeadline,
}: {
  match: MatchWithPrediction;
  dict: Dict["predictions"];
  locale: Locale;
  editable: boolean;
  onDirty?: () => void;
  pointsExact: number;
  pointsSign: number;
  pointsAdvance: number;
  roundDeadline?: Date;
}) {
  const [homeScore, setHomeScore] = useState<PredScore | "">((match.prediction?.home_score ?? "") as PredScore | "");
  const [awayScore, setAwayScore] = useState<PredScore | "">((match.prediction?.away_score ?? "") as PredScore | "");
  const [qualifierChoice, setQualifierChoice] = useState<'home' | 'away' | null>(
    (match.prediction?.qualifier ?? null) as 'home' | 'away' | null
  );

  const isKnockout = isKnockoutRound(match.stage);

  // Derive forced qualifier from current score (non-draw → locked to winner side)
  const forcedQualifier = (homeScore && awayScore)
    ? deriveQualifierFromScore(homeScore as PredScore, awayScore as PredScore)
    : null;

  // Effective qualifier: forced (non-draw) takes precedence over user choice
  const effectiveQualifier = forcedQualifier ?? qualifierChoice;

  // When score changes to non-draw, clear the user choice (forced takes over)
  function handleHomeScore(v: PredScore | '') {
    setHomeScore(v);
    if (v && awayScore) {
      const forced = deriveQualifierFromScore(v as PredScore, awayScore as PredScore);
      if (forced) setQualifierChoice(null);
    }
    onDirty?.();
  }

  function handleAwayScore(v: PredScore | '') {
    setAwayScore(v);
    if (homeScore && v) {
      const forced = deriveQualifierFromScore(homeScore as PredScore, v as PredScore);
      if (forced) setQualifierChoice(null);
    }
    onDirty?.();
  }

  function handleRandomize() {
    const h = randomPick();
    const a = randomPick();
    setHomeScore(h);
    setAwayScore(a);
    const forced = deriveQualifierFromScore(h, a);
    if (forced) setQualifierChoice(null);
    onDirty?.();
  }

  // For finished knockout matches: show if advance was correct
  const advanceResult = (isKnockout && match.status === "finished" && match.prediction)
    ? (() => {
        const pred = match.prediction!;
        if (!pred.qualifier) return null;
        const actual = whoAdvances(match.home_score!, match.away_score!, match.home_advances);
        if (!actual) return null;
        return pred.qualifier === actual ? "correct" : "wrong";
      })()
    : null;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition ${
        editable ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 opacity-75"
      }`}
    >
      {editable && <input type="hidden" name="match_id" value={match.id} />}
      {/* Send effective qualifier as hidden input */}
      {editable && isKnockout && effectiveQualifier && (
        <input type="hidden" name={`qualifier_${match.id}`} value={effectiveQualifier} />
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-400 font-medium">
          {stageLabel(match.stage, locale)}
        </span>
        <div className="flex items-center gap-2">
          {editable && (
            <button
              type="button"
              onClick={handleRandomize}
              className="p-1 rounded-md text-blue-400/50 hover:text-blue-300 hover:bg-white/10 transition"
              aria-label="Randomizar"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          )}
          <StatusPill status={match.status} dict={dict} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 gap-y-2">
        {/* Row 1 — team names */}
        <div className="min-w-0 flex items-center justify-end gap-1.5">
          <span className="text-white font-semibold text-sm text-right leading-tight truncate">
            {match.home_team ? translateTeam(match.home_team, locale) : <span className="text-blue-400/60">?</span>}
          </span>
          {match.home_team && <FlagImage team={match.home_team} size={24} className="shrink-0" />}
        </div>
        <div className="flex items-center justify-center shrink-0 px-1">
          <span className="text-blue-300/60 font-bold text-base">–</span>
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          {match.away_team && <FlagImage team={match.away_team} size={24} className="shrink-0" />}
          <span className="text-white font-semibold text-sm leading-tight truncate">
            {match.away_team ? translateTeam(match.away_team, locale) : <span className="text-blue-400/60">?</span>}
          </span>
        </div>

        {/* Row 2 — score selectors */}
        <ScoreButtons
          name={editable ? `home_${match.id}` : ""}
          value={homeScore}
          onSelect={editable ? handleHomeScore : undefined}
          disabled={!editable}
        />
        <div className="flex items-center justify-center shrink-0 px-1">
          {match.status === "finished" ? (
            <span className="text-xs text-blue-400 font-mono whitespace-nowrap">
              {match.home_score}–{match.away_score}
            </span>
          ) : (
            <span className="text-blue-300/40 font-bold text-base">–</span>
          )}
        </div>
        <ScoreButtons
          name={editable ? `away_${match.id}` : ""}
          value={awayScore}
          onSelect={editable ? handleAwayScore : undefined}
          disabled={!editable}
        />
      </div>

      {/* Qualifier row for knockout matches */}
      {isKnockout && (homeScore || match.prediction) && (
        <div className="space-y-1.5">
          <p className="text-xs text-blue-400/70 text-center">{dict.qualifier_label}</p>
          {forcedQualifier ? (
            // Non-draw: locked to predicted winner
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
                {forcedQualifier === 'home'
                  ? (match.home_team ? translateTeam(match.home_team, locale) : dict.qualifier_home)
                  : (match.away_team ? translateTeam(match.away_team, locale) : dict.qualifier_away)}
                {' · '}{dict.qualifier_locked}
              </span>
            </div>
          ) : (
            // Draw: user picks
            editable ? (
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => { setQualifierChoice('home'); onDirty?.(); }}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition ${
                    qualifierChoice === 'home'
                      ? 'bg-amber-500/30 border-amber-400/50 text-amber-300'
                      : 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
                  }`}
                >
                  {match.home_team ? translateTeam(match.home_team, locale) : dict.qualifier_home}
                </button>
                <button
                  type="button"
                  onClick={() => { setQualifierChoice('away'); onDirty?.(); }}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border transition ${
                    qualifierChoice === 'away'
                      ? 'bg-amber-500/30 border-amber-400/50 text-amber-300'
                      : 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
                  }`}
                >
                  {match.away_team ? translateTeam(match.away_team, locale) : dict.qualifier_away}
                </button>
              </div>
            ) : (
              // Read-only draw display
              <div className="flex justify-center">
                {match.prediction?.qualifier ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    {match.prediction.qualifier === 'home'
                      ? (match.home_team ? translateTeam(match.home_team, locale) : dict.qualifier_home)
                      : (match.away_team ? translateTeam(match.away_team, locale) : dict.qualifier_away)}
                  </span>
                ) : (
                  <span className="text-xs text-blue-400/40">—</span>
                )}
              </div>
            )
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-0.5">
        <p className="text-center text-xs text-blue-400">
          {new Date(match.match_date).toLocaleDateString(DATE_LOCALE[locale], {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {editable && roundDeadline && (
          <p className="text-center text-xs text-amber-400/80">
            {dict.deadline_round_closes}{" "}
            <span className="font-semibold tabular-nums">
              {roundDeadline.toLocaleString(DATE_LOCALE[locale], {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        )}
      </div>

      {match.prediction && match.status === "finished" && (
        <div className="flex flex-col items-center gap-1.5">
          <PointsBadge points={match.prediction.points} exactPts={pointsExact} signPts={pointsSign} advancePts={pointsAdvance} dict={dict} />
          {advanceResult && (
            <span className={`text-xs font-medium ${advanceResult === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
              {advanceResult === 'correct' ? `✓ ${dict.advance_correct}` : `✗ ${dict.advance_wrong}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, dict }: { status: string; dict: Dict["predictions"] }) {
  if (status === "live")
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 animate-pulse">
        {dict.status_live}
      </span>
    );
  if (status === "finished")
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-blue-300">
        {dict.status_finished_ro}
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
      {dict.status_open}
    </span>
  );
}

function PointsBadge({
  points,
  exactPts,
  signPts,
  advancePts,
  dict,
}: {
  points: number;
  exactPts: number;
  signPts: number;
  advancePts: number;
  dict: Dict["predictions"];
}) {
  // Points may include advance bonus, so check base score ranges
  const base = points % 1 === 0 ? points : 0;
  const isExact = base >= exactPts && base <= exactPts + advancePts;
  const isSign = !isExact && base >= signPts && base <= signPts + advancePts && base > 0;

  if (isExact && base >= exactPts)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">
        {dict.pill_exact} {points > exactPts ? `+${points - exactPts}` : ''}
      </span>
    );
  if (isSign || (base > 0 && base < exactPts))
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/30 text-blue-300 text-sm font-bold">
        {dict.pill_winner} {points > signPts ? `+${points - signPts}` : ''}
      </span>
    );
  if (points > 0)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-bold">
        +{points} pts
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
      {dict.pill_miss}
    </span>
  );
}

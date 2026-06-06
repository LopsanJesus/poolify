"use client";

import { savePredictions } from "@/app/actions/predictions";
import type { Dict, Locale } from "@/lib/i18n/dictionaries";
import { stageLabel } from "@/lib/stages";
import type { Match, Prediction, PredScore } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { FlagImage } from "@/app/_components/FlagImage";

type MatchWithPrediction = Match & { prediction: Prediction | null };

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
};

const SCORE_OPTIONS: PredScore[] = ["0", "1", "2", "+"];

export function PredictionsForm({
  clanId,
  matchesWithPreds,
  dict,
  commonDict,
  locale,
}: {
  clanId: string;
  matchesWithPreds: MatchWithPrediction[];
  dict: Dict["predictions"];
  commonDict: Dict["common"];
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(savePredictions, undefined);

  const upcoming = matchesWithPreds.filter((m) => m.status === "upcoming");
  const locked   = matchesWithPreds.filter((m) => m.status !== "upcoming");

  return (
    <div className="space-y-8">
      {/* Editable: upcoming only */}
      <form action={action} className="space-y-4">
        <input type="hidden" name="clan_id" value={clanId} />

        {upcoming.length === 0 ? (
          <p className="text-center text-blue-400/70 text-sm py-6">
            {dict.no_upcoming_predictions}
          </p>
        ) : (
          upcoming.map((match) => (
            <MatchCard key={match.id} match={match} dict={dict} locale={locale} editable />
          ))
        )}

        {state?.error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 text-emerald-300 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> {dict.saved}
          </div>
        )}

        {upcoming.length > 0 && (
          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition disabled:opacity-60"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? commonDict.saving : dict.save_cta}
          </button>
        )}
      </form>

      {/* Read-only: live + finished */}
      {locked.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-blue-400/60 uppercase tracking-wide">
            {dict.status_finished_ro}
          </p>
          {locked.map((match) => (
            <MatchCard key={match.id} match={match} dict={dict} locale={locale} editable={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Score selector ────────────────────────────────────────────

function ScoreSelector({
  name,
  defaultValue,
  disabled,
}: {
  name: string;
  defaultValue: PredScore | "";
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<PredScore | "">(defaultValue);

  if (disabled) {
    return (
      <div className="flex justify-center">
        <span
          className={`min-w-[2.5rem] text-center text-xl font-bold px-3 py-2 rounded-lg border ${
            selected === "+"
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
              : "bg-blue-900/60 border-white/20 text-white"
          }`}
        >
          {selected || "–"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 justify-center">
      {name && selected !== "" && (
        <input type="hidden" name={name} value={selected} />
      )}
      {SCORE_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setSelected(opt === selected ? "" : opt)}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-bold text-sm sm:text-base transition-all border ${
            selected === opt
              ? opt === "+"
                ? "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30 scale-110"
                : "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-110"
              : "bg-white/5 border-white/15 text-blue-200 hover:bg-white/15 hover:border-white/30"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────

function MatchCard({
  match,
  dict,
  locale,
  editable,
}: {
  match: MatchWithPrediction;
  dict: Dict["predictions"];
  locale: Locale;
  editable: boolean;
}) {
  const existingHome = (match.prediction?.home_score ?? "") as PredScore | "";
  const existingAway = (match.prediction?.away_score ?? "") as PredScore | "";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition ${
        editable ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 opacity-75"
      }`}
    >
      {editable && <input type="hidden" name="match_id" value={match.id} />}

      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-400 font-medium">
          {stageLabel(match.stage, locale)}
        </span>
        <StatusPill status={match.status} dict={dict} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Home team */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-end gap-2">
            <span className="text-white font-semibold text-sm text-right leading-tight">
              {match.home_team ?? <span className="text-blue-400/60">?</span>}
            </span>
            {match.home_team && <FlagImage team={match.home_team} size={28} />}
          </div>
          <ScoreSelector
            name={editable ? `home_${match.id}` : ""}
            defaultValue={existingHome}
            disabled={!editable}
          />
        </div>

        {/* Center divider + actual result */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-blue-300 text-lg font-bold">–</span>
          {match.status === "finished" && (
            <span className="text-xs text-blue-400 font-mono">
              {match.home_score}–{match.away_score}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {match.away_team && <FlagImage team={match.away_team} size={28} />}
            <span className="text-white font-semibold text-sm leading-tight">
              {match.away_team ?? <span className="text-blue-400/60">?</span>}
            </span>
          </div>
          <ScoreSelector
            name={editable ? `away_${match.id}` : ""}
            defaultValue={existingAway}
            disabled={!editable}
          />
        </div>
      </div>

      <p className="text-center text-xs text-blue-400">
        {new Date(match.match_date).toLocaleDateString(DATE_LOCALE[locale], {
          weekday: "long",
          day: "2-digit",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {match.prediction && match.status === "finished" && (
        <div className="text-center">
          <PointsBadge points={match.prediction.points} dict={dict} />
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

function PointsBadge({ points, dict }: { points: number; dict: Dict["predictions"] }) {
  if (points === 4)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-sm font-bold">
        {dict.pill_exact}
      </span>
    );
  if (points === 1)
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/30 text-blue-300 text-sm font-bold">
        {dict.pill_winner}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
      {dict.pill_miss}
    </span>
  );
}

import { getAllMatches, getUserPredictionsForClan } from "@/app/actions/predictions";
import { getDict } from "@/lib/i18n/server";
import { getActiveClanId } from "@/lib/active-clan";
import { getClanData, getTournamentDeadline } from "@/app/actions/clans";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllMatchesView } from "./_components/AllMatchesView";
import type { Prediction } from "@/lib/types";
import { DEFAULT_CLAN_SETTINGS } from "@/lib/types";
import Link from "next/link";
import { ClipboardList, Star } from "lucide-react";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeClanId = await getActiveClanId();
  const [matches, { dict, locale }, deadline] = await Promise.all([
    getAllMatches(activeClanId ?? undefined),
    getDict(),
    getTournamentDeadline(),
  ]);

  let predictions: Record<string, Prediction> = {};
  let pointsExact = DEFAULT_CLAN_SETTINGS.points_exact;
  let pointsSign = DEFAULT_CLAN_SETTINGS.points_sign;
  let hasFinalPredictions = false;

  if (activeClanId) {
    const [preds, clanData] = await Promise.all([
      getUserPredictionsForClan(activeClanId),
      getClanData(activeClanId),
    ]);
    predictions = preds;
    pointsExact = clanData?.settings?.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact;
    pointsSign = clanData?.settings?.points_sign ?? DEFAULT_CLAN_SETTINGS.points_sign;
    hasFinalPredictions = clanData?.settings?.final_predictions != null;
  }

  const isPastDeadline = deadline ? new Date() >= deadline : false;
  const showPredictionLinks = activeClanId && !isPastDeadline;

  return (
    <div className="space-y-6">
      {showPredictionLinks && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/clan/${activeClanId}/predictions`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition text-sm font-medium"
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            {dict.predictions.title}
          </Link>
          {hasFinalPredictions && (
            <Link
              href={`/clan/${activeClanId}/final-predictions`}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition text-sm font-medium"
            >
              <Star className="w-4 h-4 shrink-0" />
              {dict.final_predictions.title}
            </Link>
          )}
        </div>
      )}

      <AllMatchesView
        matches={matches}
        predictions={predictions}
        clanDict={dict.clan}
        locale={locale}
        clanId={activeClanId ?? null}
        currentUserId={user.id}
        pointsExact={pointsExact}
        pointsSign={pointsSign}
      />
    </div>
  );
}

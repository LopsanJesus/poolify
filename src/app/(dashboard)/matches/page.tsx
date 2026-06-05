import { getAllMatches, getUserPredictionsForClan } from "@/app/actions/predictions";
import { getDict } from "@/lib/i18n/server";
import { getActiveClanId } from "@/lib/active-clan";
import { getClanData } from "@/app/actions/clans";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllMatchesView } from "./_components/AllMatchesView";
import type { Prediction } from "@/lib/types";
import { DEFAULT_CLAN_SETTINGS } from "@/lib/types";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeClanId = await getActiveClanId();
  const [matches, { dict, locale }] = await Promise.all([
    getAllMatches(activeClanId ?? undefined),
    getDict(),
  ]);

  let predictions: Record<string, Prediction> = {};
  let pointsExact = DEFAULT_CLAN_SETTINGS.points_exact;
  let pointsSign = DEFAULT_CLAN_SETTINGS.points_sign;

  if (activeClanId) {
    const [preds, clanData] = await Promise.all([
      getUserPredictionsForClan(activeClanId),
      getClanData(activeClanId),
    ]);
    predictions = preds;
    pointsExact = clanData?.settings?.points_exact ?? DEFAULT_CLAN_SETTINGS.points_exact;
    pointsSign = clanData?.settings?.points_sign ?? DEFAULT_CLAN_SETTINGS.points_sign;
  }

  return (
    <div className="space-y-6">
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

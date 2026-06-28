import { MissingPredictionsBanner } from "@/app/_components/MissingPredictionsBanner";
import { MissingFinalPredictionsBanner } from "@/app/_components/MissingFinalPredictionsBanner";
import { DateCarousel } from "@/app/(dashboard)/matches/_components/DateCarousel";
import { getClanData } from "@/app/actions/clans";
import { getMatchesWithPredictions } from "@/app/actions/predictions";
import { getMyTournamentPrediction } from "@/app/actions/tournament";
import { format, getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLAN_SETTINGS } from "@/lib/types";
import { notFound } from "next/navigation";
import { ClanCookieSync } from "./_components/ClanCookieSync";

export default async function ClanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const clan = await getClanData(id);
  if (!clan) notFound();

  const settings = clan.settings ?? DEFAULT_CLAN_SETTINGS;
  const canEditLive = clan.owner_id === user.id || settings.live_results_all_members !== false;

  const [{ matches: matchesWithPreds, roundDeadlines }, { dict, locale }, myFinalPred] = await Promise.all([
    getMatchesWithPredictions(id),
    getDict(),
    getMyTournamentPrediction(id),
  ]);

  // Only count upcoming matches where round deadline hasn't passed
  const editableUpcoming = matchesWithPreds.filter(
    (m) => m.status === "upcoming" && !m.matchDeadlinePassed
  );
  const missingUpcoming = editableUpcoming.filter((m) => !m.prediction).length;
  const hasFinalPredictions = settings.final_predictions != null;
  const missingFinalPreds = hasFinalPredictions && (!myFinalPred || !myFinalPred.winner);

  // Show banners only while there are pending predictions to make
  const showMatchBanner = missingUpcoming > 0;

  // Soonest upcoming deadline across all rounds
  const now = new Date();
  const nextDeadline = roundDeadlines
    .filter((rd) => rd.deadline > now)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0]?.deadline ?? null;
  const showFinalBanner = hasFinalPredictions && missingFinalPreds;

  return (
    <div className="space-y-6">
      <ClanCookieSync clanId={id} />
      <div className="space-y-4">
        {showMatchBanner && (
          <MissingPredictionsBanner
            clanId={id}
            count={missingUpcoming}
            dict={dict.clan}
            format={format}
            deadline={nextDeadline}
            locale={locale}
          />
        )}
        {showFinalBanner && (
          <MissingFinalPredictionsBanner
            clanId={id}
            dict={dict.final_predictions}
          />
        )}
      </div>

      <DateCarousel
        matches={matchesWithPreds}
        clanId={id}
        currentUserId={user.id}
        clanDict={dict.clan}
        commonDict={dict.common}
        locale={locale}
        canEditLive={canEditLive}
        pointsExact={settings.points_exact}
        pointsSign={settings.points_sign}
      />
    </div>
  );
}

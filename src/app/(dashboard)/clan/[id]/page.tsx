import { MissingPredictionsBanner } from "@/app/_components/MissingPredictionsBanner";
import { MissingFinalPredictionsBanner } from "@/app/_components/MissingFinalPredictionsBanner";
import { DateCarousel } from "@/app/(dashboard)/matches/_components/DateCarousel";
import { getClanData, getTournamentDeadline } from "@/app/actions/clans";
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

  const [matchesWithPreds, { dict, locale }, deadline, myFinalPred] = await Promise.all([
    getMatchesWithPredictions(id),
    getDict(),
    getTournamentDeadline(),
    getMyTournamentPrediction(id),
  ]);

  const now = new Date();
  const isPastDeadline = deadline ? now >= deadline : false;

  // Only count upcoming matches where per-match deadline (2h before kick-off) hasn't passed
  const editableUpcoming = matchesWithPreds.filter(
    (m) => m.status === "upcoming" && !m.matchDeadlinePassed
  );
  const missingUpcoming = editableUpcoming.filter((m) => !m.prediction).length;
  const hasFinalPredictions = settings.final_predictions != null;
  const missingFinalPreds = hasFinalPredictions && (!myFinalPred || !myFinalPred.winner);

  // Show match banner whenever there are editable upcoming matches without predictions.
  // After deadline, show a view-only link so users can consult their predictions.
  const showMatchBanner = missingUpcoming > 0;
  const showMatchViewLink = isPastDeadline && !showMatchBanner;
  // Final predictions: show to fill (before deadline) or to view (after deadline)
  const showFinalBanner = hasFinalPredictions && (
    (!isPastDeadline && missingFinalPreds) ||
    isPastDeadline
  );

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
          />
        )}
        {showMatchViewLink && (
          <MissingPredictionsBanner
            clanId={id}
            count={0}
            dict={dict.clan}
            format={format}
            viewOnly
          />
        )}
        {showFinalBanner && (
          <MissingFinalPredictionsBanner
            clanId={id}
            dict={dict.final_predictions}
            viewOnly={isPastDeadline}
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
      />
    </div>
  );
}

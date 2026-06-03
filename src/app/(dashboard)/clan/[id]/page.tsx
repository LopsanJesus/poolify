import { MissingPredictionsBanner } from "@/app/_components/MissingPredictionsBanner";
import { MissingFinalPredictionsBanner } from "@/app/_components/MissingFinalPredictionsBanner";
import { DateCarousel } from "@/app/(dashboard)/matches/_components/DateCarousel";
import { getClanData, getTournamentDeadline } from "@/app/actions/clans";
import { getMatchesWithPredictions } from "@/app/actions/predictions";
import { getMyTournamentPrediction } from "@/app/actions/tournament";
import { format, getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLAN_SETTINGS } from "@/lib/types";
import { HelpCircle, Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClanCookieSync } from "./_components/ClanCookieSync";
import { InviteButton } from "./_components/InviteButton";

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
  const isOwner = clan.owner_id === user.id;
  const canInvite = isOwner || settings.can_members_invite;

  const [matchesWithPreds, { dict, locale }, deadline, myFinalPred] = await Promise.all([
    getMatchesWithPredictions(id),
    getDict(),
    getTournamentDeadline(),
    getMyTournamentPrediction(id),
  ]);

  const now = new Date();
  const isPastDeadline = deadline ? now >= deadline : false;

  const upcomingMatches = matchesWithPreds.filter((m) => m.status === "upcoming");
  const missingUpcoming = upcomingMatches.filter((m) => !m.prediction).length;
  const hasFinalPredictions = settings.final_predictions != null;
  const missingFinalPreds = hasFinalPredictions && !myFinalPred;

  // Banner logic: show match banner first; if all match preds done, show final banner.
  // Both hide after deadline.
  const showMatchBanner = !isPastDeadline && missingUpcoming > 0;
  const showFinalBanner = !isPastDeadline && !showMatchBanner && missingFinalPreds;

  return (
    <div className="space-y-6">
      <ClanCookieSync clanId={id} />
      <div className="space-y-4">
        {/* Action buttons row */}
        <div className="flex items-center justify-end gap-2">
          {canInvite && !isPastDeadline && (
            <InviteButton inviteCode={clan.invite_code} dict={dict.invite} />
          )}
          <Link
            href={`/clan/${id}/settings`}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-blue-300 hover:text-white transition"
            aria-label={dict.clan_settings.title}
          >
            {isOwner ? <Settings className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
          </Link>
        </div>

        {showMatchBanner && (
          <MissingPredictionsBanner
            clanId={id}
            count={missingUpcoming}
            dict={dict.clan}
            format={format}
          />
        )}
        {showFinalBanner && (
          <MissingFinalPredictionsBanner clanId={id} dict={dict.final_predictions} />
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

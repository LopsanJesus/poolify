import { getClanRanking, getUserClans, getClanData, getTournamentDeadline } from "@/app/actions/clans";
import { getActiveClanId } from "@/lib/active-clan";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPersonalInfo } from "@/app/actions/personal-info";
import { getAllTournamentPredictions } from "@/app/actions/tournament";
import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { RankingWithModal } from "./_components/RankingWithModal";

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, clans, activeClanId] = await Promise.all([
    supabase
      .from("profiles")
      .select("default_clan_id")
      .eq("id", user.id)
      .single(),
    getUserClans(),
    getActiveClanId(),
  ]);

  if (clans.length === 0) redirect("/dashboard");

  const clanId =
    (activeClanId && clans.some((c) => c.id === activeClanId)
      ? activeClanId
      : null) ??
    profile?.default_clan_id ??
    clans[0].id;

  const clan = clans.find((c) => c.id === clanId) ?? clans[0];

  const [ranking, { dict }, clanData, deadline] = await Promise.all([
    getClanRanking(clan.id),
    getDict(),
    getClanData(clan.id),
    getTournamentDeadline(),
  ]);

  const hasFinalPredictions = clanData?.settings?.final_predictions != null;
  const finalPredictionsConfig = clanData?.settings?.final_predictions ?? null;
  const isPastDeadline = deadline ? new Date() >= deadline : false;

  // Fetch personal info and (if past deadline) final predictions in parallel
  const [personalInfoEntries, allFinalPreds] = await Promise.all([
    Promise.all(
      ranking.map(async (entry) => [entry.user_id, await getUserPersonalInfo(entry.user_id)] as const)
    ),
    isPastDeadline && hasFinalPredictions ? getAllTournamentPredictions(clan.id) : Promise.resolve([]),
  ]);

  const personalInfoMap = Object.fromEntries(personalInfoEntries);
  const finalPredsMap = Object.fromEntries(allFinalPreds.map((p) => [p.user_id, p]));

  return (
    <div className="space-y-4">
      {ranking.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/20">
          <Trophy className="w-12 h-12 text-blue-500/50 mx-auto mb-3" />
          <p className="text-blue-300 font-medium">{dict.clan.no_ranking}</p>
        </div>
      ) : (
        <RankingWithModal
          ranking={ranking}
          currentUserId={user.id}
          clanDict={dict.clan}
          profileDict={dict.profile}
          personalInfoMap={personalInfoMap}
          finalPredsMap={finalPredsMap}
          isPastDeadline={isPastDeadline}
          finalPredictionsConfig={finalPredictionsConfig}
          finalPredictionsDict={dict.final_predictions}
        />
      )}
    </div>
  );
}

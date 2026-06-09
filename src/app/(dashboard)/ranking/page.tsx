import { getClanRanking, getUserClans, getClanData } from "@/app/actions/clans";
import { getActiveClanId } from "@/lib/active-clan";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPersonalInfo } from "@/app/actions/personal-info";
import { Trophy, Star } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  const [ranking, { dict }, clanData] = await Promise.all([
    getClanRanking(clan.id),
    getDict(),
    getClanData(clan.id),
  ]);

  const hasFinalPredictions = clanData?.settings?.final_predictions != null;

  // Fetch personal info for all ranking members in parallel
  const personalInfoEntries = await Promise.all(
    ranking.map(async (entry) => [entry.user_id, await getUserPersonalInfo(entry.user_id)] as const)
  );
  const personalInfoMap = Object.fromEntries(personalInfoEntries);

  return (
    <div className="space-y-4">
      {hasFinalPredictions && (
        <Link
          href={`/clan/${clan.id}/final-predictions`}
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition text-sm font-medium"
        >
          <Star className="w-4 h-4 shrink-0" />
          {dict.final_predictions.title}
        </Link>
      )}

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
          personalInfoMap={personalInfoMap}
        />
      )}
    </div>
  );
}

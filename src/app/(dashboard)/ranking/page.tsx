import { getClanRanking, getUserClans, getClanData } from "@/app/actions/clans";
import { getActiveClanId } from "@/lib/active-clan";
import type { Dict } from "@/lib/i18n/dictionaries";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Star, Target } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-orange-400"];
const COLS = "2.5rem 1fr 3.5rem 3.5rem";

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
        <div
          className="rounded-xl border border-white/10 overflow-hidden grid"
          style={{ gridTemplateColumns: COLS }}
        >
          <div className="contents">
            <span className="px-4 py-3 border-b border-white/10 text-blue-400/70">#</span>
            <span className="px-4 py-3 border-b border-white/10 text-blue-400/70 text-xs uppercase tracking-wide">{dict.clan.ranking_name}</span>
            <span className="px-4 py-3 border-b border-white/10 text-blue-400/70"><Target className="w-3.5 h-3.5" /></span>
            <span className="px-4 py-3 border-b border-white/10 text-blue-400/70"><Star className="w-3.5 h-3.5" /></span>
          </div>

          {ranking.map((entry, i) => (
            <RankingRow
              key={entry.user_id}
              entry={entry}
              position={i}
              isMe={entry.user_id === user.id}
              clanDict={dict.clan}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RankingRow({
  entry,
  position,
  isMe,
  clanDict,
}: {
  entry: {
    user_id: string;
    username: string;
    total: number;
    exact: number;
    winner: number;
  };
  position: number;
  isMe: boolean;
  clanDict: Dict["clan"];
}) {
  const cell = `px-4 py-3 flex items-center border-b border-white/5 text-sm ${isMe ? "bg-emerald-500/10" : ""}`;

  return (
    <>
      <div className={cell}>
        <span className={`font-mono font-bold text-xs ${position < 3 ? MEDAL_COLORS[position] : "text-blue-400"}`}>
          #{position + 1}
        </span>
      </div>
      <div className={`${cell} gap-1 min-w-0`}>
        <span className={`font-semibold truncate ${isMe ? "text-emerald-300" : "text-white"}`}>
          {entry.username}
        </span>
        {isMe && (
          <span className="text-xs text-emerald-400 shrink-0">({clanDict.you})</span>
        )}
      </div>
      <div className={`${cell} text-white/80`}>{entry.exact}</div>
      <div className={`${cell} font-bold text-white`}>{entry.total}</div>
    </>
  );
}

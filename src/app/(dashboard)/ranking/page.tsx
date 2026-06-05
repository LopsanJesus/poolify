import { GroupSwitcher } from "@/app/(dashboard)/_components/GroupSwitcher";
import { getClanRanking, getUserClans } from "@/app/actions/clans";
import { getActiveClanId } from "@/lib/active-clan";
import type { Dict } from "@/lib/i18n/dictionaries";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-orange-400"];

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

  const [ranking, { dict }] = await Promise.all([
    getClanRanking(clan.id),
    getDict(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <GroupSwitcher
          currentId={clan.id}
          clans={clans}
          label={dict.clan.switch_pool}
        />
      </div>

      {ranking.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/20">
          <Trophy className="w-12 h-12 text-blue-500/50 mx-auto mb-3" />
          <p className="text-blue-300 font-medium">{dict.clan.no_ranking}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-white/10 text-blue-400/70 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">{dict.clan.ranking_name}</th>
                <th className="text-center px-4 py-3 w-12">{dict.clan.ranking_exact}</th>
                <th className="text-right px-4 py-3 w-16">{dict.clan.ranking_points}</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry, i) => (
                <RankingRow
                  key={entry.user_id}
                  entry={entry}
                  position={i}
                  isMe={entry.user_id === user.id}
                  clanDict={dict.clan}
                />
              ))}
            </tbody>
          </table>
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
  return (
    <tr
      className={`border-b border-white/5 last:border-0 transition ${
        isMe ? "bg-emerald-500/10" : "hover:bg-white/5"
      }`}
    >
      <td className="px-4 py-3">
        <span className={`font-mono font-bold text-xs ${position < 3 ? MEDAL_COLORS[position] : "text-blue-400"}`}>
          #{position + 1}
        </span>
      </td>
      <td className="px-4 py-3 max-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`font-semibold truncate ${isMe ? "text-emerald-300" : "text-white"}`}>
            {entry.username}
          </span>
          {isMe && (
            <span className="text-xs text-emerald-400 shrink-0">({clanDict.you})</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-white/80 whitespace-nowrap">{entry.exact}</td>
      <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">{entry.total}</td>
    </tr>
  );
}

import { MissingPredictionsBanner } from "@/app/_components/MissingPredictionsBanner";
import { getClanData, getClanRanking, getUserClans } from "@/app/actions/clans";
import { getMatchesWithPredictions } from "@/app/actions/predictions";
import { format, getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLAN_SETTINGS } from "@/lib/types";
import {
  BarChart3,
  Medal,
  Settings,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClanCookieSync } from "./_components/ClanCookieSync";
import { CopyButton } from "./_components/CopyButton";
import { PoolSwitcher } from "./_components/PoolSwitcher";

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
  const showInviteCode = isOwner || settings.can_members_invite;

  const [ranking, matchesWithPreds, clans] = await Promise.all([
    getClanRanking(id, settings),
    getMatchesWithPredictions(id),
    getUserClans(),
  ]);

  const myRank = ranking.findIndex((r) => r.user_id === user.id);
  const myStats = ranking[myRank];

  const { dict, locale } = await getDict();

  const upcomingMatches = matchesWithPreds.filter(
    (m) => m.status === "upcoming",
  );
  const missingUpcoming = upcomingMatches.filter((m) => !m.prediction).length;

  const totalPredictions = ranking.reduce(
    (acc, r) => acc + r.exact + r.winner,
    0,
  );
  const avgPoints =
    ranking.length > 0
      ? Math.round(
          (ranking.reduce((acc, r) => acc + r.total, 0) / ranking.length) * 10,
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      <ClanCookieSync clanId={id} />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {showInviteCode && (
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-sm font-mono">
                  {clan.invite_code}
                </span>
                <CopyButton
                  code={clan.invite_code}
                  label={dict.clan.copy_code}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PoolSwitcher
              currentId={clan.id}
              clans={clans}
              clanDict={dict.clan}
              navDict={dict.nav}
              dashboardDict={dict.dashboard}
            />
            <Link
              href={`/clan/${id}/settings`}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-blue-300 hover:text-white transition"
              aria-label={dict.clan_settings.title}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <MissingPredictionsBanner
          clanId={id}
          count={missingUpcoming}
          dict={dict.clan}
          format={format}
        />
      </div>

      {myStats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            label={dict.clan.stats_points}
            value={myStats.total}
            accent="yellow"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-emerald-400" />}
            label={dict.clan.stats_exact}
            value={myStats.exact}
            accent="emerald"
          />
          <StatCard
            icon={<Medal className="w-5 h-5 text-blue-400" />}
            label={dict.clan.stats_position}
            value={myRank === -1 ? "–" : `#${myRank + 1}`}
            accent="blue"
          />
        </div>
      )}

      {/* Pool stats */}
      <section>
        <SectionHeader
          icon={<BarChart3 className="w-5 h-5 text-blue-300" />}
          title={dict.clan.pool_stats}
        />
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-300" />}
            label={dict.clan.players}
            value={ranking.length}
            accent="blue"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-emerald-300" />}
            label={dict.clan.total_predictions}
            value={totalPredictions}
            accent="emerald"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-300" />}
            label={dict.clan.average_points}
            value={avgPoints}
            accent="yellow"
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: "yellow" | "emerald" | "blue";
}) {
  const bg = {
    yellow: "bg-yellow-500/10 border-yellow-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20",
    blue: "bg-blue-500/10 border-blue-500/20",
  };
  return (
    <div className={`p-4 rounded-xl border ${bg[accent]} text-center`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white font-bold text-2xl">{value}</p>
      <p className="text-blue-300 text-xs mt-0.5">{label}</p>
    </div>
  );
}

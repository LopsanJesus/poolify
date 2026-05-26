import { MissingPredictionsBanner } from "@/app/_components/MissingPredictionsBanner";
import { DateCarousel } from "@/app/(dashboard)/matches/_components/DateCarousel";
import { getClanData, getUserClans } from "@/app/actions/clans";
import { getMatchesWithPredictions } from "@/app/actions/predictions";
import { format, getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLAN_SETTINGS } from "@/lib/types";
import { Settings } from "lucide-react";
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

  const [matchesWithPreds, clans, { dict, locale }] = await Promise.all([
    getMatchesWithPredictions(id),
    getUserClans(),
    getDict(),
  ]);

  const upcomingMatches = matchesWithPreds.filter(
    (m) => m.status === "upcoming",
  );
  const missingUpcoming = upcomingMatches.filter((m) => !m.prediction).length;

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

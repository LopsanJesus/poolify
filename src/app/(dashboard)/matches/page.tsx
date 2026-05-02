import { GroupSwitcher } from "@/app/(dashboard)/_components/GroupSwitcher";
import { DateCarousel } from "@/app/(dashboard)/matches/_components/DateCarousel";
import { getUserClans } from "@/app/actions/clans";
import { getMatchesWithPredictions } from "@/app/actions/predictions";
import { getActiveClanId } from "@/lib/active-clan";
import { format, getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MatchesPage() {
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

  if (clans.length === 0) {
    redirect("/dashboard");
  }

  const clanId =
    (activeClanId && clans.some((c) => c.id === activeClanId)
      ? activeClanId
      : null) ??
    profile?.default_clan_id ??
    clans[0].id;

  const clan = clans.find((c) => c.id === clanId) ?? clans[0];

  const [matchesWithPreds, { dict, locale }] = await Promise.all([
    getMatchesWithPredictions(clan.id),
    getDict(),
  ]);

  const upcomingMatches = matchesWithPreds.filter(
    (m) => m.status === "upcoming",
  );
  const missingUpcoming = upcomingMatches.filter((m) => !m.prediction).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end gap-4">
        <GroupSwitcher
          currentId={clan.id}
          clans={clans}
          label={dict.clan.switch_pool}
        />
      </div>

      {missingUpcoming > 0 && (
        <Link
          href={`/clan/${clan.id}/predictions`}
          className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/40 hover:bg-yellow-500/15 transition"
        >
          <AlertCircle className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-yellow-200 font-semibold text-sm">
              {format(dict.clan.missing_banner_title, { n: missingUpcoming })}
            </p>
            <p className="text-yellow-200/80 text-xs mt-0.5">
              {dict.clan.missing_banner_desc}
            </p>
          </div>
          <span className="flex items-center gap-1 text-yellow-200 text-sm font-medium shrink-0">
            {dict.clan.missing_banner_cta}
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      )}

      <DateCarousel
        matches={matchesWithPreds}
        clanId={clan.id}
        currentUserId={user.id}
        clanDict={dict.clan}
        commonDict={dict.common}
        locale={locale}
      />
    </div>
  );
}

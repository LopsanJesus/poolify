import { GroupSwitcher } from "@/app/(dashboard)/_components/GroupSwitcher";
import { DateCarousel } from "@/app/(dashboard)/matches/_components/DateCarousel";
import { MissingPredictionsBanner } from "@/app/_components/MissingPredictionsBanner";
import { getUserClans } from "@/app/actions/clans";
import { getMatchesWithPredictions } from "@/app/actions/predictions";
import { getActiveClanId } from "@/lib/active-clan";
import { format, getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <GroupSwitcher
            currentId={clan.id}
            clans={clans}
            label={dict.clan.switch_pool}
          />
        </div>

        <MissingPredictionsBanner
          clanId={clan.id}
          count={missingUpcoming}
          dict={dict.clan}
          format={format}
        />
      </div>

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

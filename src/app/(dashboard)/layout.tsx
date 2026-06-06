import { PwaInstallModal } from "@/app/_components/PwaInstallModal";
import { getActiveClanId } from "@/lib/active-clan";
import { getDict } from "@/lib/i18n/server";
import { getUserClans, getClanData, getTournamentDeadline } from "@/app/actions/clans";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NavBar } from "./_components/NavBar";
import { TopBar } from "./_components/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ dict }, activeClanId, clans, deadline] = await Promise.all([
    getDict(),
    getActiveClanId(),
    getUserClans(),
    getTournamentDeadline(),
  ]);

  const activeClan = clans.find((c) => c.id === activeClanId) ?? null;
  const activeClanName = activeClan?.name ?? null;
  const isOwner = activeClan?.owner_id === user.id;
  const isPastDeadline = deadline ? new Date() >= deadline : false;

  // Can show invite button: owner always, members if settings allow
  let canInvite = isOwner;
  if (activeClanId && !isOwner) {
    const clanData = await getClanData(activeClanId);
    canInvite = clanData?.settings?.can_members_invite ?? true;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900">
      <TopBar
        activeClanId={activeClanId}
        activeClanName={activeClanName}
        inviteCode={activeClan?.invite_code ?? null}
        isOwner={isOwner}
        canInvite={canInvite}
        isPastDeadline={isPastDeadline}
        clans={clans}
        clanDict={dict.clan}
        navDict={dict.nav}
        dashboardDict={dict.dashboard}
        inviteDict={dict.invite}
        settingsTitle={dict.clan_settings.title}
      />
      <NavBar activeClanId={activeClanId} navDict={dict.nav} />

      <main className="pt-14 md:pl-20 pb-nav">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-10">{children}</div>
      </main>

      <PwaInstallModal t={dict.pwa} />
    </div>
  );
}

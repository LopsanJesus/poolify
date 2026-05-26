import { PwaInstallModal } from "@/app/_components/PwaInstallModal";
import { getActiveClanId } from "@/lib/active-clan";
import { getDict } from "@/lib/i18n/server";
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

  const { dict } = await getDict();

  const activeClanId = await getActiveClanId();
  let activeClanName: string | null = null;
  if (activeClanId) {
    const { data } = await supabase
      .from("clans")
      .select("name")
      .eq("id", activeClanId)
      .single();
    activeClanName = data?.name ?? null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900">
      <TopBar clanName={activeClanName} />
      <NavBar activeClanId={activeClanId} />

      <main className="pt-14 md:pl-20 pb-nav">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-10">{children}</div>
      </main>

      <PwaInstallModal t={dict.pwa} />
    </div>
  );
}

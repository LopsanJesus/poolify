import { getAllMatches } from "@/app/actions/predictions";
import { getDict } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllMatchesView } from "./_components/AllMatchesView";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [matches, { dict, locale }] = await Promise.all([
    getAllMatches(),
    getDict(),
  ]);

  return (
    <div className="space-y-6">
      <AllMatchesView matches={matches} clanDict={dict.clan} locale={locale} />
    </div>
  );
}

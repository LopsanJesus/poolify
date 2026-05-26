import { getAllMatches, getUserPredictionsForClan } from "@/app/actions/predictions";
import { getDict } from "@/lib/i18n/server";
import { getActiveClanId } from "@/lib/active-clan";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AllMatchesView } from "./_components/AllMatchesView";
import type { Prediction } from "@/lib/types";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [matches, activeClanId, { dict, locale }] = await Promise.all([
    getAllMatches(),
    getActiveClanId(),
    getDict(),
  ]);

  let predictions: Record<string, Prediction> = {};
  if (activeClanId) {
    predictions = await getUserPredictionsForClan(activeClanId);
  }

  return (
    <div className="space-y-6">
      <AllMatchesView
        matches={matches}
        predictions={predictions}
        clanDict={dict.clan}
        locale={locale}
      />
    </div>
  );
}

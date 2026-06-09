import { Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n/dictionaries";

export function MissingFinalPredictionsBanner({
  clanId,
  dict,
  viewOnly = false,
}: {
  clanId: string;
  dict: Dict["final_predictions"];
  viewOnly?: boolean;
}) {
  return (
    <Link
      href={`/clan/${clanId}/final-predictions`}
      className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 transition group text-center sm:text-left"
    >
      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
        <Star className="w-5 h-5 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-purple-200 font-bold text-sm sm:text-base">{dict.banner_title}</p>
        <p className="text-purple-200/70 text-xs sm:text-sm mt-0.5">{dict.banner_desc}</p>
      </div>
      <div className="flex items-center gap-1.5 text-purple-400 text-sm font-bold bg-purple-500/10 px-3 py-1.5 rounded-lg group-hover:bg-purple-500/20 transition shrink-0 mt-2 sm:mt-0">
        {viewOnly ? dict.banner_view_cta : dict.banner_cta}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

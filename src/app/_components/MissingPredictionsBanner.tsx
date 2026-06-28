import { AlertCircle, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n/dictionaries";

const DATE_LOCALE: Record<Locale, string> = { en: "en-US", es: "es-ES", de: "de-DE" };

export function MissingPredictionsBanner({
  clanId,
  count,
  dict,
  format,
  deadline,
  locale,
}: {
  clanId: string;
  count: number;
  dict: Dict["clan"];
  format: (template: string, values: Record<string, any>) => string;
  deadline?: Date | null;
  locale: Locale;
}) {
  if (count === 0) return null;

  return (
    <Link
      href={`/clan/${clanId}/predictions`}
      className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/15 transition group text-center sm:text-left"
    >
      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-yellow-200 font-bold text-sm sm:text-base">
          {format(dict.missing_banner_title, { n: count })}
        </p>
        <p className="text-yellow-200/70 text-xs sm:text-sm mt-0.5">
          {dict.missing_banner_desc}
        </p>
        {deadline && (
          <p className="flex items-center justify-center sm:justify-start gap-1 text-amber-300 text-xs font-semibold mt-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            {deadline.toLocaleString(DATE_LOCALE[locale], {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Madrid",
            })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-bold bg-yellow-500/10 px-3 py-1.5 rounded-lg group-hover:bg-yellow-500/20 transition shrink-0 mt-2 sm:mt-0">
        {dict.missing_banner_cta}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

import type { FinalPredictionsConfig, TournamentPrediction } from '@/lib/types'
import type { Dict } from '@/lib/i18n/dictionaries'

type PredWithUsername = TournamentPrediction & { username: string }

export function FinalPredictionsTable({
  predictions,
  config,
  currentUserId,
  dict,
  showAll = false,
}: {
  predictions: PredWithUsername[]
  config: FinalPredictionsConfig
  currentUserId: string
  dict: Dict['final_predictions']
  showAll?: boolean
}) {
  const displayPreds = showAll ? predictions : predictions.filter((p) => p.user_id === currentUserId)

  if (displayPreds.length === 0) {
    return <p className="text-center text-blue-400/60 text-sm py-6">{dict.no_predictions}</p>
  }

  const fields: [keyof TournamentPrediction, string][] = [
    ['winner',     dict.field_winner],
    ['runner_up',  dict.field_runner_up],
    ['semi1',      dict.field_semi1],
    ['semi2',      dict.field_semi2],
    ['top_scorer', dict.field_top_scorer],
  ]

  return (
    <div className="space-y-3">
      {displayPreds.map((pred) => {
        const isMe = pred.user_id === currentUserId
        return (
          <div
            key={pred.user_id}
            className={`rounded-xl border p-4 space-y-3 ${
              isMe ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'
            }`}
          >
            {showAll && (
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isMe ? 'text-purple-300' : 'text-white'}`}>
                  @{pred.username}
                </span>
                {pred.points > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {pred.points} pts
                  </span>
                )}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {fields.map(([name, label]) => {
                const val = pred[name] as string | null
                return (
                  <div key={name}>
                    <dt className="text-blue-400/60 text-xs">{label}</dt>
                    <dd className="text-white font-medium">{val || '—'}</dd>
                  </div>
                )
              })}
              {config.custom_fields?.map((f) => (
                <div key={f.id}>
                  <dt className="text-blue-400/60 text-xs">{f.label}</dt>
                  <dd className="text-white font-medium">{pred.custom_answers?.[f.id] || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}
    </div>
  )
}

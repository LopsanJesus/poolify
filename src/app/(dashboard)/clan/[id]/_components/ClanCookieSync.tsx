'use client'

import { useEffect } from 'react'
import { setActiveClan } from '@/app/actions/active-clan'

export function ClanCookieSync({ clanId }: { clanId: string }) {
  useEffect(() => {
    setActiveClan(clanId)
  }, [clanId])
  return null
}

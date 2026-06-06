import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { joinClanByCode } from '@/app/actions/clans'
import { setActiveClan } from '@/app/actions/active-clan'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=/join/${code}`, req.url))
  }

  const result = await joinClanByCode(code)

  if (result.clanId) {
    await setActiveClan(result.clanId)
    return NextResponse.redirect(new URL(`/clan/${result.clanId}`, req.url))
  }

  // Invalid code or any other error → back to dashboard
  return NextResponse.redirect(new URL('/dashboard', req.url))
}

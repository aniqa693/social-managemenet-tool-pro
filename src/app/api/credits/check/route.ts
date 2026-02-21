// app/api/credits/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreditManager } from '../../../../../lib/credit-manager';
import { auth } from '../../../../../lib/auth';

export async function GET(req: NextRequest) {
//   const session=await auth.api.getSession({
//     query: {
//         disableCookieCache: true,
//     }, 
//     headers: req.headers, // pass the headers
// });
// session?.user.role
  try {
    const { searchParams } = new URL(req.url);
    const toolName = searchParams.get('toolName');
    const userId = searchParams.get('userId');

    if (!toolName || !userId) {
      return NextResponse.json(
        { error: 'Tool name and user ID are required' },
        { status: 400 }
      );
    }

    const result = await CreditManager.hasSufficientCredits(userId, toolName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
}
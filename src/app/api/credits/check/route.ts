// app/api/credits/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreditManager } from '../../../../../lib/credit-manager';

export async function GET(req: NextRequest) {
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
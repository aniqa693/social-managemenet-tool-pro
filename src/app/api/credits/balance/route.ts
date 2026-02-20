// app/api/credits/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreditManager } from '../../../../../lib/credit-manager';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await CreditManager.getBalance(userId);
    return NextResponse.json({ balance });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
// app/api/credits/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { creditsTransactionsTable,toolPricingTable } from '../../../../../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { getServerSession } from '../../../../../lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // Get user session from Better Auth
    const session = await getServerSession();
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'Please log in to view your credit history'
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log('📊 Fetching credit history for user:', userEmail, 'ID:', userId);

    // Set a timeout for the entire operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Fetch credit transactions for the user
      // Also join with tool pricing to get tool names if needed
      const creditHistory = await db.select({
        id: creditsTransactionsTable.id,
        amount: creditsTransactionsTable.amount,
        type: creditsTransactionsTable.type,
        description: creditsTransactionsTable.description,
        toolUsed: creditsTransactionsTable.toolUsed,
        remainingCredits: creditsTransactionsTable.remainingCredits,
        createdAt: creditsTransactionsTable.createdAt,
        userId: creditsTransactionsTable.userId,
        // You can also get tool pricing info if needed
        toolCreditsRequired: sql`(
          SELECT ${toolPricingTable.credits_required} 
          FROM ${toolPricingTable} 
          WHERE ${toolPricingTable.tool_name} = ${creditsTransactionsTable.toolUsed}
          LIMIT 1
        )`.as('toolCreditsRequired'),
      })
      .from(creditsTransactionsTable)
      .where(eq(creditsTransactionsTable.userId, userId))
      .orderBy(desc(creditsTransactionsTable.createdAt))
      .limit(100); // Get last 100 transactions

      clearTimeout(timeoutId);

      // Calculate summary statistics
      const totalCreditsUsed = creditHistory
        .filter(t => t.type === 'tool_usage')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const totalCreditsPurchased = creditHistory
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalCreditsBonus = creditHistory
        .filter(t => t.type === 'bonus')
        .reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = creditHistory.length > 0 
        ? creditHistory[0].remainingCredits 
        : 0;

      console.log(`✅ Found ${creditHistory.length} credit transactions for user ${userEmail}`);

      return NextResponse.json({
        success: true,
        data: creditHistory,
        summary: {
          totalTransactions: creditHistory.length,
          currentBalance,
          totalCreditsUsed,
          totalCreditsPurchased,
          totalCreditsBonus,
          usageByTool: creditHistory
            .filter(t => t.type === 'tool_usage')
            .reduce((acc: Record<string, number>, t) => {
              if (t.toolUsed) {
                acc[t.toolUsed] = (acc[t.toolUsed] || 0) + Math.abs(t.amount);
              }
              return acc;
            }, {}),
        },
        user: {
          email: userEmail,
          id: userId
        },
        message: creditHistory.length === 0 ? 'No credit history found' : undefined
      });

    } catch (dbError) {
      clearTimeout(timeoutId);
      console.error('💥 Database query error:', dbError);
      
      // Return empty data with error message
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          totalTransactions: 0,
          currentBalance: 0,
          totalCreditsUsed: 0,
          totalCreditsPurchased: 0,
          totalCreditsBonus: 0,
          usageByTool: {}
        },
        error: 'Database connection issue',
        message: 'Could not load credit history due to connection issues'
      });
    }

  } catch (error) {
    console.error('💥 Error in credit history API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch credit history',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      summary: {
        totalTransactions: 0,
        currentBalance: 0,
        totalCreditsUsed: 0,
        totalCreditsPurchased: 0,
        totalCreditsBonus: 0,
        usageByTool: {}
      }
    }, { status: 500 });
  }
}

// Optional: Get specific transaction details
export async function GET_TRANSACTION(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const transactionId = parseInt(params.id);
    const userId = session.user.id;

    const transaction = await db.select()
      .from(creditsTransactionsTable)
      .where(
        sql`${creditsTransactionsTable.id} = ${transactionId} AND 
            ${creditsTransactionsTable.userId} = ${userId}`
      )
      .limit(1);

    if (!transaction.length) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction[0]
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
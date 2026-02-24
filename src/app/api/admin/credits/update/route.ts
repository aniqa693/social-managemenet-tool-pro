import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../../../../../db';
import { user,creditsTransactionsTable,toolPricingTable } from '../../../../../../db/schema';
import { getServerSession } from '../../../../../../lib/auth-server';

// Helper function to check if user is admin
async function isAdmin() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return false;
    
    const adminUser = await db.query.user.findFirst({
      where: eq(user.email, session.user.email),
    });
    
    return adminUser?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// ==================== POST - Update credits and pricing ====================
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Handle different actions
    switch (action) {
      case 'update-user-credits':
        return await updateUserCredits(body);
      
      case 'update-tool-pricing':
        return await updateToolPricing(body);
      
      case 'bulk-update-credits':
        return await bulkUpdateCredits(body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in credit update:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// ==================== GET - Fetch data for update page ====================
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    switch (type) {
      case 'users':
        return await getUsersWithCredits();
      
      case 'transactions':
        const userId = searchParams.get('userId');
        return await getUserTransactions(userId);
      
      case 'tool-pricing':
        return await getToolPricing();
      
      case 'all':
      default:
        return await getAllCreditData();
    }

  } catch (error) {
    console.error('Error fetching credit data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Helper function to update user credits
async function updateUserCredits(body: any) {
  const { userId, amount, description } = body;

  if (!userId || amount === undefined) {
    return NextResponse.json(
      { error: 'User ID and amount are required' },
      { status: 400 }
    );
  }

  // Get current user credits
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const currentCredits = targetUser.credits || 0;
  const newCredits = currentCredits + amount;

  if (newCredits < 0) {
    return NextResponse.json(
      { error: 'Insufficient credits. User would have negative balance.' },
      { status: 400 }
    );
  }

  // Update user credits
  await db
    .update(user)
    .set({ 
      credits: newCredits,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));

  // Record transaction
  const transactionType = amount > 0 ? 'bonus' : 'refund';
  await db.insert(creditsTransactionsTable).values({
    userId,
    amount: Math.abs(amount),
    type: transactionType,
    description: description || `Admin ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} credits`,
    remainingCredits: newCredits,
    createdAt: new Date()
  });

  // Get updated user data
  const updatedUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  return NextResponse.json({
    success: true,
    message: `Successfully ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} credits`,
    user: {
      id: updatedUser?.id,
      name: updatedUser?.name,
      email: updatedUser?.email,
      credits: updatedUser?.credits,
      role: updatedUser?.role
    }
  });
}

// Helper function to update tool pricing
async function updateToolPricing(body: any) {
  const { toolName, creditsRequired } = body;

  if (!toolName || !creditsRequired || creditsRequired < 1) {
    return NextResponse.json(
      { error: 'Valid tool name and credits required (minimum 1) are needed' },
      { status: 400 }
    );
  }

  // Check if tool exists
  const existingTool = await db.query.toolPricingTable.findFirst({
    where: eq(toolPricingTable.tool_name, toolName),
  });

  if (existingTool) {
    // Update existing tool
    await db
      .update(toolPricingTable)
      .set({ credits_required: creditsRequired })
      .where(eq(toolPricingTable.tool_name, toolName));
  } else {
    // Insert new tool
    await db.insert(toolPricingTable).values({
      tool_name: toolName,
      credits_required: creditsRequired
    });
  }

  // Get updated tool pricing
  const updatedTool = await db.query.toolPricingTable.findFirst({
    where: eq(toolPricingTable.tool_name, toolName),
  });

  return NextResponse.json({
    success: true,
    message: `Tool pricing updated successfully`,
    tool: updatedTool
  });
}

// Helper function for bulk credit updates
async function bulkUpdateCredits(body: any) {
  const { userIds, amount, description } = body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || amount === undefined) {
    return NextResponse.json(
      { error: 'Valid user IDs array and amount are required' },
      { status: 400 }
    );
  }

  const results = [];
  const errors = [];

  for (const userId of userIds) {
    try {
      // Get current user credits
      const targetUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!targetUser) {
        errors.push({ userId, error: 'User not found' });
        continue;
      }

      const currentCredits = targetUser.credits || 0;
      const newCredits = currentCredits + amount;

      if (newCredits < 0) {
        errors.push({ userId, error: 'Would result in negative balance' });
        continue;
      }

      // Update user credits
      await db
        .update(user)
        .set({ 
          credits: newCredits,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId));

      // Record transaction
      await db.insert(creditsTransactionsTable).values({
        userId,
        amount: Math.abs(amount),
        type: amount > 0 ? 'bonus' : 'refund',
        description: description || `Bulk ${amount > 0 ? 'addition' : 'deduction'} of ${Math.abs(amount)} credits`,
        remainingCredits: newCredits,
        createdAt: new Date()
      });

      results.push({ userId, success: true, newBalance: newCredits });
    } catch (error) {
      errors.push({ userId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return NextResponse.json({
    success: results.length > 0,
    message: `Updated ${results.length} users, ${errors.length} failed`,
    results,
    errors
  });
}

// Helper function to get all users with their credits
async function getUsersWithCredits() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      role: user.role,
      createdAt: user.createdAt
    })
    .from(user)
    .where(
      sql`${user.role} IN ('creator', 'analyst', 'admin')`
    )
    .orderBy(user.createdAt);

  // Get total credits issued
  const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);

  return NextResponse.json({
    users,
    summary: {
      totalUsers: users.length,
      totalCredits,
      averageCredits: users.length > 0 ? Math.round(totalCredits / users.length) : 0
    }
  });
}

// Helper function to get user transactions
async function getUserTransactions(userId: string | null) {
  if (!userId) {
    // Get recent transactions for all users
    const transactions = await db
      .select({
        id: creditsTransactionsTable.id,
        userId: creditsTransactionsTable.userId,
        amount: creditsTransactionsTable.amount,
        type: creditsTransactionsTable.type,
        description: creditsTransactionsTable.description,
        remainingCredits: creditsTransactionsTable.remainingCredits,
        createdAt: creditsTransactionsTable.createdAt,
        userName: user.name,
        userEmail: user.email
      })
      .from(creditsTransactionsTable)
      .leftJoin(user, eq(creditsTransactionsTable.userId, user.id))
      .orderBy(desc(creditsTransactionsTable.createdAt))
      .limit(100);

    return NextResponse.json({ transactions });
  } else {
    // Get transactions for specific user
    const transactions = await db
      .select()
      .from(creditsTransactionsTable)
      .where(eq(creditsTransactionsTable.userId, userId))
      .orderBy(desc(creditsTransactionsTable.createdAt));

    return NextResponse.json({ transactions });
  }
}

// Helper function to get tool pricing
async function getToolPricing() {
  const tools = await db
    .select()
    .from(toolPricingTable)
    .orderBy(toolPricingTable.tool_name);

  return NextResponse.json({ tools });
}

// Helper function to get all credit management data
async function getAllCreditData() {
  const [usersData, toolsData, recentTransactions] = await Promise.all([
    getUsersWithCredits().then(res => res.json()),
    getToolPricing().then(res => res.json()),
    db
      .select({
        id: creditsTransactionsTable.id,
        userId: creditsTransactionsTable.userId,
        amount: creditsTransactionsTable.amount,
        type: creditsTransactionsTable.type,
        description: creditsTransactionsTable.description,
        remainingCredits: creditsTransactionsTable.remainingCredits,
        createdAt: creditsTransactionsTable.createdAt,
        userName: user.name,
        userEmail: user.email
      })
      .from(creditsTransactionsTable)
      .leftJoin(user, eq(creditsTransactionsTable.userId, user.id))
      .orderBy(desc(creditsTransactionsTable.createdAt))
      .limit(20)
  ]);

  return NextResponse.json({
    users: usersData.users,
    usersSummary: usersData.summary,
    tools: toolsData.tools,
    recentTransactions
  });
}
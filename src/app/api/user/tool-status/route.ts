import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../../db';
import { userToolPermissions,toolPricingTable } from '../../../../../db/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const toolName = searchParams.get('toolName');

    if (!userId || !toolName) {
      return NextResponse.json(
        { error: 'User ID and tool name are required' },
        { status: 400 }
      );
    }

    // Check if there's a custom permission for this user
    const userPermission = await db.query.userToolPermissions.findFirst({
      where: and(
        eq(userToolPermissions.userId, userId),
        eq(userToolPermissions.toolName, toolName)
      )
    });

    // If custom permission exists, use that
    if (userPermission) {
      return NextResponse.json({
        enabled: userPermission.isEnabled,
        source: 'custom',
        updatedAt: userPermission.updatedAt,
        updatedBy: userPermission.updatedBy
      });
    }

    // Otherwise check global tool setting
    const toolSetting = await db.query.toolPricingTable.findFirst({
      where: eq(toolPricingTable.tool_name, toolName)
    });

    // Default to true if no setting found (for backward compatibility)
    const enabled = toolSetting?.enable_disenable ?? true;

    return NextResponse.json({
      enabled,
      source: 'global',
      globalSetting: toolSetting?.enable_disenable
    });

  } catch (error) {
    console.error('Error checking tool status:', error);
    return NextResponse.json(
      { error: 'Failed to check tool status' },
      { status: 500 }
    );
  }
}
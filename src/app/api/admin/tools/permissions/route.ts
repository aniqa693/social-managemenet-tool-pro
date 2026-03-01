import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../../../../db';
import { toolPricingTable,user,userToolPermissions } from '../../../../../../db/schema';
import { getServerSession } from '../../../../../../lib/auth-server';

// Define types for better TypeScript support
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  credits: number | null;
  createdAt: Date | null;
};

type Tool = {
  tool_name: string;
  credits_required: number;
  enable_disenable: boolean | null;
};

type UserPermission = {
  id: number;
  userId: string;
  toolName: string;
  isEnabled: boolean;
  updatedBy: string | null;
  updatedAt: Date;
  createdAt: Date;
};

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

// ==================== GET - Fetch tool permissions ====================
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const toolName = searchParams.get('toolName');
    const type = searchParams.get('type') || 'all';

    console.log('📡 GET request:', { type, userId, toolName });

    switch (type) {
      case 'user-permissions':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }
        return await getUserToolPermissions(userId);
      
      case 'all-users-permissions':
        return await getAllUsersToolPermissions();
      
      case 'tools-list':
        return await getToolsList();
      
      case 'user-with-permissions':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }
        return await getUserWithPermissions(userId);
      
      default:
        // Get all tools and their status for all users (for admin dashboard)
        return await getCompletePermissionsData();
    }

  } catch (error) {
    console.error('Error fetching tool permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// ==================== POST - Update tool permissions ====================
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    console.log('📡 POST request:', { action, body });

    switch (action) {
      case 'toggle-user-tool':
        return await toggleUserToolPermission(body);
      
      case 'bulk-toggle-tool':
        return await bulkToggleToolPermission(body);
      
      case 'set-user-permissions':
        return await setUserPermissions(body);
      
      case 'disable-all-tools':
        return await disableAllToolsForUser(body);
      
      case 'enable-all-tools':
        return await enableAllToolsForUser(body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating tool permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Helper: Get all available tools
async function getToolsList() {
  const tools = await db
    .select({
      id: toolPricingTable.id,
      tool_name: toolPricingTable.tool_name,
      credits_required: toolPricingTable.credits_required,
      enable_disenable: toolPricingTable.enable_disenable
    })
    .from(toolPricingTable)
    .orderBy(toolPricingTable.tool_name);

  return NextResponse.json({ 
    success: true,
    tools 
  });
}

// Helper: Get tool permissions for a specific user
async function getUserToolPermissions(userId: string) {
  // Get all tools
  const allTools = await db
    .select({
      tool_name: toolPricingTable.tool_name,
      credits_required: toolPricingTable.credits_required,
      global_enabled: toolPricingTable.enable_disenable
    })
    .from(toolPricingTable);

  // Get user's custom permissions
  const userPermissions = await db
    .select()
    .from(userToolPermissions)
    .where(eq(userToolPermissions.userId, userId));

  // Create a map of user permissions
  const permissionMap = new Map<string, UserPermission>();
  userPermissions.forEach((p: UserPermission) => {
    permissionMap.set(p.toolName, p);
  });

  // Combine to get final status
  const toolsWithStatus = allTools.map(tool => {
    const userPerm = permissionMap.get(tool.tool_name);
    return {
      toolName: tool.tool_name,
      creditsRequired: tool.credits_required,
      globalEnabled: tool.global_enabled,
      userEnabled: userPerm ? userPerm.isEnabled : tool.global_enabled,
      customPermission: !!userPerm,
      lastUpdated: userPerm?.updatedAt || null,
      updatedBy: userPerm?.updatedBy || null
    };
  });

  return NextResponse.json({
    success: true,
    userId,
    permissions: toolsWithStatus
  });
}

// Helper: Get all users with their tool permissions
async function getAllUsersToolPermissions() {
  // Get all users (excluding sensitive data)
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits,
      createdAt: user.createdAt
    })
    .from(user)
    .orderBy(user.createdAt);

  // Get all tools
  const tools = await db
    .select({
      tool_name: toolPricingTable.tool_name,
      global_enabled: toolPricingTable.enable_disenable
    })
    .from(toolPricingTable);

  // Get all custom permissions
  const allPermissions = await db
    .select()
    .from(userToolPermissions);

  // Group permissions by user
  const permissionsByUser = new Map<string, UserPermission[]>();
  allPermissions.forEach((perm: UserPermission) => {
    if (!permissionsByUser.has(perm.userId)) {
      permissionsByUser.set(perm.userId, []);
    }
    permissionsByUser.get(perm.userId)!.push(perm);
  });

  // Build response with user and their tool status
  const usersWithPermissions = users.map(user => {
    const userPerms = permissionsByUser.get(user.id) || [];
    const userPermMap = new Map(userPerms.map(p => [p.toolName, p]));

    const toolStatus = tools.map(tool => ({
      toolName: tool.tool_name,
      enabled: userPermMap.has(tool.tool_name) 
        ? userPermMap.get(tool.tool_name)?.isEnabled 
        : tool.global_enabled,
      isCustom: userPermMap.has(tool.tool_name)
    }));

    return {
      ...user,
      toolPermissions: toolStatus
    };
  });

  return NextResponse.json({
    success: true,
    users: usersWithPermissions,
    tools: tools.map(t => t.tool_name)
  });
}

// Helper: Get single user with their permissions
async function getUserWithPermissions(userId: string) {
  const userData = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits,
      createdAt: user.createdAt
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData.length) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const permissionsResponse = await getUserToolPermissions(userId);
  const permissionsData = await permissionsResponse.json();

  return NextResponse.json({
    success: true,
    user: userData[0],
    permissions: permissionsData.permissions
  });
}

// Helper: Toggle permission for a single user-tool combination
async function toggleUserToolPermission(body: any) {
  const { userId, toolName, enabled, updatedBy } = body;

  console.log('🔧 Toggle request:', { userId, toolName, enabled, updatedBy });

  if (!userId || !toolName || enabled === undefined) {
    return NextResponse.json(
      { error: 'User ID, tool name, and enabled status are required' },
      { status: 400 }
    );
  }

  // Check if user exists
  const userExists = await db.query.user.findFirst({
    where: eq(user.id, userId)
  });

  if (!userExists) {
    console.log('❌ User not found:', userId);
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Check if tool exists
  const toolExists = await db.query.toolPricingTable.findFirst({
    where: eq(toolPricingTable.tool_name, toolName)
  });

  if (!toolExists) {
    console.log('❌ Tool not found:', toolName);
    return NextResponse.json(
      { error: 'Tool not found' },
      { status: 404 }
    );
  }

  // Check if permission already exists
  const existingPermission = await db.query.userToolPermissions.findFirst({
    where: and(
      eq(userToolPermissions.userId, userId),
      eq(userToolPermissions.toolName, toolName)
    )
  });

  console.log('📋 Existing permission:', existingPermission);

  let result;
  if (existingPermission) {
    // Update existing permission
    result = await db
      .update(userToolPermissions)
      .set({
        isEnabled: enabled,
        updatedBy: updatedBy || 'admin',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userToolPermissions.userId, userId),
          eq(userToolPermissions.toolName, toolName)
        )
      )
      .returning();
    
    console.log('✅ Updated existing permission:', result[0]);
  } else {
    // Create new permission
    result = await db
      .insert(userToolPermissions)
      .values({
        userId,
        toolName,
        isEnabled: enabled,
        updatedBy: updatedBy || 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log('✅ Created new permission:', result[0]);
  }

  // Get updated global tool status
  const globalTool = await db.query.toolPricingTable.findFirst({
    where: eq(toolPricingTable.tool_name, toolName)
  });

  // Get all permissions for this user to verify
  const allUserPermissions = await db
    .select()
    .from(userToolPermissions)
    .where(eq(userToolPermissions.userId, userId));

  console.log('📋 All permissions for user after update:', allUserPermissions);

  return NextResponse.json({
    success: true,
    message: `Tool ${enabled ? 'enabled' : 'disabled'} for user successfully`,
    permission: result[0],
    globalEnabled: globalTool?.enable_disenable,
    userId: userId,
    toolName: toolName,
    newStatus: enabled
  });
}

// Helper: Bulk toggle tool for multiple users
async function bulkToggleToolPermission(body: any) {
  const { userIds, toolName, enabled, updatedBy } = body;

  console.log('🔧 Bulk toggle request:', { userIds, toolName, enabled, updatedBy });

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !toolName || enabled === undefined) {
    return NextResponse.json(
      { error: 'User IDs array, tool name, and enabled status are required' },
      { status: 400 }
    );
  }

  const results = [];
  const errors = [];

  for (const userId of userIds) {
    try {
      // Check if permission exists
      const existingPermission = await db.query.userToolPermissions.findFirst({
        where: and(
          eq(userToolPermissions.userId, userId),
          eq(userToolPermissions.toolName, toolName)
        )
      });

      if (existingPermission) {
        // Update existing
        await db
          .update(userToolPermissions)
          .set({
            isEnabled: enabled,
            updatedBy: updatedBy || 'admin',
            updatedAt: new Date()
          })
          .where(
            and(
              eq(userToolPermissions.userId, userId),
              eq(userToolPermissions.toolName, toolName)
            )
          );
      } else {
        // Insert new
        await db
          .insert(userToolPermissions)
          .values({
            userId,
            toolName,
            isEnabled: enabled,
            updatedBy: updatedBy || 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      results.push({ userId, success: true });
    } catch (error) {
      console.error(`❌ Error for user ${userId}:`, error);
      errors.push({ 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return NextResponse.json({
    success: results.length > 0,
    message: `Updated ${results.length} users, ${errors.length} failed`,
    results,
    errors
  });
}

// Helper: Set multiple permissions for a user at once
async function setUserPermissions(body: any) {
  const { userId, permissions, updatedBy } = body;

  if (!userId || !permissions || !Array.isArray(permissions)) {
    return NextResponse.json(
      { error: 'User ID and permissions array are required' },
      { status: 400 }
    );
  }

  const results = [];
  const errors = [];

  for (const perm of permissions) {
    try {
      const { toolName, enabled } = perm;

      // Check if permission exists
      const existingPermission = await db.query.userToolPermissions.findFirst({
        where: and(
          eq(userToolPermissions.userId, userId),
          eq(userToolPermissions.toolName, toolName)
        )
      });

      if (existingPermission) {
        // Update existing
        await db
          .update(userToolPermissions)
          .set({
            isEnabled: enabled,
            updatedBy: updatedBy || 'admin',
            updatedAt: new Date()
          })
          .where(
            and(
              eq(userToolPermissions.userId, userId),
              eq(userToolPermissions.toolName, toolName)
            )
          );
      } else {
        // Insert new
        await db
          .insert(userToolPermissions)
          .values({
            userId,
            toolName,
            isEnabled: enabled,
            updatedBy: updatedBy || 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      results.push({ toolName, success: true });
    } catch (error) {
      errors.push({ 
        toolName: perm.toolName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return NextResponse.json({
    success: results.length > 0,
    message: `Updated ${results.length} permissions, ${errors.length} failed`,
    results,
    errors
  });
}

// Helper: Disable all tools for a user
async function disableAllToolsForUser(body: any) {
  const { userId, updatedBy } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  // Get all tools
  const tools = await db
    .select({ tool_name: toolPricingTable.tool_name })
    .from(toolPricingTable);

  const results = [];

  for (const tool of tools) {
    // Check if permission exists
    const existingPermission = await db.query.userToolPermissions.findFirst({
      where: and(
        eq(userToolPermissions.userId, userId),
        eq(userToolPermissions.toolName, tool.tool_name)
      )
    });

    if (existingPermission) {
      // Update existing
      await db
        .update(userToolPermissions)
        .set({
          isEnabled: false,
          updatedBy: updatedBy || 'admin',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userToolPermissions.userId, userId),
            eq(userToolPermissions.toolName, tool.tool_name)
          )
        );
    } else {
      // Insert new
      await db
        .insert(userToolPermissions)
        .values({
          userId,
          toolName: tool.tool_name,
          isEnabled: false,
          updatedBy: updatedBy || 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }

    results.push(tool.tool_name);
  }

  return NextResponse.json({
    success: true,
    message: `Disabled all tools (${results.length}) for user`,
    disabledTools: results
  });
}

// Helper: Enable all tools for a user
async function enableAllToolsForUser(body: any) {
  const { userId, updatedBy } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  // Delete all custom permissions for this user (revert to global defaults)
  await db
    .delete(userToolPermissions)
    .where(eq(userToolPermissions.userId, userId));

  return NextResponse.json({
    success: true,
    message: `Enabled all tools for user (reverted to global settings)`
  });
}

// Helper: Get complete permissions data for admin dashboard
async function getCompletePermissionsData() {
  console.log('📊 Getting complete permissions data...');

  // Get all users with basic info
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits,
      createdAt: user.createdAt
    })
    .from(user)
    .orderBy(user.createdAt);

  console.log(`👥 Found ${users.length} users`);

  // Get all tools
  const tools = await db
    .select({
      tool_name: toolPricingTable.tool_name,
      credits_required: toolPricingTable.credits_required,
      global_enabled: toolPricingTable.enable_disenable
    })
    .from(toolPricingTable)
    .orderBy(toolPricingTable.tool_name);

  console.log(`🛠️ Found ${tools.length} tools`);

  // Get all custom permissions
  const customPermissions = await db
    .select()
    .from(userToolPermissions)
    .orderBy(userToolPermissions.updatedAt);

  console.log(`🔧 Found ${customPermissions.length} custom permissions`);

  // Get recent permission changes
  const recentChanges = await db
    .select({
      id: userToolPermissions.id,
      userId: userToolPermissions.userId,
      toolName: userToolPermissions.toolName,
      isEnabled: userToolPermissions.isEnabled,
      updatedBy: userToolPermissions.updatedBy,
      updatedAt: userToolPermissions.updatedAt,
      userName: user.name,
      userEmail: user.email
    })
    .from(userToolPermissions)
    .leftJoin(user, eq(userToolPermissions.userId, user.id))
    .orderBy(desc(userToolPermissions.updatedAt))
    .limit(20);

  // Group permissions by user for tool status
  const permissionsByUser = new Map<string, UserPermission[]>();
  customPermissions.forEach((perm: UserPermission) => {
    if (!permissionsByUser.has(perm.userId)) {
      permissionsByUser.set(perm.userId, []);
    }
    permissionsByUser.get(perm.userId)!.push(perm);
  });

  // Build users with permissions
  const usersWithPermissions = users.map(user => {
    const userPerms = permissionsByUser.get(user.id) || [];
    const userPermMap = new Map(userPerms.map(p => [p.toolName, p]));

    const toolStatus = tools.map(tool => ({
      toolName: tool.tool_name,
      enabled: userPermMap.has(tool.tool_name) 
        ? userPermMap.get(tool.tool_name)?.isEnabled 
        : tool.global_enabled,
      isCustom: userPermMap.has(tool.tool_name)
    }));

    return {
      ...user,
      toolPermissions: toolStatus
    };
  });

  // Summary statistics
  const totalCustomPermissions = customPermissions.length;
  const enabledCustomPermissions = customPermissions.filter((p: UserPermission) => p.isEnabled).length;
  const disabledCustomPermissions = totalCustomPermissions - enabledCustomPermissions;

  const summary = {
    totalUsers: users.length,
    totalTools: tools.length,
    totalCustomPermissions,
    enabledCustomPermissions,
    disabledCustomPermissions,
    toolsWithGlobalDisabled: tools.filter((t: any) => !t.global_enabled).length
  };

  console.log('📊 Summary:', summary);

  return NextResponse.json({
    success: true,
    summary,
    users: usersWithPermissions,
    tools,
    customPermissions,
    recentChanges
  });
}
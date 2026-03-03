import { NextRequest, NextResponse } from 'next/server';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { db } from '../../../../../db';
import { user } from '../../../../../db/schema';
import { getServerSession } from '../../../../../lib/auth-server';

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

// ==================== GET - Fetch all users ====================
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where conditions for creator and analyst only
    let whereConditions = and(
      or(
        eq(user.role, 'creator'),
        eq(user.role, 'analyst')
      )
    );

    // Add search filter
    if (search) {
      whereConditions = and(
        whereConditions,
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    // Add role filter
    if (role) {
      whereConditions = and(
        whereConditions,
        eq(user.role, role as 'creator' | 'analyst')
      );
    }

    // Add status filter
    if (status === 'active') {
      whereConditions = and(
        whereConditions,
        eq(user.emailVerified, true)
      );
    } else if (status === 'suspended') {
      whereConditions = and(
        whereConditions,
        eq(user.emailVerified, false)
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereConditions);
    
    const total = Number(totalResult[0]?.count) || 0;

    // Fetch users with pagination
    const users = await db
      .select()
      .from(user)
      .where(whereConditions)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// ==================== POST - Create new user ====================


// ==================== PUT - UPDATE user information ====================
export async function PUT(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, email, role, credits } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is creator or analyst
    if (!['creator', 'analyst'].includes(existingUser.role)) {
      return NextResponse.json(
        { error: 'Can only update creator or analyst users' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    
    if (email && email !== existingUser.email) {
      // Check if email is already taken by another user
      const emailExists = await db.query.user.findFirst({
        where: and(
          eq(user.email, email),
          sql`${user.id} != ${id}`
        ),
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 409 }
        );
      }
      updateData.email = email;
    }
    
    if (role && ['creator', 'analyst'].includes(role)) {
      updateData.role = role;
    }
    
    if (credits !== undefined) {
      if (credits < 0) {
        return NextResponse.json(
          { error: 'Credits cannot be negative' },
          { status: 400 }
        );
      }
      updateData.credits = credits;
    }

    // Update user
    const updatedUser = await db.update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser[0] 
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ==================== PATCH - Suspend/Activate user ====================
export async function PATCH(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    if (!['suspend', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be suspend or activate' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is creator or analyst
    if (!['creator', 'analyst'].includes(existingUser.role)) {
      return NextResponse.json(
        { error: 'Can only suspend/activate creator or analyst users' },
        { status: 403 }
      );
    }

    // Update user status
    const emailVerified = action === 'activate';
    
    const updatedUser = await db.update(user)
      .set({ 
        emailVerified,
        updatedAt: new Date() 
      })
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json({ 
      message: `User ${action}d successfully`,
      user: updatedUser[0] 
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Permanently remove user ====================
export async function DELETE(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is creator or analyst
    if (!['creator', 'analyst'].includes(existingUser.role)) {
      return NextResponse.json(
        { error: 'Can only delete creator or analyst users' },
        { status: 403 }
      );
    }

    // Delete user
    await db.delete(user).where(eq(user.id, id));

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      }
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
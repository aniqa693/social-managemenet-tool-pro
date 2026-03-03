import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../../db';
import { user } from '../../../../../../db/schema';
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

// ==================== POST - Create new user ====================
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, credits = 0 } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    if (!['creator', 'analyst'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be creator or analyst' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const newUser = await db.insert(user).values({
      id: crypto.randomUUID(),
      name,
      email,
      role,
      credits,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ 
      message: 'User created successfully',
      user: newUser[0] 
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ==================== GET - Check email availability ====================
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    return NextResponse.json({ 
      exists: !!existingUser,
      message: existingUser ? 'Email already exists' : 'Email is available'
    });
    
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
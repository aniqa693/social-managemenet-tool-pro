// app/api/tool-cost/[toolName]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CreditManager } from "../../../../../lib/credit-manager";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ toolName: string }> }
) {
  try {
    const { toolName } = await context.params;

    // This will auto-create the tool if it doesn't exist
    const cost = await CreditManager.getToolCost(toolName);
    
    // Get tool info to check if it was just created
    const wasCreated = cost !== 5 || toolName.includes('generator'); // Simple heuristic
    
    return NextResponse.json({ 
      cost,
      toolName,
      message: wasCreated ? 'Tool pricing auto-created' : 'Tool pricing retrieved',
      created: wasCreated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// lib/credit-manager.ts
import { db } from '../db';
import { creditsTransactionsTable, user, toolPricingTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export type TransactionType = 'purchase' | 'tool_usage' | 'refund' | 'bonus' | 'admin_adjustment';

export interface CreditTransactionResult {
  success: boolean;
  message: string;
  remainingCredits?: number;
  transactionId?: number;
  error?: string;
  amount?: number;
}

export class CreditManager {
  
  // Default tool pricing (fallback if not in DB)
  private static readonly DEFAULT_TOOL_PRICING: Record<string, number> = {
    'caption_generator': 2,
    'image_generator': 10,
    'video_editor': 25,
    'audio_transcriber': 5,
    'pdf_converter': 3,
    'text_analyzer': 2,
    'code_assistant': 1,
  };

  /**
   * Get tool cost with auto-initialization
   */
  static async getToolCost(toolName: string): Promise<number> {
    try {
      // Try to get from database first
      let [tool] = await db
        .select({ credits_required: toolPricingTable.credits_required })
        .from(toolPricingTable)
        .where(eq(toolPricingTable.tool_name, toolName));

      // If tool doesn't exist in DB, create it with default value
      if (!tool) {
        const defaultCost = this.DEFAULT_TOOL_PRICING[toolName] || 5;
        
        console.log(`🆕 Tool "${toolName}" not found in pricing table, creating with default cost: ${defaultCost}`);
        
        try {
          const [newTool] = await db
            .insert(toolPricingTable)
            .values({
              tool_name: toolName,
              credits_required: defaultCost,
            })
            .returning({ credits_required: toolPricingTable.credits_required });

          if (newTool) {
            console.log(`✅ Successfully created tool "${toolName}" with cost ${defaultCost}`);
            return newTool.credits_required;
          }
        } catch (insertError) {
          console.log(`⚠️ Insert failed, trying to select again...`);
          [tool] = await db
            .select({ credits_required: toolPricingTable.credits_required })
            .from(toolPricingTable)
            .where(eq(toolPricingTable.tool_name, toolName));

          if (tool) {
            return tool.credits_required;
          }
        }

        return defaultCost;
      }

      return tool.credits_required;
    } catch (error) {
      console.error('Error fetching tool cost:', error);
      return this.DEFAULT_TOOL_PRICING[toolName] || 5;
    }
  }

  /**
   * Check if user has sufficient credits for a tool
   */
  static async hasSufficientCredits(userId: string, toolName: string): Promise<{
    hasCredits: boolean;
    requiredCredits: number;
    currentCredits: number;
  }> {
    try {
      // Get user's current credits
      const [userResult] = await db
        .select({ credits: user.credits })
        .from(user)
        .where(eq(user.id, userId));
      
      if (!userResult) {
        throw new Error('User not found');
      }
      
      const currentCredits = userResult.credits ?? 0;
      
      // This will auto-create the tool if it doesn't exist
      const requiredCredits = await this.getToolCost(toolName);
      
      return {
        hasCredits: currentCredits >= requiredCredits,
        requiredCredits,
        currentCredits
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      throw error;
    }
  }

  /**
   * Deduct credits for tool usage - WITHOUT TRANSACTIONS (for Neon HTTP)
   */
  static async useTool(
    userId: string, 
    toolName: string, 
    description?: string,
    metadata?: any
  ): Promise<CreditTransactionResult> {
    try {
      // Check credits first
      const { hasCredits, requiredCredits, currentCredits } = 
        await this.hasSufficientCredits(userId, toolName);
      
      if (!hasCredits) {
        return {
          success: false,
          message: `Insufficient credits. Required: ${requiredCredits}, Available: ${currentCredits}`,
          remainingCredits: currentCredits
        };
      }

      // STEP 1: Deduct credits from user
      const [updatedUser] = await db
        .update(user)
        .set({ 
          credits: sql`${user.credits} - ${requiredCredits}`,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning({ credits: user.credits });

      if (!updatedUser) {
        throw new Error('Failed to update user credits');
      }

      const remainingCredits = updatedUser.credits ?? 0;

      // STEP 2: Create transaction record (separate query)
      const [transaction] = await db
        .insert(creditsTransactionsTable)
        .values({
          userId,
          amount: -requiredCredits,
          type: 'tool_usage',
          description: description || `Used ${toolName} tool`,
          toolUsed: toolName,
          remainingCredits,
          createdAt: new Date()
        })
        .returning({ id: creditsTransactionsTable.id });

      return {
        success: true,
        message: `Successfully used ${toolName}. Credits deducted: ${requiredCredits}`,
        remainingCredits,
        transactionId: transaction?.id,
        amount: requiredCredits
      };

    } catch (error) {
      console.error('Error using tool:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process credit deduction',
        error: String(error)
      };
    }
  }

  /**
   * Add credits to user account - WITHOUT TRANSACTIONS
   */
  static async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: { toolUsed?: string }
  ): Promise<CreditTransactionResult> {
    try {
      if (amount <= 0) {
        return {
          success: false,
          message: 'Amount must be positive'
        };
      }

      // STEP 1: Add credits to user
      const [updatedUser] = await db
        .update(user)
        .set({ 
          credits: sql`${user.credits} + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning({ credits: user.credits });

      if (!updatedUser) {
        throw new Error('Failed to update user credits');
      }

      const remainingCredits = updatedUser.credits ?? 0;

      // STEP 2: Create transaction record
      const [transaction] = await db
        .insert(creditsTransactionsTable)
        .values({
          userId,
          amount,
          type,
          description,
          toolUsed: metadata?.toolUsed,
          remainingCredits,
          createdAt: new Date()
        })
        .returning({ id: creditsTransactionsTable.id });

      return {
        success: true,
        message: `Successfully added ${amount} credits`,
        remainingCredits,
        transactionId: transaction?.id,
        amount
      };

    } catch (error) {
      console.error('Error adding credits:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add credits',
        error: String(error)
      };
    }
  }

  /**
   * Get user's credit balance
   */
  static async getBalance(userId: string): Promise<number> {
    const [result] = await db
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, userId));
    
    return result?.credits ?? 0;
  }

  /**
   * Get user's transaction history
   */
  static async getTransactionHistory(userId: string, limit = 50, offset = 0) {
    return await db
      .select()
      .from(creditsTransactionsTable)
      .where(eq(creditsTransactionsTable.userId, userId))
      .orderBy(creditsTransactionsTable.createdAt)
      .limit(limit)
      .offset(offset);
  }
}
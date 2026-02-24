// app/credits/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, Calendar, Clock, CreditCard, Coins, 
  Filter, Search, ArrowLeft, Download,
  TrendingUp, TrendingDown, Wallet, PieChart,
  ChevronLeft, ChevronRight, RefreshCw,
  LogIn, Award, Zap, ShoppingCart, Gift,
  AlertCircle, CheckCircle, FileText,
  BarChart3, Hash, Type, Film, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from '../../../../../../lib/auth-client';
import Link from 'next/link';

// Type definitions
type CreditTransaction = {
  id: number;
  amount: number;
  type: 'purchase' | 'tool_usage' | 'refund' | 'bonus';
  description: string | null;
  toolUsed: string | null;
  remainingCredits: number;
  createdAt: string | null;
  userId: string;
  toolCreditsRequired?: number | null;
};

type CreditSummary = {
  totalTransactions: number;
  currentBalance: number;
  totalCreditsUsed: number;
  totalCreditsPurchased: number;
  totalCreditsBonus: number;
  usageByTool: Record<string, number>;
};

type ApiResponse = {
  success: boolean;
  data: CreditTransaction[];
  summary: CreditSummary;
  user?: {
    email: string;
    id: string;
  };
  message?: string;
  error?: string;
};

// Helper function to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

// Get icon for transaction type
const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'purchase': return <ShoppingCart className="h-4 w-4" />;
    case 'tool_usage': return <Zap className="h-4 w-4" />;
    case 'refund': return <RefreshCw className="h-4 w-4" />;
    case 'bonus': return <Gift className="h-4 w-4" />;
    default: return <Coins className="h-4 w-4" />;
  }
};

// Get color for transaction type
const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case 'purchase': 
      return 'bg-green-100 text-green-800 border-green-300';
    case 'tool_usage': 
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'refund': 
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'bonus': 
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default: 
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Get icon for tool
const getToolIcon = (tool: string | null) => {
  if (!tool) return <Coins className="h-4 w-4" />;
  
  switch (tool.toLowerCase()) {
    case 'caption_generation':
    case 'captions':
      return <MessageSquare className="h-4 w-4" />;
    case 'title_generation':
    case 'titles':
      return <Type className="h-4 w-4" />;
    case 'script_generation':
    case 'scripts':
      return <Film className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
};

// Format tool name for display
const formatToolName = (tool: string | null) => {
  if (!tool) return 'General';
  
  return tool
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Items per page
const ITEMS_PER_PAGE = 10;

export default function CreditHistoryPage() {
  // Get user session
  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;
  const isLoggedIn = !!user;

  // State
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({
    totalTransactions: 0,
    currentBalance: 0,
    totalCreditsUsed: 0,
    totalCreditsPurchased: 0,
    totalCreditsBonus: 0,
    usageByTool: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Load credit history
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchCreditHistory = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch('/api/credits/history');
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch credit history');
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success) {
          setTransactions(data.data);
          setSummary(data.summary);
        } else {
          throw new Error(data.error || 'Failed to fetch credit history');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        toast.error('Failed to load credit history');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditHistory();
  }, [isLoggedIn]);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.toolUsed && transaction.toolUsed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    // Date range filter
    let matchesDate = true;
    if (dateRange !== 'all' && transaction.createdAt) {
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      
      if (dateRange === 'today') {
        matchesDate = transactionDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        matchesDate = transactionDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        matchesDate = transactionDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, dateRange]);

  // Handle export
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Tool', 'Description', 'Remaining Credits'];
    const csvData = filteredTransactions.map(t => [
      formatDate(t.createdAt),
      t.type,
      t.amount,
      t.toolUsed || 'N/A',
      t.description || '',
      t.remainingCredits
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Credit history exported! 📊');
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your credit history...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              Please log in to view your credit history
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-purple-600" />
            </div>
            <p className="mb-6 text-gray-600">
              You need to be logged in to see your credit usage history.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Go to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full">
                <CreditCard className="h-5 w-5" />
                <span className="font-semibold">Credit History</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="gap-2"
              disabled={filteredTransactions.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600">
              Your Credit Usage History
            </span>
          </h1>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-gray-600">
              {user?.email ? `Viewing credit history for ${user.email}` : 'Track your credit usage and purchases'}
            </p>
            
            <div className="text-sm text-gray-500">
              {transactions.length} total transactions • {filteredTransactions.length} filtered
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Wallet className="h-8 w-8 text-purple-600" />
                  <Badge variant="outline" className="bg-purple-200 text-purple-800 border-purple-300">
                    Current
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-purple-900">{summary.currentBalance}</p>
                <p className="text-sm text-purple-700">Available Credits</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <Badge variant="outline" className="bg-green-200 text-green-800 border-green-300">
                    Purchased
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-green-900">{summary.totalCreditsPurchased}</p>
                <p className="text-sm text-green-700">Total Credits Purchased</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="h-8 w-8 text-blue-600" />
                  <Badge variant="outline" className="bg-blue-200 text-blue-800 border-blue-300">
                    Used
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-900">{summary.totalCreditsUsed}</p>
                <p className="text-sm text-blue-700">Total Credits Used</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <Badge variant="outline" className="bg-purple-200 text-purple-800 border-purple-300">
                    Tools
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-purple-900">{Object.keys(summary.usageByTool).length}</p>
                <p className="text-sm text-purple-700">Tools Used</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Usage by Tool (if there's data) */}
        {Object.keys(summary.usageByTool).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Usage by Tool
              </CardTitle>
              <CardDescription>
                Credits consumed per tool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(summary.usageByTool).map(([tool, credits]) => (
                  <div key={tool} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getToolIcon(tool)}
                      <span className="font-medium">{formatToolName(tool)}</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {credits} credits
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-8 shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Transaction Type
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                    <SelectItem value="tool_usage">Tool Usage</SelectItem>
                    <SelectItem value="bonus">Bonuses</SelectItem>
                    <SelectItem value="refund">Refunds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setDateRange('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50/80">
            <CardContent className="py-20 text-center">
              <Coins className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Transactions Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' || dateRange !== 'all'
                  ? 'Try changing your search or filters'
                  : 'Start using tools to see your credit usage history!'}
              </p>
              {!searchTerm && filterType === 'all' && dateRange === 'all' && (
                <Button onClick={() => window.location.href = '/'}>
                  Start Generating
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {paginatedTransactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDate(transaction.createdAt)}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge className={`${getTransactionTypeColor(transaction.type)} flex items-center gap-1 w-fit`}>
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className={`flex items-center gap-1 font-semibold ${
                              transaction.amount > 0 
                                ? 'text-green-600' 
                                : transaction.amount < 0 
                                  ? 'text-red-600' 
                                  : 'text-gray-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              <Coins className="h-3 w-3 ml-1" />
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {transaction.toolUsed ? (
                              <div className="flex items-center gap-2">
                                {getToolIcon(transaction.toolUsed)}
                                <span className="text-sm">{formatToolName(transaction.toolUsed)}</span>
                                {transaction.toolCreditsRequired && (
                                  <Badge variant="outline" className="text-xs bg-gray-50">
                                    {transaction.toolCreditsRequired} credits/tool
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {transaction.description || 'No description'}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right font-semibold">
                            {transaction.remainingCredits}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
              
              {totalPages > 1 && (
                <CardFooter className="border-t pt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{' '}
                    {filteredTransactions.length} transactions
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber: number;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-8"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
            
            {/* Summary Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{summary.totalTransactions} total transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-500" />
                  <span>Current balance: {summary.currentBalance} credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>{Object.keys(summary.usageByTool).length} tools used</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
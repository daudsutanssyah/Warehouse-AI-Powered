/** Generic wrapper for all API route responses */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  count?: number
  error?: string
}

/** Authenticated user from Supabase Auth */
export type User = {
  id: string
  email: string
  created_at: string
}

/** A product owned by a user, stored in the products table */
export type Product = {
  id: string
  user_id: string
  name: string
  sku: string
  category: string | null
  price: number | null
  unit?: string | null
  description?: string | null
  is_active?: boolean
  created_at: string
  updated_at?: string
}

/** A physical warehouse location owned by a user */
export type Warehouse = {
  id: string
  user_id: string
  name: string
  location: string | null
  max_capacity: number
  created_at: string
}

/** Stock record linking a product to a warehouse with a quantity */
export type Stock = {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  updated_at: string
}

/** Stock record with joined product and warehouse data for display purposes */
export type StockWithDetails = Stock & {
  product: Product
  warehouse: Warehouse
}

/** A single actionable item within an AI insight report */
export type InsightItem = {
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string | null
}

/** AI-generated insight report for warehouse/stock analysis */
export type AiInsight = {
  summary: string
  items: InsightItem[]
  generated_at: string
  model: string
}

/** A single message in the AI chat conversation */
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grsyqstzcyoocsvnmwjz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc3lxc3R6Y3lvb2Nzdm5td2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDgzNjksImV4cCI6MjA3MDc4NDM2OX0.0bS_X5u3zIlmIFsz8OlZqwNQhJawna9lqpw9TcrHmVA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  profile_image_url?: string
  theme_preference?: 'light' | 'dark' | 'auto'
  language_preference?: string
  timezone?: string
  subscription_tier?: 'free' | 'pro' | 'max'
  subscription_status?: 'active' | 'cancelled' | 'expired'
  notifications_enabled?: boolean
  analytics_enabled?: boolean
  data_retention_days?: number
  created_at?: string
  updated_at?: string
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: Partial<UserProfile>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Create or update user profile
  async upsertUserProfile(profileData: Partial<UserProfile>) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get user profile
  async getUserProfile() {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
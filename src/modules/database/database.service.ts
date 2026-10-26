import { Injectable, OnModuleInit } from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase.config';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private supabase: any = null;

  onModuleInit() {
    try {
      this.supabase = getSupabaseClient();
    } catch (error) {
      console.warn('Database service initialized without Supabase connection. Database operations will fail until credentials are configured.');
    }
  }

  /**
   * Generic select query
   */
  async select<T>(table: string, columns: string = '*') {
    this.ensureConnected();
    const { data, error } = await this.supabase
      .from(table)
      .select(columns)
      .throwOnError();

    if (error) {
      throw this.handleError(error);
    }

    return data as T[];
  }

  /**
   * Select by ID
   */
  async selectById<T>(table: string, id: string, columns: string = '*') {
    this.ensureConnected();
    const { data, error } = await this.supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .single()
      .throwOnError();

    if (error) {
      throw this.handleError(error);
    }

    return data as T;
  }

  /**
   * Select with filters
   */
  async selectWithFilters<T>(
    table: string,
    filters: Record<string, any>,
    columns: string = '*',
  ) {
    this.ensureConnected();
    let query = this.supabase.from(table).select(columns);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.throwOnError();

    if (error) {
      throw this.handleError(error);
    }

    return data as T[];
  }

  /**
   * Insert record
   */
  async insert<T>(table: string, data: any) {
    this.ensureConnected();
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single()
      .throwOnError();

    if (error) {
      throw this.handleError(error);
    }

    return result as T;
  }

  /**
   * Update record
   */
  async update<T>(table: string, id: string, data: any) {
    this.ensureConnected();
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
      .throwOnError();

    if (error) {
      throw this.handleError(error);
    }

    return result as T;
  }

  /**
   * Delete record
   */
  async delete(table: string, id: string) {
    this.ensureConnected();
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id)
      .throwOnError();

    if (error) {
      throw this.handleError(error);
    }

    return { success: true };
  }

  /**
   * Get Supabase client for custom queries
   */
  getClient() {
    this.ensureConnected();
    return this.supabase;
  }

  /**
   * Ensure Supabase client is initialized
   */
  private ensureConnected() {
    if (!this.supabase) {
      throw new Error('Database not connected. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.');
    }
  }

  /**
   * Handle Supabase errors
   */
  private handleError(error: PostgrestError) {
    console.error('Database error:', error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

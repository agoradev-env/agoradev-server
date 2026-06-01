import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(featured?: boolean) {
    const supabase = this.supabaseService.getClient();
    let query = supabase.from('products').select('*');
    
    if (featured) {
      query = query.eq('featured', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: number) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
}

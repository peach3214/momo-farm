import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

interface ShoppingCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface ShoppingItem {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  url: string | null;
  memo: string | null;
  is_purchased: boolean;
  purchased_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || TEST_USER_ID;
};

export const useShopping = () => {
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('shopping_categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Omit<ShoppingCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('shopping_categories')
        .insert([{ ...category, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCategories([...categories, data]);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<ShoppingCategory>) => {
    try {
      const { data, error } = await supabase
        .from('shopping_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCategories(categories.map(c => c.id === id ? data : c));
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
      setItems(items.filter(i => i.category_id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addItem = async (item: Omit<ShoppingItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([{ ...item, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setItems([...items, data]);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setItems(items.map(i => i.id === id ? data : i));
      }
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  const togglePurchased = async (id: string, isPurchased: boolean) => {
    await updateItem(id, {
      is_purchased: isPurchased,
      purchased_at: isPurchased ? new Date().toISOString() : null,
    });
  };

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  return {
    categories,
    items,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    togglePurchased,
  };
};

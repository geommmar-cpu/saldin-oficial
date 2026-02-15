import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { defaultCategories, type CategoryConfig, type CategoryGroup } from "@/lib/categories";
import { Tag, LucideIcon } from "lucide-react";

export type CategoryRow = Tables<"categories">;
export type CategoryInsert = TablesInsert<"categories">;
export type CategoryUpdate = TablesUpdate<"categories">;

// Convert a DB custom category to a CategoryConfig shape
function toLocalConfig(row: CategoryRow): CategoryConfig {
  return {
    id: row.id,
    name: row.name,
    icon: Tag, // Default icon for custom
    group: (row.group_name as CategoryGroup) || "outros",
    color: row.color || "#94A3B8",
    nature: row.nature as any || "Variável",
    isCustom: !row.is_default,
  };
}

/**
 * Fetch user's custom categories from Supabase.
 */
export const useCustomCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      return (data || []) as CategoryRow[];
    },
    enabled: !!user,
  });
};

/**
 * Returns all categories: default + custom, merged with database IDs.
 * Matches default categories from DB with their local rich config (icons, etc.)
 */
export const useAllCategories = () => {
  const { data: dbCategories = [], isLoading } = useCustomCategories();

  const allCategories: CategoryConfig[] = useMemo(() => {
    // Start with all local default categories from lib
    const categoriesMap = new Map<string, CategoryConfig>();
    defaultCategories.forEach(c => categoriesMap.set(c.name.toLowerCase(), { ...c }));

    // Merge with DB categories
    dbCategories.forEach(row => {
      const nameKey = row.name.toLowerCase();
      const existing = categoriesMap.get(nameKey);

      if (row.is_default && existing) {
        // Update the default category with its DB UUID while keeping rich local meta
        categoriesMap.set(nameKey, {
          ...existing,
          id: row.id,
          isCustom: false,
        });
      } else if (!row.is_default) {
        // It's a custom category, add it using its DB ID as key to avoid name collisions with defaults
        categoriesMap.set(row.id, toLocalConfig(row));
      }
    });

    return Array.from(categoriesMap.values());
  }, [dbCategories]);

  return { allCategories, customCategories: dbCategories.filter(c => !c.is_default), isLoading };
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: { name: string; type: string; color?: string; icon?: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Check for duplicates (local + custom)
      const normalizedName = category.name.trim().toLowerCase();
      const localDuplicate = defaultCategories.find(
        (c) => c.name.toLowerCase() === normalizedName
      );
      if (localDuplicate) {
        throw new Error(`Já existe uma categoria padrão "${localDuplicate.name}"`);
      }

      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", normalizedName)
        .maybeSingle();

      if (existing) {
        throw new Error("Já existe uma categoria com esse nome");
      }

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: category.name.trim(),
          type: category.type,
          color: category.color || null,
          icon: category.icon || null,
          group_name: (category as any).group_name || "outros",
          nature: (category as any).nature || "Variável",
          user_id: user.id,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar categoria");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar categoria");
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if it's default first
      const { data: cat } = await supabase
        .from("categories")
        .select("is_default")
        .eq("id", id)
        .maybeSingle();

      if (cat?.is_default) {
        throw new Error("Não é possível excluir uma categoria padrão");
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida!");
    },
    onError: () => {
      toast.error("Erro ao remover categoria");
    },
  });
};

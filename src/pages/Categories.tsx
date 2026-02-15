// Tela de categorias com CRUD para categorias personalizadas

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Plus, Tag, Pencil, Trash2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  defaultCategories,
  categoryGroups,
  getGroupedCategories,
  type CategoryGroup,
  type CategoryNature
} from "@/lib/categories";
import { useCustomCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const colorOptions = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#F59E0B", label: "Laranja" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#14B8A6", label: "Turquesa" },
  { value: "#F59E0B", label: "Âmbar" },
  { value: "#6366F1", label: "Índigo" },
  { value: "#94A3B8", label: "Neutro" },
];

const natureOptions: { value: CategoryNature; label: string }[] = [
  { value: "Fixo", label: "Fixo" },
  { value: "Variável", label: "Variável" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Investimento", label: "Investimento" },
  { value: "Renda", label: "Renda" },
];

export default function Categories() {
  const navigate = useNavigate();
  const groupedCategories = getGroupedCategories();
  const { data: customCategories = [], isLoading } = useCustomCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string; group: CategoryGroup; nature: CategoryNature } | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#94A3B8");
  const [newGroup, setNewGroup] = useState<CategoryGroup>("outros");
  const [newNature, setNewNature] = useState<CategoryNature>("Variável");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const groupOrder: CategoryGroup[] = [
    "contas_fixas", "impostos", "financeiro", "consumo",
    "moradia", "saude", "transporte", "educacao", "pessoal", "outros",
  ];

  const openCreateDialog = () => {
    setEditingCategory(null);
    setNewName("");
    setNewColor("#3B82F6");
    setNewGroup("outros");
    setNewNature("Variável");
    setDialogOpen(true);
  };

  const openEditDialog = (cat: any) => {
    setEditingCategory({
      id: cat.id,
      name: cat.name,
      color: cat.color || "#94A3B8",
      group: cat.group_name as CategoryGroup || "outros",
      nature: cat.nature as CategoryNature || "Variável"
    });
    setNewName(cat.name);
    setNewColor(cat.color || "#94A3B8");
    setNewGroup(cat.group_name as CategoryGroup || "outros");
    setNewNature(cat.nature as CategoryNature || "Variável");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newName.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: newName.trim(),
        color: newColor,
        group_name: newGroup,
        nature: newNature,
      } as any);
    } else {
      await createCategory.mutateAsync({
        name: newName.trim(),
        type: "expense",
        color: newColor,
        group_name: newGroup,
        nature: newNature,
      } as any);
    }
    setDialogOpen(false);
    setNewName("");
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCategory.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3">
          <FadeIn>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="font-serif text-xl font-semibold">Categorias</h1>
                  <p className="text-xs text-muted-foreground">
                    Organize seus gastos por categoria
                  </p>
                </div>
              </div>
              <Button variant="warm" size="sm" className="gap-1.5" onClick={openCreateDialog}>
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            </div>
          </FadeIn>
        </div>
      </header>

      <main className="px-5 space-y-6 pt-4">
        {/* Custom Categories Section */}
        {customCategories.length > 0 && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <h2 className="font-serif text-lg font-semibold">Minhas Categorias</h2>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {customCategories.map((cat, index) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 * index }}
                    className="p-3 rounded-xl bg-card border border-primary/20 flex items-center gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color || "#3B82F6" }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{cat.name}</span>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className="text-[9px] uppercase tracking-wider px-1 bg-muted rounded text-muted-foreground">
                          {categoryGroups[cat.group_name as CategoryGroup]?.name || "Outros"}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider px-1 bg-muted rounded text-muted-foreground">
                          {cat.nature}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(cat)}
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-impulse" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Default Category Groups */}
        {groupOrder.map((groupKey, groupIndex) => {
          const group = categoryGroups[groupKey];
          const categories = groupedCategories[groupKey];

          if (categories.length === 0) return null;

          const GroupIcon = group.icon;

          return (
            <FadeIn key={groupKey} delay={0.03 * (groupIndex + 1)}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GroupIcon className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-serif text-lg font-semibold">{group.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category, index) => {
                    const Icon = category.icon;

                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 * index }}
                        className="p-3 rounded-xl bg-card border border-border flex items-center gap-3"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium truncate">{category.name}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>
          );
        })}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar categoria" : "Nova categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome</label>
              <Input
                placeholder="Ex: Assinatura, Streaming..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={30}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Grupo</label>
              <Select value={newGroup} onValueChange={(val) => setNewGroup(val as CategoryGroup)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryGroups).map(([key, group]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <group.icon className="w-4 h-4" />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Natureza</label>
              <Select value={newNature} onValueChange={(val) => setNewNature(val as CategoryNature)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {natureOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <Select value={newColor} onValueChange={setNewColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.value }} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="warm"
                className="flex-1"
                onClick={handleSave}
                disabled={!newName.trim() || createCategory.isPending || updateCategory.isPending}
              >
                {editingCategory ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir categoria"
        description="Essa categoria será removida. Registros que a utilizam não serão afetados."
      />

      <BottomNav />
    </div>
  );
}

import { notFound } from "next/navigation";

import {
  getProductById,
  getChoicePoolCategories,
  getActiveIngredients,
} from "@/lib/catalog/queries";
import { getChoiceGroupsForProduct } from "@/lib/choice-groups/queries";
import { getRecipeByProductId } from "@/lib/recipes/queries";
import { Button } from "@/components/ui/button";
import { RecipeDialog } from "@/components/admin/recipes/recipe-dialog";
import { RecipeItemDialog } from "@/components/admin/recipes/recipe-item-dialog";
import { RecipeItemsTable } from "@/components/admin/recipes/recipe-items-table";
import type { RecipeItemValues } from "@/components/admin/recipes/recipe-item-dialog";
import { ChoiceGroupDialog } from "@/components/admin/catalog/choice-group-dialog";
import { ChoiceGroupsTable } from "@/components/admin/catalog/choice-groups-table";
import type { ChoiceGroupValues } from "@/components/admin/catalog/choice-group-dialog";
import { PanelShell } from "@/components/admin/catalog/panel-shell";

export async function ProductRecipePanel({ productId }: { productId: string }) {
  const product = await getProductById(productId);
  if (!product) notFound();

  const [recipe, ingredients, groups, pools] = await Promise.all([
    getRecipeByProductId(productId),
    getActiveIngredients(),
    getChoiceGroupsForProduct(productId),
    getChoicePoolCategories(),
  ]);

  const choiceRows: ChoiceGroupValues[] = groups.map((g) => ({
    id: g.id,
    label: g.label,
    categoryId: g.category.id,
    categoryName: g.category.name,
    minSelect: g.minSelect,
    maxSelect: g.maxSelect,
    sortOrder: g.sortOrder,
  }));

  const optionCounts: Record<string, number> = {};
  for (const g of groups) optionCounts[g.id] = g.category._count.products;

  if (!recipe) {
    return (
      <PanelShell
        title={product.name}
        statusActive={product.isActive}
      >
        <div className="space-y-6">
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {product.isActive ? (
              <div className="flex flex-col items-center gap-4">
                <p>Produkt ešte nemá receptúru.</p>
                <RecipeDialog productId={product.id} productName={product.name} />
              </div>
            ) : (
              <p>Produkt je skrytý — najprv ho aktivuj, potom môžeš pridať receptúru.</p>
            )}
          </div>

          <ComboSection
            productId={product.id}
            pools={pools}
            rows={choiceRows}
            optionCounts={optionCounts}
          />
        </div>
      </PanelShell>
    );
  }

  const recipeRows: RecipeItemValues[] = recipe.items.map((it) => ({
    id: it.id,
    ingredientId: it.ingredient.id,
    ingredientName: it.ingredient.name,
    quantity: it.quantity.toString(),
    unit: it.unit,
    notes: it.notes ?? "",
  }));

  const recipeForm = {
    id: recipe.id,
    name: recipe.name ?? "",
    yield: recipe.yield,
    instructions: recipe.instructions ?? "",
    isActive: recipe.isActive,
  };

  return (
    <PanelShell
      title={product.name}
      statusActive={recipe.isActive}
      headerAction={
        <RecipeDialog
          recipe={recipeForm}
          productName={product.name}
          trigger={
            <Button type="button" variant="outline" size="sm">
              Upraviť receptúru
            </Button>
          }
        />
      }
    >
      <div className="space-y-6">
        {recipe.instructions ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-line">
            {recipe.instructions}
          </div>
        ) : null}

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium">Suroviny ({recipeRows.length})</h4>
            <RecipeItemDialog recipeId={recipe.id} ingredients={ingredients} />
          </div>
          <RecipeItemsTable
            recipeId={recipe.id}
            ingredients={ingredients}
            rows={recipeRows}
          />
        </div>

        <ComboSection
          productId={product.id}
          pools={pools}
          rows={choiceRows}
          optionCounts={optionCounts}
        />
      </div>
    </PanelShell>
  );
}

function ComboSection({
  productId,
  pools,
  rows,
  optionCounts,
}: {
  productId: string;
  pools: { id: string; name: string }[];
  rows: ChoiceGroupValues[];
  optionCounts: Record<string, number>;
}) {
  return (
    <div className="border-t pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium">Výber v kombe</h4>
          <p className="text-xs text-muted-foreground">
            Čo si zákazník zvolí pri pridaní do košíka.
          </p>
        </div>
        <ChoiceGroupDialog productId={productId} pools={pools} />
      </div>

      {pools.length === 0 && rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Označ kategóriu ako „Pool výberu“ v Kategóriách, potom tu pridaj výber.
        </div>
      ) : (
        <ChoiceGroupsTable
          productId={productId}
          pools={pools}
          rows={rows}
          optionCounts={optionCounts}
        />
      )}
    </div>
  );
}

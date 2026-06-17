"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDownUp } from "lucide-react";

import { recordProductWaste, recordStockMovement } from "@/lib/inventory/actions";
import { MANUAL_MOVEMENT_TYPES, MOVEMENT_LABEL } from "@/lib/inventory/schemas";
import { UNIT_LABEL } from "@/lib/catalog/schemas";
import type { UnitOfMeasure } from "@/generated/prisma/enums";
import { StockMovementType } from "@/generated/prisma/enums";
import type { IngredientOption } from "@/lib/catalog/queries";
import type { ProductWasteOption } from "@/lib/inventory/queries";
import type { FormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/admin/form-feedback";

export type SupplierOption = { id: string; name: string };

type WasteMode = "ingredient" | "product";

function formatQty(n: number) {
  return n.toLocaleString("sk-SK", { maximumFractionDigits: 3 });
}

export function MovementDialog({
  storeId,
  ingredients,
  suppliers,
  productsWithRecipes = [],
  defaultIngredientId,
  trigger,
}: {
  storeId: string;
  ingredients: IngredientOption[];
  suppliers: SupplierOption[];
  productsWithRecipes?: ProductWasteOption[];
  defaultIngredientId?: string;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<string>(StockMovementType.PURCHASE_IN);
  const [ingredientId, setIngredientId] = useState<string>(defaultIngredientId ?? "");
  const [wasteMode, setWasteMode] = useState<WasteMode>("ingredient");
  const [productId, setProductId] = useState<string>("");
  const [productQty, setProductQty] = useState("1");

  const isWaste = type === StockMovementType.WASTE;
  const isProductWaste = isWaste && wasteMode === "product";

  const selectedUnit = useMemo(() => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    return ing ? (UNIT_LABEL[ing.unit as UnitOfMeasure] ?? ing.unit) : "";
  }, [ingredientId, ingredients]);

  const selectedProduct = useMemo(
    () => productsWithRecipes.find((p) => p.productId === productId),
    [productId, productsWithRecipes],
  );

  const wastePreview = useMemo(() => {
    if (!selectedProduct) return [];
    const qty = Number(productQty);
    if (!Number.isFinite(qty) || qty <= 0) return [];
    return selectedProduct.ingredients.map((ing) => ({
      name: ing.name,
      quantity: Math.round(ing.quantityPerPortion * qty * 1000) / 1000,
      unit: UNIT_LABEL[ing.unit] ?? ing.unit,
    }));
  }, [selectedProduct, productQty]);

  function resetForm() {
    setState(undefined);
    setType(StockMovementType.PURCHASE_IN);
    setIngredientId(defaultIngredientId ?? "");
    setWasteMode("ingredient");
    setProductId("");
    setProductQty("1");
  }

  function onSubmit(formData: FormData) {
    const productWaste =
      formData.get("type") === StockMovementType.WASTE &&
      formData.get("wasteMode") === "product";
    startTransition(async () => {
      const result = productWaste
        ? await recordProductWaste(undefined, formData)
        : await recordStockMovement(undefined, formData);
      setState(result);
      if (result?.ok) {
        toast.success(
          productWaste
            ? "Odpis podľa produktu bol zaevidovaný."
            : "Pohyb skladu bol zaevidovaný.",
        );
        setOpen(false);
      }
    });
  }

  const isPurchase = type === StockMovementType.PURCHASE_IN;
  const isAdjustment = type === StockMovementType.ADJUSTMENT;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <ArrowDownUp className="size-4" />
            Pohyb skladu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pohyb skladu</DialogTitle>
          <DialogDescription>
            Príjem od dodávateľa, inventúrna korekcia alebo odpis. Pri odpise môžeš
            zadať surovinu, alebo produkt — suroviny sa odpočítajú podľa receptúry.
          </DialogDescription>
        </DialogHeader>
        <form key={String(open)} action={onSubmit} className="space-y-4">
          <input type="hidden" name="storeId" value={storeId} />
          <input type="hidden" name="wasteMode" value={wasteMode} />
          <FormMessage message={state?.message} />

          <div className="space-y-2">
            <Label htmlFor="type">Typ pohybu</Label>
            <Select name="type" value={type} onValueChange={setType}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {MOVEMENT_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state?.errors?.type} />
          </div>

          {isWaste ? (
            <Tabs
              value={wasteMode}
              onValueChange={(v) => setWasteMode(v as WasteMode)}
              className="gap-4"
            >
              <TabsList className="w-full">
                <TabsTrigger value="ingredient" className="flex-1">
                  Surovina
                </TabsTrigger>
                <TabsTrigger value="product" className="flex-1">
                  Produkt
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ingredient" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredientId">Surovina</Label>
                  <Select
                    name="ingredientId"
                    value={ingredientId}
                    onValueChange={setIngredientId}
                  >
                    <SelectTrigger id="ingredientId" className="w-full">
                      <SelectValue placeholder="Vyber surovinu" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError messages={state?.errors?.ingredientId} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Množstvo{selectedUnit ? ` (${selectedUnit})` : ""}
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.001"
                    min={0}
                    defaultValue={state?.values?.quantity}
                    required
                  />
                  <FieldError messages={state?.errors?.quantity} />
                </div>
              </TabsContent>

              <TabsContent value="product" className="space-y-4">
                {productsWithRecipes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    V menu predajne nie sú žiadne produkty s aktívnou receptúrou.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="productId">Produkt</Label>
                      <Select name="productId" value={productId} onValueChange={setProductId}>
                        <SelectTrigger id="productId" className="w-full">
                          <SelectValue placeholder="Vyber produkt" />
                        </SelectTrigger>
                        <SelectContent>
                          {productsWithRecipes.map((p) => (
                            <SelectItem key={p.productId} value={p.productId}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError messages={state?.errors?.productId} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productQuantity">Počet porcií / kusov</Label>
                      <Input
                        id="productQuantity"
                        name="quantity"
                        type="number"
                        step="1"
                        min={1}
                        value={productQty}
                        onChange={(e) => setProductQty(e.target.value)}
                        required
                      />
                      <FieldError messages={state?.errors?.quantity} />
                    </div>

                    {wastePreview.length > 0 && (
                      <div className="rounded-md border bg-muted/40 p-3 text-sm">
                        <p className="mb-2 font-medium">Odpočíta sa zo skladu:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {wastePreview.map((row) => (
                            <li key={row.name}>
                              {row.name} — {formatQty(row.quantity)} {row.unit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="ingredientId">Surovina</Label>
                <Select
                  name="ingredientId"
                  value={ingredientId}
                  onValueChange={setIngredientId}
                >
                  <SelectTrigger id="ingredientId" className="w-full">
                    <SelectValue placeholder="Vyber surovinu" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError messages={state?.errors?.ingredientId} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Množstvo{selectedUnit ? ` (${selectedUnit})` : ""}
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.001"
                    min={0}
                    defaultValue={state?.values?.quantity}
                    required
                  />
                  <FieldError messages={state?.errors?.quantity} />
                </div>
                {isAdjustment && (
                  <div className="space-y-2">
                    <Label htmlFor="direction">Smer korekcie</Label>
                    <Select name="direction" defaultValue={state?.values?.direction ?? "in"}>
                      <SelectTrigger id="direction" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Prírastok (+)</SelectItem>
                        <SelectItem value="out">Úbytok (−)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}

          {isPurchase && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unitCost">Jedn. cena (€)</Label>
                <Input
                  id="unitCost"
                  name="unitCost"
                  type="number"
                  step="0.0001"
                  min={0}
                  defaultValue={state?.values?.unitCost}
                />
                <FieldError messages={state?.errors?.unitCost} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Dodávateľ (voliteľné)</Label>
                <Select name="supplierId" defaultValue={state?.values?.supplierId ?? "none"}>
                  <SelectTrigger id="supplierId" className="w-full">
                    <SelectValue placeholder="Bez dodávateľa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— bez dodávateľa —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError messages={state?.errors?.supplierId} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reference">Doklad (voliteľné)</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="č. faktúry / dodacieho listu"
              defaultValue={state?.values?.reference}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Poznámka (voliteľné)</Label>
            <Textarea id="note" name="note" rows={2} defaultValue={state?.values?.note} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || (isProductWaste && productsWithRecipes.length === 0)}
            >
              {pending ? "Ukladám…" : "Zaevidovať"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Image from "next/image";
import { ImageIcon, Pencil } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import {
  RewardDialog,
  type LoyaltyProductOption,
  type RewardFormValues,
} from "@/components/admin/loyalty/reward-dialog";
import { deleteLoyaltyReward, toggleLoyaltyReward } from "@/lib/loyalty/actions";

export type RewardListItem = RewardFormValues & {
  productName: string;
  categoryName: string;
  imageUrl: string | null;
  productActive: boolean;
};

export function RewardsTable({
  rewards,
  products,
}: {
  rewards: RewardListItem[];
  products: LoyaltyProductOption[];
}) {
  const [pending, startTransition] = useTransition();

  function onToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleLoyaltyReward(id, isActive);
      if (res?.ok) {
        toast.success(isActive ? "Odmena je aktívna." : "Odmena je vypnutá.");
      } else {
        toast.error(res?.message ?? "Stav sa nepodarilo zmeniť.");
      }
    });
  }

  if (rewards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne odmeny. Pridaj produkt z katalógu a nastav cenu v bodoch.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead>Produkt</TableHead>
            <TableHead className="text-right">Body</TableHead>
            <TableHead className="text-right">Poradie</TableHead>
            <TableHead className="text-center">Aktívna</TableHead>
            <TableHead className="w-20 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rewards.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                  {r.imageUrl ? (
                    <Image
                      src={r.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-4" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{r.productName}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{r.categoryName}</span>
                  {!r.productActive && (
                    <Badge variant="outline" className="text-destructive">
                      Produkt neaktívny
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {r.pointsCost}
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.sortOrder}</TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={r.isActive}
                  disabled={pending}
                  onCheckedChange={(checked) => onToggle(r.id, checked)}
                  aria-label={`Aktívna: ${r.productName}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <RewardDialog
                    reward={r}
                    products={products}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                  <DeleteButton
                    id={r.id}
                    name={r.productName}
                    action={deleteLoyaltyReward}
                    description="Odmenu odstránime z vernostného programu."
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

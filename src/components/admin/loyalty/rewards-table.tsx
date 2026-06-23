"use client";

import Image from "next/image";
import Link from "next/link";
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
  /** Skupiny výberu na produkte-odmene (napr. veľkosť). 0 = košík nebude pýtať veľkosť. */
  choiceGroups: { label: string; poolName: string }[];
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
            <TableHead>Výber (veľkosť)</TableHead>
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
              <TableCell>
                {r.choiceGroups.length === 0 ? (
                  <div className="space-y-1 text-xs">
                    <Badge variant="outline" className="text-amber-700">
                      Bez výberu
                    </Badge>
                    <p className="text-muted-foreground">
                      Košík <strong>nepýta</strong> veľkosť. Nastav na{" "}
                      <Link
                        href={`/admin/katalog/produkty?panel=recipe&item=${r.productId}`}
                        className="underline"
                      >
                        produkte → Výber pri objednávke
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-0.5 text-xs">
                    {r.choiceGroups.map((g) => (
                      <li key={`${g.label}-${g.poolName}`}>
                        <span className="font-medium">{g.label}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          → pool „{g.poolName}"
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
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

"use client";

import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { removeMember } from "@/lib/team/actions";
import { ROLE_LABEL, ROLE_RANK, Role } from "@/lib/rbac";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import {
  MemberDialog,
  type MemberFormValues,
  type StoreOption,
} from "@/components/admin/team/member-dialog";

export type MemberListItem = MemberFormValues & {
  name: string | null;
  storeName: string | null;
  status: string;
  manageable: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktívny",
  INVITED: "Pozvaný",
  SUSPENDED: "Pozastavený",
};

export function MembersTable({
  members,
  stores,
}: {
  members: MemberListItem[];
  stores: StoreOption[];
}) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {stores.length === 0
          ? "Najprv vytvor aspoň jednu predajňu, potom môžeš priraďovať tím."
          : "Zatiaľ žiadni členovia. Priraď prvého pomocou tlačidla vpravo hore."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Člen</TableHead>
            <TableHead>Predajňa</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead className="w-20 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const role = m.role as Role;
            return (
              <TableRow key={m.membershipId}>
                <TableCell>
                  <div className="font-medium">{m.name ?? m.email}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.storeName ?? "— celá organizácia —"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={ROLE_RANK[role] >= ROLE_RANK[Role.ADMIN] ? "default" : "secondary"}
                  >
                    {ROLE_LABEL[role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {STATUS_LABEL[m.status] ?? m.status}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {m.manageable ? (
                      <>
                        <MemberDialog
                          member={m}
                          stores={stores}
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Pencil className="size-4" />
                              <span className="sr-only">Upraviť</span>
                            </Button>
                          }
                        />
                        <DeleteButton
                          id={m.membershipId}
                          name={m.name ?? m.email}
                          action={removeMember}
                          description="Členovi odoberieme prístup k tejto predajni."
                        />
                      </>
                    ) : (
                      <span className="pr-2 text-xs text-muted-foreground">spravuje superadmin</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { Pencil, UserPlus } from "lucide-react";

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
import { deleteOrganization, removeOrgAdmin } from "@/lib/orgs/actions";
import { DeleteButton } from "@/components/admin/catalog/delete-button";
import { OrgDialog, type OrgFormValues } from "@/components/admin/orgs/org-dialog";
import { AssignAdminDialog } from "@/components/admin/orgs/assign-admin-dialog";

export type OrgAdmin = { membershipId: string; email: string; name: string | null };

export type OrgListItem = OrgFormValues & {
  storeCount: number;
  memberCount: number;
  admins: OrgAdmin[];
};

export function OrgsTable({ organizations }: { organizations: OrgListItem[] }) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Zatiaľ žiadne organizácie. Vytvor prvú pomocou tlačidla vpravo hore.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organizácia</TableHead>
            <TableHead>Administrátori</TableHead>
            <TableHead className="text-right">Predajne</TableHead>
            <TableHead className="text-right">Členovia</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead className="w-28 text-right">Akcie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-muted-foreground">/{org.slug}</div>
              </TableCell>
              <TableCell>
                {org.admins.length === 0 ? (
                  <span className="text-sm text-muted-foreground">— žiadny —</span>
                ) : (
                  <ul className="space-y-1">
                    {org.admins.map((a) => (
                      <li key={a.membershipId} className="flex items-center gap-1.5 text-sm">
                        <span className="truncate">{a.name ?? a.email}</span>
                        <DeleteButton
                          id={a.membershipId}
                          name={a.name ?? a.email}
                          action={removeOrgAdmin}
                          description="Používateľovi odoberieme rolu ADMINa v tejto organizácii."
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{org.storeCount}</TableCell>
              <TableCell className="text-right tabular-nums">{org.memberCount}</TableCell>
              <TableCell>
                <Badge variant={org.isActive ? "default" : "secondary"}>
                  {org.isActive ? "Aktívna" : "Pozastavená"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <AssignAdminDialog
                    organizationId={org.id}
                    organizationName={org.name}
                    trigger={
                      <Button variant="ghost" size="icon-sm" title="Priradiť admina">
                        <UserPlus className="size-4" />
                        <span className="sr-only">Priradiť admina</span>
                      </Button>
                    }
                  />
                  <OrgDialog
                    organization={org}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                        <span className="sr-only">Upraviť</span>
                      </Button>
                    }
                  />
                  <DeleteButton
                    id={org.id}
                    name={org.name}
                    action={deleteOrganization}
                    description="Organizáciu natrvalo odstránime aj s členstvami."
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

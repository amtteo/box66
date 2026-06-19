"use client";

import { useActionState, useId } from "react";
import { CheckCircle2 } from "lucide-react";

import { submitSupplierInquiry } from "@/lib/suppliers/inquiry-action";
import type { FormState } from "@/lib/forms";
import { FieldError } from "@/components/auth/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SUPPLIER_INQUIRY_CATEGORIES } from "@/lib/suppliers/inquiry-schema";

export function SupplierInquiryForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitSupplierInquiry,
    undefined,
  );
  const id = useId();

  if (state?.ok) {
    return (
      <div className="flex items-start gap-3 bg-green-500 text-white p-6">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <p className="text-lg font-bold">{state.message}</p>
      </div>
    );
  }

  const v = (key: string) => state?.values?.[key] ?? "";

  return (
    <form action={action} className="space-y-6">
      {state?.message && !state.ok && (
        <p className="flex items-start gap-3 bg-red-100 p-6 text-lg font-bold">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-companyName`}>Názov firmy</Label>
          <Input
            id={`${id}-companyName`}
            name="companyName"
            defaultValue={v("companyName")}
            required
          />
          <FieldError messages={state?.errors?.companyName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-ico`}>IČO</Label>
          <Input id={`${id}-ico`} name="ico" defaultValue={v("ico")} required />
          <FieldError messages={state?.errors?.ico} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor={`${id}-contactName`}>Kontaktná osoba</Label>
          <Input
            id={`${id}-contactName`}
            name="contactName"
            autoComplete="name"
            defaultValue={v("contactName")}
            required
          />
          <FieldError messages={state?.errors?.contactName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-phone`}>Telefón</Label>
          <Input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={v("phone")}
            required
          />
          <FieldError messages={state?.errors?.phone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-email`}>E-mail</Label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v("email")}
            required
          />
          <FieldError messages={state?.errors?.email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-category`}>Kategória produktov / služieb</Label>
          <Select name="category" defaultValue={v("category") || undefined}>
            <SelectTrigger id={`${id}-category`} className="w-full">
              <SelectValue placeholder="Vyberte kategóriu" />
            </SelectTrigger>
            <SelectContent>
              {SUPPLIER_INQUIRY_CATEGORIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={state?.errors?.category} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-region`}>Región pôsobenia</Label>
          <Input
            id={`${id}-region`}
            name="region"
            placeholder="napr. Bratislavský kraj"
            defaultValue={v("region")}
            required
          />
          <FieldError messages={state?.errors?.region} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-description`}>
          Stručný popis vašej ponuky a v čom ste lepší ako konkurencia
        </Label>
        <Textarea
          id={`${id}-description`}
          name="description"
          rows={5}
          defaultValue={v("description")}
          required
        />
        <FieldError messages={state?.errors?.description} />
      </div>
      <div className="flex justify-end">
      <Button
        type="submit"
        disabled={pending}
        className="h-12 bg-yellow-400 px-8 font-bold text-primary hover:bg-yellow-500"
      >
        {pending ? "Odosielam…" : "Odoslať ponuku"}
      </Button>
      </div>
    </form>
  );
}

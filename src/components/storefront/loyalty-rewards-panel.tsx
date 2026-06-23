"use client";

import Image from "next/image";
import { Check, ImageIcon, Key, Loader2 } from "lucide-react";

import { CartSignInBanner } from "@/components/storefront/cart-sign-in-banner";
import { LOYALTY_MAX_GRID_ITEMS } from "@/lib/loyalty/constants";
import { cn } from "@/lib/utils";
import type { LoyaltyBalanceDTO, LoyaltyRewardDTO } from "@/lib/loyalty/types";

export function LoyaltyRewardsPanel({
  rewards,
  balance,
  pointsHeld,
  loading,
  isAuthed,
  rewardQuantity,
  onSignInSuccess,
  onSelectReward,
}: {
  rewards: LoyaltyRewardDTO[];
  balance: LoyaltyBalanceDTO | null;
  pointsHeld: number;
  loading: boolean;
  isAuthed: boolean;
  rewardQuantity: (rewardId: string) => number;
  onSignInSuccess: (customer: { name?: string; email: string }) => void;
  onSelectReward: (reward: LoyaltyRewardDTO) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Načítavam odmeny…</p>
      </div>
    );
  }

  const available = balance?.available ?? 0;

  const slots: (LoyaltyRewardDTO | null)[] = Array.from(
    { length: LOYALTY_MAX_GRID_ITEMS },
    (_, i) => rewards[i] ?? null,
  );

  return (
    <div className="space-y-6">
      {isAuthed ? (
        <PointsHeader balance={balance?.balance ?? 0} />
      ) : (
        <CartSignInBanner onSuccess={onSignInSuccess} />
      )}

      <ul className="grid grid-cols-3 gap-3">
        {slots.map((reward, index) =>
          reward ? (
            <RewardCard
              key={reward.id}
              reward={reward}
              inCart={rewardQuantity(reward.id) > 0}
              disabled={!isAuthed || available < reward.pointsCost}
              onSelect={() => onSelectReward(reward)}
            />
          ) : (
            <LockedRewardSlot key={`locked-${index}`} />
          ),
        )}
      </ul>

      {rewards.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Zatiaľ nie sú nastavené žiadne odmeny. Prázdne políčka sa odomknú, keď
          ich pridáš v admin-e.
        </p>
      )}
    </div>
  );
}

function PointsHeader({ balance }: { balance: number }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Počet bodov</p>
      <p className="text-4xl font-bold tabular-nums">{balance}</p>
    </div>
  );
}

export function LoyaltySelectedSummary({
  selectedCount,
  pointsHeld,
}: {
  selectedCount: number;
  pointsHeld: number;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Počet ks</p>
        <p className="text-lg font-bold tabular-nums">{selectedCount}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">Počet bodov</p>
        <p className="text-lg font-bold tabular-nums">{pointsHeld}</p>
      </div>
    </div>
  );
}

function LockedRewardSlot() {
  return (
    <li aria-hidden>
      <div className="flex h-full w-full flex-col border-2 border-primary bg-transparent">
        <div className="relative flex aspect-square w-full items-center justify-center">
          <Key className="size-16 text-primary" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="p-2" aria-hidden>
          <p className="invisible text-xs font-semibold leading-tight">.</p>
          <p className="invisible text-xs font-bold">.</p>
        </div>
      </div>
    </li>
  );
}

function RewardCard({
  reward,
  inCart,
  disabled,
  onSelect,
}: {
  reward: LoyaltyRewardDTO;
  inCart: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden border-2 border-primary bg-background text-left transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-yellow-50 active:bg-yellow-100",
        )}
      >
        {inCart && (
          <span className="absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-green-500 text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
        <div className="relative aspect-square w-full overflow-hidden border-b-2 border-primary">
          {reward.imageUrl ? (
            <Image
              src={reward.imageUrl}
              alt={reward.name}
              fill
              sizes="(max-width: 640px) 33vw, 120px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          <p className="line-clamp-2 text-xs font-semibold leading-tight">
            {reward.name}
          </p>
          <p className="mt-auto text-xs font-bold tabular-nums text-primary">
            {reward.pointsCost} b.
          </p>
        </div>
      </button>
    </li>
  );
}

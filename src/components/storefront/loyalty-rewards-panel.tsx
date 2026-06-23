"use client";

import Image from "next/image";
import { Check, Gift, ImageIcon, Loader2 } from "lucide-react";

import { CartSignInBanner } from "@/components/storefront/cart-sign-in-banner";
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

  return (
    <div className="space-y-6">
      {isAuthed ? (
        <PointsHeader balance={balance?.balance ?? 0} />
      ) : (
        <CartSignInBanner onSuccess={onSignInSuccess} />
      )}

      {rewards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Gift className="size-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Žiadne odmeny</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            V tejto predajni zatiaľ nie sú dostupné žiadne odmeny.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-3">
            {rewards.map((reward) => {
              const inCart = rewardQuantity(reward.id);
              const affordable =
                isAuthed && available >= reward.pointsCost;
              return (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  affordable={affordable}
                  inCart={inCart}
                  disabled={!isAuthed || !affordable}
                  onSelect={() => onSelectReward(reward)}
                />
              );
            })}
          </ul>
        </>
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

function RewardCard({
  reward,
  affordable,
  inCart,
  disabled,
  onSelect,
}: {
  reward: LoyaltyRewardDTO;
  affordable: boolean;
  inCart: number;
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
        {inCart > 0 && (
          <span className="absolute right-1 top-1 z-10 flex size-7 items-center justify-center rounded-full bg-green-400 text-white">
            {inCart > 1 ? (
              <span className="text-xs font-bold tabular-nums">
                {inCart}
              </span>
            ) : (
              <Check className="size-4" strokeWidth={3} />
            )}
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

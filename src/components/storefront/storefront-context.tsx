"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { calculateDeliveryFee, resolveDeliveryAddressCoords } from "@/lib/delivery/actions";
import { rankStoresByProximity, type RankedStore } from "@/lib/delivery/rank-stores";
import { pushDeliverySearchHistory } from "@/lib/delivery/search-history";
import { showDeliveryAddedToast } from "@/components/storefront/cart-added-toast";
import { fetchStoreMenu } from "@/lib/orders/storefront-actions";
import type { MenuCategoryDTO } from "@/lib/orders/types";
import type { PublicStoreOption } from "@/lib/delivery/queries";

const STORE_KEY = "box66_store_id";
const ADDRESS_KEY = "box66_delivery_address";
const ADDRESS_CONFIRMED_KEY = "box66_delivery_address_confirmed";
const DELIVERY_LAT_KEY = "box66_delivery_lat";
const DELIVERY_LNG_KEY = "box66_delivery_lng";
const FULFILLMENT_MODE_KEY = "box66_fulfillment_mode";

export type FulfillmentMode = "delivery" | "pickup";

type FeeQuote = {
  distanceKm: number;
  durationMinutes: number;
  fee: number;
  currency: string;
};

export type DeliveryState = {
  address: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  fee: number | null;
  error: string | null;
  pending: boolean;
  /** True po výbere adresy z Google — vtedy sme žiadali cenu donášky. */
  quoteAttempted: boolean;
};

type StorefrontContextValue = {
  stores: PublicStoreOption[];
  /** Top 3 predajne podľa vzdušnej vzdialenosti (po výbere adresy). */
  nearbyStores: RankedStore[];
  storeId: string;
  currency: string;
  categories: MenuCategoryDTO[];
  menuLoading: boolean;
  setStoreId: (id: string) => void;
  delivery: DeliveryState;
  setDeliveryAddress: (address: string) => void;
  /** Vymaže adresu, cenu donášky, predajne v okolí a localStorage. */
  resetDelivery: () => void;
  onDeliveryPlaceSelected: (place: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  /** Vyberie adresu z histórie a spustí výpočet donášky. */
  pickDeliveryAddress: (
    address: string,
    coords?: { lat: number; lng: number },
  ) => Promise<void>;
  refreshDeliveryFee: () => void;
  fulfillmentMode: FulfillmentMode;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readDeliveryCoords(): { lat: number; lng: number } | null {
  const lat = Number(readStorage(DELIVERY_LAT_KEY));
  const lng = Number(readStorage(DELIVERY_LNG_KEY));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function StorefrontProvider({
  stores,
  initialStoreId,
  initialCategories,
  initialCurrency,
  children,
}: {
  stores: PublicStoreOption[];
  initialStoreId: string;
  initialCategories: MenuCategoryDTO[];
  initialCurrency: string;
  children: React.ReactNode;
}) {
  const [storeId, setStoreIdState] = useState(initialStoreId);
  const [currency, setCurrency] = useState(initialCurrency);
  const [categories, setCategories] = useState(initialCategories);
  const [menuLoading, setMenuLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddressState] = useState("");
  const [nearbyStores, setNearbyStores] = useState<RankedStore[]>([]);
  const [fulfillmentMode, setFulfillmentModeState] =
    useState<FulfillmentMode>("delivery");
  const [delivery, setDelivery] = useState<DeliveryState>({
    address: "",
    distanceKm: null,
    durationMinutes: null,
    fee: null,
    error: null,
    pending: false,
    quoteAttempted: false,
  });
  const [menuPending, startMenuTransition] = useTransition();
  const [feePending, startFeeTransition] = useTransition();

  const feeCacheRef = useRef(new Map<string, FeeQuote>());
  const feeAddressRef = useRef("");

  const clearFeeCache = useCallback(() => {
    feeCacheRef.current.clear();
    feeAddressRef.current = "";
  }, []);

  const loadStoreMenu = useCallback((id: string) => {
    startMenuTransition(async () => {
      setMenuLoading(true);
      const data = await fetchStoreMenu(id);
      if (data) {
        setCategories(data.categories);
        setCurrency(data.currency);
      }
      setMenuLoading(false);
    });
  }, []);

  const applyFeeQuote = useCallback(
    (address: string, quote: FeeQuote, attempted: boolean) => {
      setDelivery({
        address,
        distanceKm: quote.distanceKm,
        durationMinutes: quote.durationMinutes,
        fee: quote.fee,
        error: null,
        pending: false,
        quoteAttempted: attempted,
      });
      setCurrency(quote.currency);
    },
    [],
  );

  const runFeeCalculation = useCallback(
    (
      address: string,
      activeStoreId: string,
      options?: { notify?: boolean },
    ) => {
      const notify = options?.notify ?? true;

      if (!address.trim()) {
        clearFeeCache();
        setDelivery({
          address: "",
          distanceKm: null,
          durationMinutes: null,
          fee: null,
          error: null,
          pending: false,
          quoteAttempted: false,
        });
        return;
      }

      if (feeAddressRef.current !== address) {
        feeCacheRef.current.clear();
        feeAddressRef.current = address;
      }

      const cached = feeCacheRef.current.get(activeStoreId);
      if (cached) {
        applyFeeQuote(address, cached, true);
        return;
      }

      startFeeTransition(async () => {
        setDelivery((d) => ({
          ...d,
          address,
          pending: true,
          error: null,
          quoteAttempted: true,
        }));
        const res = await calculateDeliveryFee({
          storeId: activeStoreId,
          deliveryAddress: address,
        });
        if (res.ok) {
          const quote: FeeQuote = {
            distanceKm: res.distanceKm,
            durationMinutes: res.durationMinutes,
            fee: res.fee,
            currency: res.currency,
          };
          feeCacheRef.current.set(activeStoreId, quote);
          applyFeeQuote(address, quote, true);
          writeStorage(ADDRESS_CONFIRMED_KEY, "1");
          if (notify) {
            showDeliveryAddedToast(
              quote.fee,
              quote.currency,
              quote.durationMinutes,
            );
          }
        } else {
          setDelivery({
            address,
            distanceKm: null,
            durationMinutes: null,
            fee: null,
            error: res.message,
            pending: false,
            quoteAttempted: true,
          });
        }
      });
    },
    [applyFeeQuote, clearFeeCache],
  );

  const switchStore = useCallback(
    (id: string, options?: { reloadMenu?: boolean }) => {
      setStoreIdState(id);
      writeStorage(STORE_KEY, id);
      if (options?.reloadMenu !== false) {
        loadStoreMenu(id);
      }
    },
    [loadStoreMenu],
  );

  // Obnov uloženú predajňu a adresu po hydratácii.
  useEffect(() => {
    let activeStoreId = initialStoreId;
    const savedStore = readStorage(STORE_KEY);
    if (savedStore && stores.some((s) => s.id === savedStore)) {
      activeStoreId = savedStore;
      if (savedStore !== initialStoreId) {
        switchStore(savedStore);
      }
    }

    const savedMode = readStorage(FULFILLMENT_MODE_KEY);
    if (savedMode === "delivery" || savedMode === "pickup") {
      setFulfillmentModeState(savedMode);
    }

    const savedAddress = readStorage(ADDRESS_KEY);
    const wasConfirmed = readStorage(ADDRESS_CONFIRMED_KEY) === "1";
    const coords = readDeliveryCoords();

    if (coords) {
      setNearbyStores(rankStoresByProximity(stores, coords.lat, coords.lng, 3));
    }

    if (savedAddress) {
      setDeliveryAddressState(savedAddress);
      setDelivery((d) => ({
        ...d,
        address: savedAddress,
        quoteAttempted: wasConfirmed,
      }));
      if (wasConfirmed && savedMode !== "pickup") {
        feeAddressRef.current = savedAddress;
        runFeeCalculation(savedAddress, activeStoreId, { notify: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jednorazová hydratácia
  }, []);

  const setStoreId = useCallback(
    (id: string) => {
      if (id === storeId) return;
      switchStore(id);
      if (deliveryAddress.trim() && readStorage(ADDRESS_CONFIRMED_KEY) === "1") {
        if (readStorage(FULFILLMENT_MODE_KEY) !== "pickup") {
          runFeeCalculation(deliveryAddress, id);
        }
      }
    },
    [storeId, deliveryAddress, switchStore, runFeeCalculation],
  );

  const resetDelivery = useCallback(() => {
    setDeliveryAddressState("");
    writeStorage(ADDRESS_KEY, "");
    removeStorage(ADDRESS_CONFIRMED_KEY);
    removeStorage(DELIVERY_LAT_KEY);
    removeStorage(DELIVERY_LNG_KEY);
    setNearbyStores([]);
    clearFeeCache();
    setDelivery({
      address: "",
      distanceKm: null,
      durationMinutes: null,
      fee: null,
      error: null,
      pending: false,
      quoteAttempted: false,
    });
  }, [clearFeeCache]);

  const setDeliveryAddress = useCallback(
    (address: string) => {
      if (!address.trim()) {
        resetDelivery();
        return;
      }
      setDeliveryAddressState(address);
      writeStorage(ADDRESS_KEY, address);
      if (readStorage(ADDRESS_CONFIRMED_KEY) === "1") {
        removeStorage(ADDRESS_CONFIRMED_KEY);
      }
      removeStorage(DELIVERY_LAT_KEY);
      removeStorage(DELIVERY_LNG_KEY);
      setNearbyStores([]);
      clearFeeCache();
      setDelivery((d) => ({
        ...d,
        address,
        error: null,
        fee: null,
        distanceKm: null,
        durationMinutes: null,
        quoteAttempted: false,
        pending: false,
      }));
    },
    [clearFeeCache, resetDelivery],
  );

  const applyPickupLocation = useCallback(
    (place: { address: string; lat: number; lng: number }) => {
      setDeliveryAddressState(place.address);
      writeStorage(ADDRESS_KEY, place.address);
      writeStorage(DELIVERY_LAT_KEY, String(place.lat));
      writeStorage(DELIVERY_LNG_KEY, String(place.lng));

      const ranked = rankStoresByProximity(stores, place.lat, place.lng, 3);
      setNearbyStores(ranked);

      clearFeeCache();
      const bestStoreId = ranked[0]?.id ?? storeId;
      if (bestStoreId !== storeId) {
        switchStore(bestStoreId);
      }

      setDelivery({
        address: place.address,
        distanceKm: null,
        durationMinutes: null,
        fee: null,
        error: null,
        pending: false,
        quoteAttempted: true,
      });
      writeStorage(ADDRESS_CONFIRMED_KEY, "1");
    },
    [stores, storeId, switchStore, clearFeeCache],
  );

  const applyDeliverySelection = useCallback(
    (place: { address: string; lat: number; lng: number }) => {
      setDeliveryAddressState(place.address);
      writeStorage(ADDRESS_KEY, place.address);
      writeStorage(DELIVERY_LAT_KEY, String(place.lat));
      writeStorage(DELIVERY_LNG_KEY, String(place.lng));

      const ranked = rankStoresByProximity(stores, place.lat, place.lng, 3);
      setNearbyStores(ranked);

      clearFeeCache();
      const bestStoreId = ranked[0]?.id ?? storeId;
      if (bestStoreId !== storeId) {
        switchStore(bestStoreId);
      }
      runFeeCalculation(place.address, bestStoreId);
    },
    [stores, storeId, switchStore, clearFeeCache, runFeeCalculation],
  );

  const onDeliveryPlaceSelected = useCallback(
    (place: { address: string; lat: number; lng: number }) => {
      pushDeliverySearchHistory(place);
      if (fulfillmentMode === "pickup") {
        applyPickupLocation(place);
      } else {
        applyDeliverySelection(place);
      }
    },
    [fulfillmentMode, applyPickupLocation, applyDeliverySelection],
  );

  const pickDeliveryAddress = useCallback(
    async (
      address: string,
      coords?: { lat: number; lng: number },
    ) => {
      const trimmed = address.trim();
      if (!trimmed) return;

      let lat = coords?.lat;
      let lng = coords?.lng;

      if (fulfillmentMode === "pickup") {
        if (lat != null && lng != null) {
          applyPickupLocation({ address: trimmed, lat, lng });
        } else {
          setDeliveryAddressState(trimmed);
          writeStorage(ADDRESS_KEY, trimmed);
          writeStorage(ADDRESS_CONFIRMED_KEY, "1");
          setDelivery((d) => ({
            ...d,
            address: trimmed,
            fee: null,
            distanceKm: null,
            durationMinutes: null,
            error: null,
            pending: false,
            quoteAttempted: true,
          }));
        }
        return;
      }

      if (lat == null || lng == null) {
        const geo = await resolveDeliveryAddressCoords(trimmed);
        if (!geo.ok) {
          setDeliveryAddressState(trimmed);
          writeStorage(ADDRESS_KEY, trimmed);
          removeStorage(DELIVERY_LAT_KEY);
          removeStorage(DELIVERY_LNG_KEY);
          setNearbyStores([]);
          clearFeeCache();
          runFeeCalculation(trimmed, storeId);
          return;
        }
        lat = geo.lat;
        lng = geo.lng;
      }

      applyDeliverySelection({ address: trimmed, lat, lng });
    },
    [
      storeId,
      fulfillmentMode,
      applyPickupLocation,
      applyDeliverySelection,
      clearFeeCache,
      runFeeCalculation,
    ],
  );

  const setFulfillmentMode = useCallback(
    (mode: FulfillmentMode) => {
      setFulfillmentModeState(mode);
      writeStorage(FULFILLMENT_MODE_KEY, mode);

      if (mode === "pickup") {
        clearFeeCache();
        setDelivery((d) => ({
          ...d,
          fee: null,
          distanceKm: null,
          durationMinutes: null,
          error: null,
          pending: false,
        }));
        return;
      }

      if (
        deliveryAddress.trim() &&
        readStorage(ADDRESS_CONFIRMED_KEY) === "1"
      ) {
        runFeeCalculation(deliveryAddress, storeId);
      }
    },
    [deliveryAddress, storeId, clearFeeCache, runFeeCalculation],
  );

  const refreshDeliveryFee = useCallback(() => {
    if (
      deliveryAddress.trim() &&
      readStorage(ADDRESS_CONFIRMED_KEY) === "1"
    ) {
      runFeeCalculation(deliveryAddress, storeId);
    }
  }, [deliveryAddress, storeId, runFeeCalculation]);

  const value = useMemo<StorefrontContextValue>(
    () => ({
      stores,
      nearbyStores,
      storeId,
      currency,
      categories,
      menuLoading: menuLoading || menuPending,
      setStoreId,
      delivery: {
        ...delivery,
        pending: delivery.pending || feePending,
      },
      setDeliveryAddress,
      resetDelivery,
      onDeliveryPlaceSelected,
      pickDeliveryAddress,
      refreshDeliveryFee,
      fulfillmentMode,
      setFulfillmentMode,
    }),
    [
      stores,
      nearbyStores,
      storeId,
      currency,
      categories,
      menuLoading,
      menuPending,
      setStoreId,
      delivery,
      feePending,
      setDeliveryAddress,
      resetDelivery,
      onDeliveryPlaceSelected,
      pickDeliveryAddress,
      refreshDeliveryFee,
      fulfillmentMode,
      setFulfillmentMode,
    ],
  );

  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) {
    throw new Error("useStorefront musí byť použité vnútri <StorefrontProvider>.");
  }
  return ctx;
}

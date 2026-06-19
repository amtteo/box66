export {};

declare global {
  namespace google.maps {
    function importLibrary(library: "places"): Promise<PlacesLibrary>;

    interface PlacesLibrary {
      PlaceAutocompleteElement: typeof places.PlaceAutocompleteElement;
      Place: typeof places.Place;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    namespace places {
      interface PlaceAutocompleteElementOptions {
        includedRegionCodes?: string[];
        includedPrimaryTypes?: string[];
        placeholder?: string;
        noClearButton?: boolean;
        noInputIcon?: boolean;
      }

      class PlaceAutocompleteElement extends HTMLElement {
        constructor(options?: PlaceAutocompleteElementOptions);
        placeholder: string;
        includedRegionCodes: string[];
        disabled: boolean;
        value: string;
        addEventListener(
          type: "gmp-select",
          listener: (ev: PlacePredictionSelectEvent) => void,
        ): void;
        addEventListener(
          type: "input",
          listener: (ev: Event) => void,
        ): void;
      }

      interface PlacePredictionSelectEvent extends Event {
        placePrediction: PlacePrediction;
      }

      interface PlacePrediction {
        toPlace(): Place;
      }

      class Place {
        formattedAddress?: string;
        location?: LatLng | LatLngLiteral | null;
        fetchFields(options: { fields: string[] }): Promise<void>;
      }
    }
  }

  // eslint-disable-next-line no-var
  var google: {
    maps: typeof google.maps;
  };

  interface Window {
    google?: typeof google;
    __box66GoogleMapsBootstrapped?: boolean;
  }
}

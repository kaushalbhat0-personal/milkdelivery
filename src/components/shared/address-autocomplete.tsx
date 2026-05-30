"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type InputHTMLAttributes,
} from "react"
import { Loader2, MapPin, Search, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type AddressResult = {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

type AddressAutocompleteProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (result: AddressResult | null) => void;
  onInputChange?: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
};

type Prediction = {
  placeId: string;
  description: string;
};

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMapsCallback?: () => void;
  }
}

function useGoogleMapsScript() {
  const [state, setState] = useState<"loading" | "ready" | "error">(
    API_KEY ? "loading" : "error"
  );

  useEffect(() => {
    if (!API_KEY) {
      return;
    }
    if (window.google?.maps?.places) {
      setState("ready");
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existing) {
      const checkReady = () => {
        if (window.google?.maps?.places) {
          setState("ready");
        } else {
          setTimeout(checkReady, 200);
        }
      };
      checkReady();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;

    window.initGoogleMapsCallback = () => {
      setState("ready");
    };

    script.onerror = () => {
      setState("error");
    };

    document.head.appendChild(script);

    return () => {
      delete window.initGoogleMapsCallback;
    };
  }, []);

  return state;
}

export function AddressAutocomplete({
  value,
  onChange,
  onInputChange,
  label,
  error,
  placeholder = "Search for an address...",
  className,
  id,
  ...inputProps
}: AddressAutocompleteProps) {
  const mapsState = useGoogleMapsScript();
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const hasValue = value.length > 0;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (mapsState !== "ready") return;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [mapsState]);

  useEffect(() => {
    if (!mapsState || !inputValue || selectedPlaceId) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!autocompleteServiceRef.current) return;
      setIsSearching(true);
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: inputValue,
          types: ["address"],
          componentRestrictions: { country: "in" },
        },
        (results, status) => {
          setIsSearching(false);
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPredictions(
              results.map((p) => ({
                placeId: p.place_id,
                description: p.description,
              }))
            );
            setIsOpen(true);
            setHighlightedIndex(-1);
          } else {
            setPredictions([]);
            setIsOpen(false);
          }
        }
      );
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, mapsState, selectedPlaceId]);

  const selectPlace = useCallback(
    (placeId: string) => {
      setSelectedPlaceId(placeId);
      setIsOpen(false);
      setIsSearching(true);

      const dummyElement = document.createElement("div");
      const placesService = new google.maps.places.PlacesService(dummyElement);

      placesService.getDetails(
        {
          placeId,
          fields: ["place_id", "formatted_address", "geometry"],
        },
        (place, status) => {
          setIsSearching(false);
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            const address = place.formatted_address ?? "";
            setInputValue(address);
            setPredictions([]);
            onChange({
              placeId: place.place_id ?? placeId,
              formattedAddress: address,
              latitude: place.geometry?.location?.lat() ?? 0,
              longitude: place.geometry?.location?.lng() ?? 0,
            });
          }
        }
      );
    },
    [onChange]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    setSelectedPlaceId(null);
    onInputChange?.(val);
    if (!val) {
      onChange(null);
      setPredictions([]);
      setIsOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < predictions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : predictions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectPlace(predictions[highlightedIndex].placeId);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputId = id ?? "address-autocomplete";

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={
            mapsState === "loading"
              ? "Loading Google Maps..."
              : mapsState === "error" && !API_KEY
                ? "Google Maps API key not configured"
                : placeholder
          }
          disabled={mapsState === "loading" || inputProps.disabled}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-transparent pl-8 pr-8 py-2 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            className
          )}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? `${inputId}-listbox` : undefined}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${inputId}-option-${highlightedIndex}`
              : undefined
          }
          {...inputProps}
        />
        {isSearching && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {hasValue && selectedPlaceId && !isSearching && (
          <MapPin className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-green-600" />
        )}
      </div>

      {mapsState === "error" && (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />
          {API_KEY
            ? "Failed to load Google Maps. Check your API key."
            : "Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."}
        </p>
      )}

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}

      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          id={`${inputId}-listbox`}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md",
            "max-h-60 overflow-y-auto"
          )}
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.placeId}
              id={`${inputId}-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                highlightedIndex === index && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectPlace(prediction.placeId);
              }}
            >
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{prediction.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

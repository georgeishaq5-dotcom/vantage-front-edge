/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Ruler, Satellite, Trash2, MapPin, Search, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadGoogleMaps, isMapsConfigured } from "@/lib/google-maps";

export type MeasureMode = "area" | "linear";

export interface MeasureResult {
  mode: MeasureMode;
  /** Square footage (area) or linear footage (perimeter). */
  feet: number;
}

const SQM_TO_SQFT = 10.7639;
const M_TO_FT = 3.28084;

interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

export function SatelliteMeasure({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (result: MeasureResult) => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polyRef = useRef<google.maps.Polygon | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const pathRef = useRef<google.maps.LatLng[]>([]);

  // Address autocomplete
  const placesLibRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [mode, setMode] = useState<MeasureMode>("area");
  const [feet, setFeet] = useState(0);
  const [pricePerSqFt, setPricePerSqFt] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectedTotal = (Number(pricePerSqFt) || 0) * feet;

  const recompute = () => {
    const path = pathRef.current;
    if (mode === "area") {
      if (path.length >= 3) {
        const sqm = google.maps.geometry.spherical.computeArea(path);
        setFeet(Math.round(sqm * SQM_TO_SQFT));
      } else {
        setFeet(0);
      }
    } else {
      if (path.length >= 2) {
        const m = google.maps.geometry.spherical.computeLength(path);
        setFeet(Math.round(m * M_TO_FT));
      } else {
        setFeet(0);
      }
    }
  };

  const redraw = () => {
    const path = pathRef.current;
    if (mode === "area") {
      lineRef.current?.setMap(null);
      if (!polyRef.current) {
        polyRef.current = new google.maps.Polygon({
          map: mapRef.current!,
          strokeColor: "#16a34a",
          strokeWeight: 2,
          fillColor: "#16a34a",
          fillOpacity: 0.25,
        });
      } else {
        polyRef.current.setMap(mapRef.current!);
      }
      polyRef.current.setPath(path);
    } else {
      polyRef.current?.setMap(null);
      if (!lineRef.current) {
        lineRef.current = new google.maps.Polyline({
          map: mapRef.current!,
          strokeColor: "#16a34a",
          strokeWeight: 3,
        });
      } else {
        lineRef.current.setMap(mapRef.current!);
      }
      lineRef.current.setPath(path);
    }
    recompute();
  };

  const clearAll = () => {
    pathRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polyRef.current?.setPath([]);
    lineRef.current?.setPath([]);
    setFeet(0);
  };

  function fetchSuggestions(input: string) {
    const lib = placesLibRef.current;
    if (!lib || !input.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: sessionTokenRef.current,
    })
      .then(({ suggestions: results }: any) => {
        const mapped: Suggestion[] = (results ?? [])
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            placeId: s.placePrediction.placeId,
            primary: s.placePrediction.mainText?.text ?? s.placePrediction.text?.text ?? "",
            secondary: s.placePrediction.secondaryText?.text ?? "",
          }));
        setSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setSearching(false));
  }

  function handleQuery(next: string) {
    setQuery(next);
    if (!ready) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(next), 220);
  }

  async function selectSuggestion(s: Suggestion) {
    const lib = placesLibRef.current;
    setQuery([s.primary, s.secondary].filter(Boolean).join(", "));
    setShowSuggestions(false);
    setSuggestions([]);
    try {
      if (lib && mapRef.current) {
        const place = new lib.Place({ id: s.placeId });
        await place.fetchFields({ fields: ["location"] });
        if (place.location) {
          mapRef.current.setCenter(place.location);
          mapRef.current.setZoom(20);
        }
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
      }
    } catch {
      /* keep current view */
    }
  }

  // Init map when dialog opens
  useEffect(() => {
    if (!open || !isMapsConfigured()) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(async (g) => {
        if (cancelled || !mapEl.current) return;
        const map = new g.maps.Map(mapEl.current, {
          center: { lat: 39.7684, lng: -86.1581 },
          zoom: 19,
          mapTypeId: "satellite",
          tilt: 0,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          pathRef.current = [...pathRef.current, e.latLng];
          const marker = new g.maps.Marker({
            position: e.latLng,
            map,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 1.5,
            },
          });
          markersRef.current.push(marker);
          redraw();
        });
        try {
          const lib = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary;
          placesLibRef.current = lib;
          sessionTokenRef.current = new lib.AutocompleteSessionToken();
        } catch {
          /* autocomplete unavailable */
        }
        setReady(true);
      })
      .catch(() => setError("Unable to load the satellite map."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Redraw when switching modes
  useEffect(() => {
    if (ready) redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-revenue" />
            Satellite Auto-Measure
          </DialogTitle>
          <DialogDescription>
            Search an address, then click points on the property to outline the work area. We&apos;ll
            calculate the footage automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Address search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            autoComplete="off"
            placeholder="Search an address to center the map…"
            className="pl-9"
            disabled={!isMapsConfigured()}
            onChange={(e) => handleQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1.5 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/60"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-revenue" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.primary}</span>
                      {s.secondary && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {s.secondary}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              onClick={() => setMode("area")}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (mode === "area"
                  ? "bg-revenue text-revenue-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              Area (sq ft)
            </button>
            <button
              onClick={() => setMode("linear")}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (mode === "linear"
                  ? "bg-revenue text-revenue-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              Linear (ft)
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold">
            <Ruler className="h-4 w-4 text-revenue" />
            {feet.toLocaleString()} {mode === "area" ? "sq ft" : "ft"}
          </div>
        </div>

        {/* Price per sq ft + projected total */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-secondary/40 p-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Price Per {mode === "area" ? "Sq Ft" : "Ft"} ($)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={pricePerSqFt}
                onChange={(e) => setPricePerSqFt(e.target.value)}
                placeholder="0.00"
                className="w-32 pl-7"
              />
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-medium text-muted-foreground">Projected Total</p>
            <p className="text-2xl font-bold text-revenue">
              ${projectedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {isMapsConfigured() ? (
          <div
            ref={mapEl}
            className="h-[340px] w-full overflow-hidden rounded-lg border border-border bg-muted"
          />
        ) : (
          <div className="flex h-[340px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted text-center text-sm text-muted-foreground">
            <MapPin className="h-8 w-8" />
            Satellite measurement requires the Google Maps connector.
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="revenue"
            disabled={feet <= 0}
            onClick={() => {
              onApply({ mode, feet });
              onOpenChange(false);
            }}
          >
            Apply to Estimate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Ruler, Satellite, Trash2, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loadGoogleMaps, isMapsConfigured } from "@/lib/google-maps";

export type MeasureMode = "area" | "linear";

export interface MeasureResult {
  mode: MeasureMode;
  /** Square footage (area) or linear footage (perimeter). */
  feet: number;
}

const SQM_TO_SQFT = 10.7639;
const M_TO_FT = 3.28084;

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

  const [mode, setMode] = useState<MeasureMode>("area");
  const [feet, setFeet] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Init map when dialog opens
  useEffect(() => {
    if (!open || !isMapsConfigured()) return;
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
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
            Click points on the property to outline the work area. We&apos;ll calculate the footage
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
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

        {isMapsConfigured() ? (
          <div
            ref={mapEl}
            className="h-[380px] w-full overflow-hidden rounded-lg border border-border bg-muted"
          />
        ) : (
          <div className="flex h-[380px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted text-center text-sm text-muted-foreground">
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

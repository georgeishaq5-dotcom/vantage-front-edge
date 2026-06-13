import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isMapsConfigured, loadGoogleMaps } from "@/lib/google-maps";

interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Start typing an address…",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);
  const sessionTokenRef = useRef<any>(null);
  const placesLibRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const configured = isMapsConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(async (g) => {
        const lib = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary;
        if (cancelled) return;
        placesLibRef.current = lib;
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
    };
  }, [configured]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function fetchSuggestions(input: string) {
    const lib = placesLibRef.current;
    if (!lib || !input.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
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
        setActive(0);
        setOpen(mapped.length > 0);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }

  function handleInput(next: string) {
    onChange(next);
    if (!ready) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(next), 220);
  }

  async function select(s: Suggestion) {
    const lib = placesLibRef.current;
    let formatted = [s.primary, s.secondary].filter(Boolean).join(", ");
    try {
      if (lib) {
        const place = new lib.Place({ id: s.placeId });
        await place.fetchFields({ fields: ["formattedAddress"] });
        if (place.formattedAddress) formatted = place.formattedAddress;
        // refresh the session token after a completed selection
        sessionTokenRef.current = new lib.AutocompleteSessionToken();
      }
    } catch {
      /* keep the prediction text */
    }
    onChange(formatted);
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={value}
          autoComplete="off"
          placeholder={configured ? placeholder : "123 Main St, City, State"}
          className="pl-9"
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => select(s)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary/60",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-revenue" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.primary}</span>
                  {s.secondary && (
                    <span className="block truncate text-xs text-muted-foreground">{s.secondary}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

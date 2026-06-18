import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { FileDown, Loader2, MapPin, Megaphone, Send, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchCustomers, fetchMyProfile, type Customer, type JobWithCustomer } from "@/lib/fsm";
import { loadGoogleMaps, isMapsConfigured } from "@/lib/google-maps";
import { findNeighbors, blastNeighbors } from "@/lib/radius.functions";

const RADIUS_METERS = 5 * 1609.34;

type NeighborMatch = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  distanceMiles: number;
};

function cityFromAddress(address: string | null | undefined): string {
  if (!address) return "your area";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0] || "your area";
}

export function RadiusMarketing({
  job,
  customer,
}: {
  job: JobWithCustomer;
  customer: Customer | null;
}) {
  const { data: profile } = useQuery({ queryKey: ["my_profile"], queryFn: fetchMyProfile });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const company = profile?.company_name?.trim() || "Vantage";
  const city = cityFromAddress(customer?.service_address);
  const jobAddress = customer?.service_address ?? null;

  const [generating, setGenerating] = useState(false);

  async function generateFlyer() {
    setGenerating(true);
    try {
      const leadUrl = `${window.location.origin}/?lead=1`;
      const qr = await QRCode.toDataURL(leadUrl, { margin: 1, width: 600 });

      const doc = new jsPDF({ unit: "in", format: "letter" });
      const pageW = 8.5;
      const half = pageW / 2;

      // Brand palette pulled from the Vantage logo.
      const BLUE: [number, number, number] = [30, 79, 255];
      const GREEN: [number, number, number] = [16, 185, 129];
      const INK: [number, number, number] = [17, 24, 39];

      // Cut/divider line between the two vertical door hangers.
      doc.setDrawColor(190);
      doc.setLineDashPattern([0.08, 0.08], 0);
      doc.line(half, 0, half, 11);
      doc.setLineDashPattern([], 0);

      const drawHanger = (offsetX: number) => {
        const pad = 0.28;
        const x = offsetX + pad;
        const w = half - pad * 2;
        const cx = offsetX + half / 2;

        // Outer card with rounded corners.
        doc.setDrawColor(225);
        doc.setLineWidth(0.012);
        doc.roundedRect(x, 0.3, w, 10.4, 0.18, 0.18, "S");

        // ---- Door-knob cutout ----
        doc.setFillColor(245, 246, 248);
        doc.setDrawColor(205);
        doc.circle(cx, 1.0, 0.42, "FD");
        doc.setFillColor(255, 255, 255);
        doc.circle(cx, 1.0, 0.32, "F");
        // Slot connecting the hole to the top edge.
        doc.setFillColor(245, 246, 248);
        doc.roundedRect(cx - 0.09, 0.42, 0.18, 0.5, 0.09, 0.09, "F");
        doc.setDrawColor(205);
        doc.line(cx - 0.09, 0.42, cx - 0.09, 0.7);
        doc.line(cx + 0.09, 0.42, cx + 0.09, 0.7);

        // ---- Blue header block ----
        const headTop = 1.7;
        const headH = 2.5;
        doc.setFillColor(...BLUE);
        doc.roundedRect(x, headTop, w, headH, 0.14, 0.14, "F");

        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text("YOUR NEIGHBORHOOD CREW", cx, headTop + 0.5, {
          align: "center",
          charSpace: 0.02,
        });

        doc.setFontSize(30);
        doc.text(company, cx, headTop + 1.35, {
          align: "center",
          maxWidth: w - 0.5,
        });

        // Green accent rule under the company name.
        doc.setFillColor(...GREEN);
        doc.roundedRect(cx - 0.7, headTop + 1.7, 1.4, 0.07, 0.035, 0.035, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Trusted local service", cx, headTop + 2.15, { align: "center" });

        // ---- White middle section: dynamic message ----
        const midY = headTop + headH + 0.7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);
        doc.setTextColor(...INK);
        doc.text("We are doing some work in", cx, midY, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(...BLUE);
        doc.text(`${city} today!`, cx, midY + 0.55, {
          align: "center",
          maxWidth: w - 0.4,
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11.5);
        doc.setTextColor(80, 88, 100);
        doc.text(
          "While our team is in the area, get a fast, free quote — no obligation.",
          cx,
          midY + 1.15,
          { align: "center", maxWidth: w - 0.5 },
        );

        // ---- Green footer block: CTA + QR ----
        const footH = 2.7;
        const footTop = 10.7 - footH;
        doc.setFillColor(...GREEN);
        doc.roundedRect(x, footTop, w, footH, 0.14, 0.14, "F");

        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(15);
        doc.text("Scan to get a", cx, footTop + 0.5, { align: "center" });
        doc.text("fast, free quote", cx, footTop + 0.85, { align: "center" });

        // QR code on a white rounded tile.
        const qrSize = 1.25;
        const tile = qrSize + 0.2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cx - tile / 2, footTop + 1.05, tile, tile, 0.1, 0.1, "F");
        doc.addImage(qr, "PNG", cx - qrSize / 2, footTop + 1.15, qrSize, qrSize);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Powered by Van AI", cx, footTop + footH - 0.22, { align: "center" });
      };

      drawHanger(0);
      drawHanger(half);

      doc.save(`${company.replace(/\s+/g, "-")}-door-hangers.pdf`);
      toast.success("Door hanger flyer generated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate flyer");
    } finally {
      setGenerating(false);
    }
  }


  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-5">
      <div className="flex items-start gap-3 rounded-xl border border-revenue/40 bg-revenue/10 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-revenue text-revenue-foreground">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Hyper-local Radius Marketing</p>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            While your crew is at this job, win the whole street. Drop flyers and text past
            customers nearby.
          </p>
        </div>
      </div>

      {/* Print Door Hangers */}
      <section className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white">Print Door Hangers</h3>
        <p className="mt-1 text-xs text-sidebar-foreground/70">
          A printable 8.5×11 sheet with two door hangers — your company name, the local city, and a
          QR code to your Van lead-capture widget.
        </p>
        <Button
          variant="revenue"
          className="mt-4 h-11 w-full"
          disabled={generating}
          onClick={generateFlyer}
        >
          {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          Generate PDF Flyer
        </Button>
      </section>

      {/* Neighbor Texts */}
      <NeighborTexts
        company={company}
        jobAddress={jobAddress}
        customers={customers}
        excludeId={job.customer_id}
      />
    </div>
  );
}

function NeighborTexts({
  company,
  jobAddress,
  customers,
  excludeId,
}: {
  company: string;
  jobAddress: string | null;
  customers: Customer[];
  excludeId: string | null;
}) {
  const runFind = useServerFn(findNeighbors);
  const runBlast = useServerFn(blastNeighbors);
  const mapRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [matches, setMatches] = useState<NeighborMatch[] | null>(null);

  async function scan() {
    if (!jobAddress) {
      toast.error("This job has no service address to map.");
      return;
    }
    setLoading(true);
    try {
      const candidates = customers
        .filter((c) => c.id !== excludeId && c.service_address)
        .map((c) => ({ id: c.id, name: c.full_name, phone: c.phone, address: c.service_address }));
      const result = await runFind({ data: { jobAddress, candidates } });
      setOrigin(result.origin);
      setMatches(result.matches);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not scan the area");
    } finally {
      setLoading(false);
    }
  }

  // Draw the map + 5-mile radius once we have an origin.
  useEffect(() => {
    if (!origin || !mapRef.current || !isMapsConfigured()) return;
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center: origin,
          zoom: 11,
          disableDefaultUI: true,
          zoomControl: true,
        });
        new google.maps.Marker({ position: origin, map });
        new google.maps.Circle({
          map,
          center: origin,
          radius: RADIUS_METERS,
          strokeColor: "#10b981",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.12,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [origin]);

  const textable = (matches ?? []).filter((m) => m.phone);

  async function textCustomers() {
    if (textable.length === 0) return;
    setSending(true);
    try {
      const result = await runBlast({
        data: {
          company,
          recipients: textable.map((m) => ({ phone: m.phone!, firstName: m.name })),
        },
      });
      if (result.sent > 0) {
        toast.success(`Sent ${result.sent} neighbor text${result.sent === 1 ? "" : "s"}.`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} message${result.failed === 1 ? "" : "s"} could not be sent.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send texts");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white">Neighbor Texts</h3>
        {matches && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-revenue px-2.5 py-1 text-xs font-bold text-revenue-foreground">
            <Users className="h-3.5 w-3.5" />
            {matches.length} within 5 mi
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-sidebar-foreground/70">
        Find past customers living within 5 miles of this job and invite them for a check-up.
      </p>

      {!matches ? (
        <Button
          variant="outline"
          className="mt-4 h-11 w-full"
          disabled={loading || !jobAddress}
          onClick={scan}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
          Scan 5-Mile Radius
        </Button>
      ) : (
        <>
          <div
            ref={mapRef}
            className="mt-4 h-44 w-full overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent"
          >
            {!isMapsConfigured() && (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-sidebar-foreground/60">
                Map preview unavailable
              </div>
            )}
          </div>

          {matches.length > 0 ? (
            <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-sidebar/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{m.name}</p>
                    <p className="truncate text-xs text-sidebar-foreground/60">
                      {m.address ?? "No address"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-revenue">
                    {m.distanceMiles} mi
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/60">
              No past customers found within 5 miles.
            </p>
          )}

          <Button
            variant="revenue"
            className="mt-4 h-11 w-full"
            disabled={sending || textable.length === 0}
            onClick={textCustomers}
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Text Past Customers ({textable.length})
          </Button>
        </>
      )}
    </section>
  );
}

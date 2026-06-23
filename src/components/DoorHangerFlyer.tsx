import { forwardRef } from "react";
import {
  AppWindow,
  Check,
  Droplet,
  Fence,
  Globe,
  Home,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Warehouse,
  Wrench,
} from "lucide-react";

import vantageLogo from "@/assets/vantage-logo.png";
import flyerOperator from "@/assets/flyer-operator.jpg";

const NAVY = "#0B1B2A";
const GREEN = "#00A859";

export type DoorHangerProps = {
  company: string;
  city: string;
  phone: string;
  website: string;
  qrDataUrl: string | null;
};

const valueProps = [
  { icon: Check, label: "Professional & Reliable" },
  { icon: Sparkles, label: "Top-Tier Equipment" },
  { icon: Home, label: "Boost Curb Appeal" },
  { icon: ThumbsUp, label: "100% Satisfaction" },
];

const services = [
  { icon: Droplet, title: "PRESSURE WASHING", sub: "Driveways, siding & patios" },
  { icon: Home, title: "HOUSE WASHING", sub: "Soft-wash exterior cleaning" },
  { icon: AppWindow, title: "WINDOW CLEANING", sub: "Streak-free, inside & out" },
  { icon: Warehouse, title: "ROOF CLEANING", sub: "Remove moss & stains" },
  { icon: Wrench, title: "GUTTER CLEANING", sub: "Flush & clear debris" },
  { icon: Fence, title: "DECK & FENCE", sub: "Restore & protect wood" },
];

/**
 * Premium dual-panel door hanger. Rendered with fixed pixel dimensions
 * (two 384×1056 vertical panels) so html2canvas-pro captures it cleanly for
 * print without the CSS breaking.
 */
export const DoorHangerFlyer = forwardRef<HTMLDivElement, DoorHangerProps>(
  function DoorHangerFlyer({ company, city, phone, website, qrDataUrl }, ref) {
    return (
      <div
        ref={ref}
        style={{ fontFamily: "Inter, Roboto, system-ui, sans-serif", background: "#ffffff" }}
        className="flex gap-6 p-6"
      >
        {/* ---------------- FRONT PANEL ---------------- */}
        <div
          className="relative flex flex-col overflow-hidden rounded-2xl"
          style={{ width: 384, height: 1056, border: "1px solid #e5e7eb" }}
        >
          {/* Header with curved bottom edge */}
          <div className="relative pb-10 pt-10" style={{ background: NAVY }}>
            <div className="flex justify-center">
              <img src={vantageLogo} alt={company} className="h-12 w-auto object-contain" />
            </div>
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: 40,
                background: "#ffffff",
                borderTopLeftRadius: "50% 100%",
                borderTopRightRadius: "50% 100%",
              }}
            />
          </div>

          {/* Hero text */}
          <div className="px-6 pt-6 text-center">
            <p className="text-2xl font-extrabold leading-tight" style={{ color: NAVY }}>
              WE'RE IN YOUR
            </p>
            <p className="text-3xl font-extrabold leading-tight" style={{ color: GREEN }}>
              NEIGHBORHOOD
            </p>
            <p className="text-2xl font-extrabold leading-tight" style={{ color: NAVY }}>
              TODAY!
            </p>
            <p className="mx-auto mt-3 max-w-[18rem] text-xs leading-relaxed text-slate-600">
              While our team is in {city}, take advantage of{" "}
              <span style={{ color: GREEN, fontWeight: 700 }}>special neighbor pricing.</span>
            </p>
          </div>

          {/* Value props */}
          <div className="mt-5 space-y-3 px-8">
            {valueProps.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0" style={{ color: GREEN }} strokeWidth={2.5} />
                <span className="text-sm font-semibold" style={{ color: NAVY }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Hero image */}
          <div className="mt-5 px-6">
            <div className="overflow-hidden rounded-xl" style={{ height: 200 }}>
              <img
                src={flyerOperator}
                alt="Our operator at work"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center gap-4 px-6 py-6" style={{ background: NAVY }}>
            <div className="shrink-0 rounded-xl bg-white p-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan QR" style={{ width: 84, height: 84 }} />
              ) : (
                <div style={{ width: 84, height: 84 }} className="bg-slate-200" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold leading-tight text-white">
                SCAN FOR A{" "}
                <span style={{ color: GREEN }}>FAST, FREE QUOTE!</span>
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                Limited-time neighbor discount available
              </p>
            </div>
          </div>
        </div>

        {/* ---------------- BACK PANEL ---------------- */}
        <div
          className="relative flex flex-col overflow-hidden rounded-2xl bg-white"
          style={{ width: 384, height: 1056, border: "1px solid #e5e7eb" }}
        >
          {/* Header */}
          <div className="px-6 pt-10 text-center">
            <p className="text-2xl font-extrabold leading-tight">
              <span style={{ color: GREEN }}>SERVICES </span>
              <span style={{ color: NAVY }}>WE PROVIDE</span>
            </p>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full" style={{ background: GREEN }} />
          </div>

          {/* Service list */}
          <div className="mt-6 space-y-4 px-6">
            {services.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                  style={{ background: GREEN }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold" style={{ color: NAVY }}>
                    {title}
                  </p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Insured banner */}
          <div
            className="mt-6 flex items-center justify-center gap-2 py-3"
            style={{ background: GREEN }}
          >
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
            <span className="text-sm font-extrabold uppercase tracking-wide text-white">
              Fully Insured & Local
            </span>
          </div>

          {/* Footer */}
          <div className="mt-auto px-6 py-6" style={{ background: NAVY }}>
            <div className="flex items-center gap-3 text-white">
              <Phone className="h-4 w-4 shrink-0" style={{ color: GREEN }} strokeWidth={2.5} />
              <span className="text-sm font-bold">{phone}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-white">
              <Globe className="h-4 w-4 shrink-0" style={{ color: GREEN }} strokeWidth={2.5} />
              <span className="text-sm font-semibold">{website}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-4">
              <span
                className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-extrabold"
                style={{ color: "#4285F4" }}
              >
                G
              </span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5" fill="#FBBC05" stroke="#FBBC05" />
                ))}
              </div>
              <span className="ml-1 text-[11px] font-semibold text-slate-200">
                5-STAR RATED by your neighbors
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

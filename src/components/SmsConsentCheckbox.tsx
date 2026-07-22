import { Link } from "@tanstack/react-router";

/**
 * The exact SMS consent language a customer agrees to. Interpolates the
 * business name; the returned string is what gets stored verbatim in
 * sms_consent_records.consent_text_shown, so it must match what's rendered.
 */
export function smsConsentText(company: string): string {
  return `I agree to receive SMS text messages from ${company} regarding my appointment and service updates. Message and data rates may apply. Reply STOP to opt out. View terms.`;
}

/**
 * Unchecked-by-default SMS opt-in checkbox shown wherever a customer's phone
 * number is captured. "terms" links to the public /sms-terms page. The exact
 * agreed text is available via {@link smsConsentText} for the consent record.
 */
export function SmsConsentCheckbox({
  checked,
  onCheckedChange,
  company,
  id = "sms-consent",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Business name interpolated into the consent language. */
  company: string;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-revenue"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span>
        I agree to receive SMS text messages from{" "}
        <span className="font-medium text-foreground">{company}</span> regarding my appointment
        and service updates. Message and data rates may apply. Reply STOP to opt out.{" "}
        <Link
          to="/sms-terms"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-revenue underline underline-offset-2 hover:text-revenue/80"
        >
          View terms
        </Link>
        .
      </span>
    </label>
  );
}

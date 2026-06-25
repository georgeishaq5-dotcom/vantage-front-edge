import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, FileType2, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  fetchJobsWithFullCustomers,
  buildFinancialReport,
  formatCurrency,
  type FinancialReportRow,
} from "@/lib/fsm";

const HEADERS = ["Job ID", "Customer", "Type", "Job", "Service Date", "Status", "Revenue (USD)"];

function toRows(report: FinancialReportRow[]): (string | number)[][] {
  return report.map((r) => [
    r.jobId,
    r.customer,
    r.customerType,
    r.jobTitle,
    r.serviceDate || "—",
    r.status,
    r.revenue,
  ]);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STAMP = () => new Date().toISOString().slice(0, 10);

export function FinancialReports() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithFullCustomers,
  });

  const report = useMemo(() => buildFinancialReport(jobs), [jobs]);
  const total = useMemo(() => report.reduce((s, r) => s + r.revenue, 0), [report]);

  function guard(): boolean {
    if (report.length === 0) {
      toast.info("No completed job revenue to export yet.");
      return false;
    }
    return true;
  }

  async function exportXlsx() {
    if (!guard()) return;
    try {
      const ExcelJSModule = await import("exceljs");
      const ExcelJS = (ExcelJSModule as { default?: typeof ExcelJSModule }).default ?? ExcelJSModule;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Revenue");
      ws.columns = [
        { width: 14 },
        { width: 22 },
        { width: 12 },
        { width: 26 },
        { width: 14 },
        { width: 12 },
        { width: 14 },
      ];
      ws.addRow(HEADERS);
      ws.getRow(1).font = { bold: true };
      for (const row of toRows(report)) ws.addRow(row);
      const buffer = await wb.xlsx.writeBuffer();
      download(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `vantage-financials-${STAMP()}.xlsx`,
      );
      toast.success("Excel report exported");
    } catch {
      toast.error("Could not generate the Excel file.");
    }
  }

  async function exportPdf() {
    if (!guard()) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Vantage FSM — Financial Report", 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated ${STAMP()}  ·  Completed job revenue`, 14, 25);

      let y = 38;
      doc.setFont("helvetica", "bold");
      doc.text("Customer", 14, y);
      doc.text("Service Date", 95, y);
      doc.text("Revenue", 165, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 6;
      for (const r of report) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(String(r.customer).slice(0, 38), 14, y);
        doc.text(r.serviceDate || "—", 95, y);
        doc.text(formatCurrency(r.revenue), 165, y, { align: "right" });
        y += 6;
      }
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text("Total Revenue", 14, y);
      doc.text(formatCurrency(total), 165, y, { align: "right" });
      doc.save(`vantage-financials-${STAMP()}.pdf`);
      toast.success("PDF report exported");
    } catch {
      toast.error("Could not generate the PDF file.");
    }
  }

  function exportCsv() {
    if (!guard()) return;
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [HEADERS.join(",")];
    for (const row of toRows(report)) lines.push(row.map(escape).join(","));
    lines.push("");
    lines.push(`Total Revenue,,,,,,${total}`);
    download(new Blob([lines.join("\n")], { type: "text/csv" }), `vantage-financials-${STAMP()}.csv`);
    toast.success("CSV / raw data exported");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">
            Export completed job revenue, dates, and customer data (Sales Cube).
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-border pt-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed jobs</p>
          <p className="text-lg font-semibold text-foreground">{report.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total revenue</p>
          <p className="text-lg font-semibold text-revenue">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={exportXlsx} disabled={isLoading} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          .XLSX (Excel)
        </Button>
        <Button variant="secondary" onClick={exportPdf} disabled={isLoading} className="gap-2">
          <FileType2 className="h-4 w-4" />
          .PDF (Document)
        </Button>
        <Button variant="secondary" onClick={exportCsv} disabled={isLoading} className="gap-2">
          <FileText className="h-4 w-4" />
          .TXT / .CSV (Raw Data)
        </Button>
      </div>
    </div>
  );
}

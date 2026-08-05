function hucValue(deger: string | number): string {
  const s = String(deger);
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvIndir(ad: string, satirlar: (string | number)[][]) {
  const csv = "\uFEFF" + satirlar.map((r) => r.map(hucValue).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ad}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function pdfYazdir(baslik: string, altBaslik: string, satirlar: (string | number)[][], baslikSatirMi = true) {
  const colCount = Math.max(1, ...satirlar.map((r) => r.length));
  const thStyle = "background:#f7f4ec;color:#2c3a52;font-weight:700;text-align:left;padding:8px 10px;border-bottom:2px solid #e4bb60;";
  const tdStyle = "padding:7px 10px;border-bottom:1px solid #eee;font-size:12px;";
  const rows = satirlar
    .map((r) => {
      const cells = Array.from({ length: colCount }, (_, i) => {
        const v = r[i] !== undefined ? String(r[i]) : "—";
        return `<td style="${tdStyle}">${v}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${baslik}</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#2c3a52;margin:32px;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px solid #e4bb60;padding-bottom:10px;margin-bottom:18px;">
    <h1 style="margin:0;font-size:22px;">${baslik}</h1>
    <span style="font-size:12px;color:#888;">${altBaslik}</span>
  </div>
  <table style="border-collapse:collapse;width:100%;">${
    baslikSatirMi ? `<tr>${Array.from({ length: colCount }, (_, i) => `<th style="${thStyle}">${satirlar[0][i] ?? ""}</th>`).join("")}</tr>` : ""
  }${baslikSatirMi ? rows : satirlar.map((r) => `<tr>${r.map((c) => `<td style="${tdStyle}">${c}</td>`).join("")}</tr>`).join("")}</table>
  <p style="margin-top:24px;font-size:11px;color:#aaa;">Universitely · ${new Date().toLocaleDateString("tr-TR")}</p>
  <script>window.onload = function(){ window.print(); };</script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

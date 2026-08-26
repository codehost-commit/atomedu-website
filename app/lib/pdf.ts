const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const LINE_H = 15;
const MAX_CHARS = 82;

function cleanText(value: string): string {
  return Array.from(value.replace(/\r\n/g, "\n").replace(/\t/g, "  "))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 10 || code === 13 || (code >= 32 && code <= 126);
    })
    .join("");
}

function escapePdf(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(line: string): string[] {
  if (!line.trim()) return [""];
  const out: string[] = [];
  let current = "";
  for (const word of line.split(/\s+/)) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= MAX_CHARS) {
      current += ` ${word}`;
    } else {
      out.push(current);
      current = word;
    }
  }
  if (current) out.push(current);
  return out;
}

function linesFor(title: string, content: string): string[] {
  const body = cleanText(content)
    .replace(/^#+\s*/gm, "")
    .split("\n")
    .flatMap(wrapLine);
  return [cleanText(title || "Atom Edu Assignment"), "", ...body];
}

function pageStream(lines: string[]): string {
  const parts = ["BT", "/F1 11 Tf", "14 TL", `${MARGIN} ${PAGE_H - MARGIN} Td`];
  lines.forEach((line, idx) => {
    if (idx === 0) {
      parts.push("/F2 18 Tf", `(${escapePdf(line)}) Tj`, "/F1 11 Tf", "T*");
      return;
    }
    parts.push(`(${escapePdf(line)}) Tj`, "T*");
  });
  parts.push("ET");
  return parts.join("\n");
}

export function createWorksheetPdf(title: string, content: string): Uint8Array {
  const allLines = linesFor(title, content);
  const usableLines = Math.floor((PAGE_H - MARGIN * 2) / LINE_H) - 1;
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += usableLines) pages.push(allLines.slice(i, i + usableLines));

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((pageLines, index) => {
    const pageObj = 3 + index * 2;
    const streamObj = pageObj + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${streamObj} 0 R >>`);
    const stream = pageStream(pageLines);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

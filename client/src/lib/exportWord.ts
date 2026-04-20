import { asBlob } from "html-docx-js-typescript";

function sanitizeFilename(input: string): string {
  const safe = input.replace(/[^\w\u4e00-\u9fa5-]+/g, "_").slice(0, 80);
  return safe || "resume";
}

function collectStyles(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      for (const rule of Array.from(rules)) {
        css += `${rule.cssText}\n`;
      }
    } catch {
      // Ignore cross-origin stylesheets (e.g. external fonts).
    }
  }
  return css;
}

export async function exportResumeWord(element: HTMLElement, fileBase: string): Promise<{ filename: string }> {
  const styles = collectStyles();
  const body = element.outerHTML;
  const html = `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <meta name="ProgId" content="Word.Document" />
  <meta name="Generator" content="Resume Studio" />
  <style>
    @page { size: A4; margin: 12mm; }
    body { margin: 0; background: #ffffff; }
    ${styles}
    .cv-page {
      width: auto !important;
      min-height: auto !important;
      box-shadow: none !important;
      margin: 0 !important;
      background: #fff !important;
    }
  </style>
</head>
<body>${body}</body>
</html>`;

  const docxData = await asBlob(html, {
    orientation: "portrait",
    margins: {
      top: 720,
      right: 720,
      bottom: 720,
      left: 720,
    },
  });
  const blob =
    docxData instanceof Blob
      ? docxData
      : new Blob([docxData as BlobPart], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
  const filename = `${sanitizeFilename(fileBase)}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { filename };
}

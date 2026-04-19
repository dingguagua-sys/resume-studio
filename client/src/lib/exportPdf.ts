import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * 在离屏节点上截图：避免父级 `transform: scale()` 导致 html2canvas 截出空白或失败。
 */
export async function exportResumePdf(element: HTMLElement, fileBase: string): Promise<{ filename: string }> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-9999px",
    top: "0",
    overflow: "visible",
    zIndex: "2147483646",
    opacity: "1",
    pointerEvents: "none",
    transform: "none",
    margin: "0",
    padding: "0",
    boxSizing: "border-box",
  });

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await waitNextPaint();
    const w = Math.max(1, Math.ceil(clone.scrollWidth || element.scrollWidth));
    const h = Math.max(1, Math.ceil(clone.scrollHeight || element.scrollHeight));
    host.style.width = `${w}px`;
    host.style.height = `${h}px`;

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: w,
      height: h,
      windowWidth: w,
      windowHeight: h,
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("截图为空，请尝试将浏览器缩放设为 100% 后重试");
    }

    const imgData = canvas.toDataURL("image/png");
    if (!imgData || imgData.length < 100) {
      throw new Error("无法生成图片数据，请检查网络字体是否加载完成");
    }

    const wMm = 210;
    const hMm = (canvas.height * wMm) / canvas.width;
    const pdf = new jsPDF({
      unit: "mm",
      format: [wMm, Math.max(297, Math.ceil(hMm))],
      orientation: "portrait",
    });
    pdf.addImage(imgData, "PNG", 0, 0, wMm, hMm, undefined, "FAST");

    const safe = fileBase.replace(/[^\w\u4e00-\u9fa5-]+/g, "_").slice(0, 80) || "resume";
    const filename = `${safe}.pdf`;
    pdf.save(filename);
    return { filename };
  } finally {
    host.remove();
  }
}

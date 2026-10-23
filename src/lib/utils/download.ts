/** Trigger a browser download for an in-memory file. */
export function downloadFile(file: Blob, name: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(csv: string, name: string) {
  downloadFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), name);
}

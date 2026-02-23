"use client";

export function ClientDownload({
  fileId,
  fileName,
  sizeKb,
}: {
  fileId: string;
  fileName: string;
  sizeKb: number;
}) {
  const handleDownload = async () => {
    const res = await fetch(`/api/files/${fileId}`);
    const { url } = await res.json();
    window.open(url, "_blank");
  };

  return (
    <button onClick={handleDownload} className="hover:underline text-left">
      {fileName}
      <span className="text-gray-400 ml-1">({sizeKb} KB)</span>
    </button>
  );
}

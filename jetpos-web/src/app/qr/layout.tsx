import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Menü",
  description: "Dijital QR Menü",
};

export default function QRMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {children}
    </div>
  );
}

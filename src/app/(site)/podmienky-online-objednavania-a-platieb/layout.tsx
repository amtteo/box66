import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podmienky online objednávania a platieb",
  description:
    "Podmienky používania online objednávania a platieb prostredníctvom webovej stránky a mobilnej aplikácie Box66.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

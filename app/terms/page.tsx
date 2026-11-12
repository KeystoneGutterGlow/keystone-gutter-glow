import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocs } from "@/content/legal";

const doc = legalDocs.terms;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: doc.path },
};

export default function TermsPage() {
  return <LegalPage doc={doc} />;
}

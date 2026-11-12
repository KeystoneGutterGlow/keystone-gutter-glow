import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocs } from "@/content/legal";

const doc = legalDocs.planTerms;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: doc.path },
};

export default function PlanTermsPage() {
  return <LegalPage doc={doc} />;
}

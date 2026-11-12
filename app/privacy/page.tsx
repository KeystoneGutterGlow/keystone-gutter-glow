import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocs } from "@/content/legal";

const doc = legalDocs.privacy;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: { canonical: doc.path },
};

export default function PrivacyPage() {
  return <LegalPage doc={doc} />;
}

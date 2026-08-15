import { WorkshopHeader } from "./WorkshopHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkshopHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}

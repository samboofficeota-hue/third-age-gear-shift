import { WorkshopHeader } from "./WorkshopHeader";

export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkshopHeader />
      <main>{children}</main>
      <footer className="mt-16 border-t border-[rgba(255,255,255,0.06)] py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} 株式会社COMMUNITY
      </footer>
    </>
  );
}

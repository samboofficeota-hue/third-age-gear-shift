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
    </>
  );
}

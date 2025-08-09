// src/app/(main)/layout.tsx
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // IMPORTANT: no footer here to avoid duplicates
  return <>{children}</>;
}

import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}

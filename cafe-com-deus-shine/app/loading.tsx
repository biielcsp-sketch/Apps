import { CoffeeLoader } from "@/components/ui/CoffeeLoader";

// UI de carregamento do Next.js (App Router) — aparece automaticamente
// durante a transição entre páginas, no lugar do círculo giratório.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <CoffeeLoader size={112} label="Carregando página" />
    </div>
  );
}

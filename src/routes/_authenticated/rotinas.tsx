import { createFileRoute } from "@tanstack/react-router";
import { IconRepeat } from "@tabler/icons-react";
import { SectionHeader } from "@/components/ds";

export const Route = createFileRoute("/_authenticated/rotinas")({
  component: Rotinas,
});

function Rotinas() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Rotinas" />
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        <IconRepeat className="size-8" stroke={1.5} />
        <p className="text-sm">
          Em construção — aqui vai a lista de rotinas que você quer acompanhar.
        </p>
      </div>
    </div>
  );
}

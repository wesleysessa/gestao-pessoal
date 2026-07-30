import { createFileRoute } from "@tanstack/react-router";
import { IconSettings } from "@tabler/icons-react";
import { SectionHeader } from "@/components/ds";

export const Route = createFileRoute("/_authenticated/cadastros")({
  component: Cadastros,
});

function Cadastros() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Cadastros" />
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        <IconSettings className="size-8" stroke={1.5} />
        <p className="text-sm">Em construção.</p>
      </div>
    </div>
  );
}

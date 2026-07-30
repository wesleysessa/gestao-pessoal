import { createFileRoute } from "@tanstack/react-router";
import { ModuleGrid } from "@/components/module-grid";
import { MENU_MODULOS } from "@/features/menu-modulos";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

function Home() {
  return <ModuleGrid items={MENU_MODULOS} />;
}

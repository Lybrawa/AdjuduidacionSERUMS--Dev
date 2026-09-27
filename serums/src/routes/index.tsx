import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/dashboard";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema de Adjudicación SERUMS e Internado | Demo en vivo" },
      {
        name: "description",
        content:
          "Explora plazas de salud, prepara favoritos y prueba el flujo de adjudicación SERUMS e Internado en una simulación interactiva.",
      },
      { property: "og:title", content: "Sistema de Adjudicación SERUMS e Internado" },
      {
        property: "og:description",
        content:
          "Catálogo interactivo de plazas de salud y simulación de turnos para SERUMS e Internado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

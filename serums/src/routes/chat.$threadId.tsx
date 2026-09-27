import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/dashboard";
export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Consulta SERUMS | Adjudicación en Vivo" },
      {
        name: "description",
        content:
          "Consulta de demostración del asistente SERUMS junto al catálogo de plazas de salud.",
      },
      { property: "og:title", content: "Consulta SERUMS | Adjudicación en Vivo" },
      {
        property: "og:description",
        content:
          "Asistente de orientación y catálogo de plazas de salud en una experiencia de demostración.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});
function ChatPage() {
  const { threadId } = Route.useParams();
  return <Dashboard threadId={threadId} />;
}

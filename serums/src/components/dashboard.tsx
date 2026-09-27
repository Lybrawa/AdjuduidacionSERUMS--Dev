import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  FilterX,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldPlus,
  SlidersHorizontal,
  Star,
  Timer,
  Wifi,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";

type Status = "available" | "reviewing" | "occupied";
type Vacancy = {
  id: number;
  name: string;
  code: string;
  district: string;
  province: string;
  region: string;
  level: string;
  institution: string;
  modality: string;
  quintile: string;
  vraem: boolean;
  status: Status;
  holder?: number;
  slots: number;
};
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
};
type Thread = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };
const STORAGE = "serums-demo-conversations-v1";
const initialVacancies: Vacancy[] = [
  {
    id: 1,
    name: "C.S. Quinua",
    code: "00003421",
    district: "Quinua",
    province: "Huamanga",
    region: "Ayacucho",
    level: "I-3",
    institution: "MINSA",
    modality: "Remunerada",
    quintile: "Quintil 1 · VRAEM",
    vraem: true,
    status: "available",
    slots: 1,
  },
  {
    id: 2,
    name: "P.S. Luricocha",
    code: "00004782",
    district: "Luricocha",
    province: "Huanta",
    region: "Ayacucho",
    level: "I-2",
    institution: "MINSA",
    modality: "Remunerada",
    quintile: "Quintil 1",
    vraem: false,
    status: "reviewing",
    slots: 1,
  },
  {
    id: 3,
    name: "C.S. Acobamba",
    code: "00001936",
    district: "Acobamba",
    province: "Acobamba",
    region: "Huancavelica",
    level: "I-4",
    institution: "EsSalud",
    modality: "Equivalente",
    quintile: "Quintil 2",
    vraem: false,
    status: "available",
    slots: 1,
  },
  {
    id: 4,
    name: "P.S. Kimbiri",
    code: "00005814",
    district: "Kimbiri",
    province: "La Convención",
    region: "Cusco",
    level: "I-2",
    institution: "MINSA",
    modality: "Remunerada",
    quintile: "Quintil 1 · VRAEM",
    vraem: true,
    status: "available",
    slots: 1,
  },
  {
    id: 5,
    name: "C.S. San Miguel",
    code: "00002693",
    district: "San Miguel",
    province: "La Mar",
    region: "Ayacucho",
    level: "I-3",
    institution: "Sanidad PNP",
    modality: "Remunerada",
    quintile: "Quintil 2",
    vraem: false,
    status: "occupied",
    holder: 41,
    slots: 0,
  },
  {
    id: 6,
    name: "P.S. Pichari",
    code: "00006172",
    district: "Pichari",
    province: "La Convención",
    region: "Cusco",
    level: "I-1",
    institution: "MINSA",
    modality: "Equivalente",
    quintile: "Quintil 1 · VRAEM",
    vraem: true,
    status: "available",
    slots: 1,
  },
  {
    id: 7,
    name: "C.S. Pampas",
    code: "00001459",
    district: "Pampas",
    province: "Tayacaja",
    region: "Huancavelica",
    level: "I-4",
    institution: "Sanidad Ejército",
    modality: "Remunerada",
    quintile: "Quintil 2",
    vraem: false,
    status: "available",
    slots: 1,
  },
  {
    id: 8,
    name: "P.S. Tambo",
    code: "00003807",
    district: "Tambo",
    province: "La Mar",
    region: "Ayacucho",
    level: "I-1",
    institution: "MINSA",
    modality: "Equivalente",
    quintile: "Quintil 1",
    vraem: false,
    status: "occupied",
    holder: 40,
    slots: 0,
  },
  {
    id: 9,
    name: "C.S. Echarati",
    code: "00005503",
    district: "Echarati",
    province: "La Convención",
    region: "Cusco",
    level: "I-3",
    institution: "EsSalud",
    modality: "Remunerada",
    quintile: "Quintil 2",
    vraem: false,
    status: "available",
    slots: 1,
  },
];
const suggestionTexts = [
  "¿Qué es plaza equivalente?",
  "¿Cuándo se entregan los proveídos?",
  "¿Requisitos para renuncia?",
];
const responseFor = (question: string) => {
  const q = question.toLocaleLowerCase("es");
  if (q.includes("equivalente"))
    return "Una **plaza equivalente** corresponde a una modalidad de servicio distinta de la remunerada. Sus condiciones específicas dependen de la convocatoria vigente. Revisa las bases oficiales antes de elegir.";
  if (q.includes("proveído") || q.includes("proveido"))
    return "La entrega de proveídos depende del cronograma oficial del proceso. Consulta la publicación vigente de la entidad convocante para confirmar fechas y documentos.";
  if (q.includes("renuncia"))
    return "Para una renuncia, verifica el procedimiento y los plazos en las bases de tu convocatoria y presenta tu solicitud ante la entidad correspondiente. **No tomes una decisión solo con esta orientación simulada.**";
  return "Puedo orientarte sobre modalidades, proveídos y renuncias del SERUMS. Esta es una **respuesta de demostración**, no una interpretación oficial de la Ley N.° 23330. Verifica siempre la convocatoria y la normativa vigente.";
};
const makeId = () => crypto.randomUUID();
function readThreads(): Thread[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveThreads(threads: Thread[]) {
  localStorage.setItem(STORAGE, JSON.stringify(threads));
}

function Assistant({ threadId }: { threadId?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(Boolean(threadId));
  const [threads, setThreads] = useState<Thread[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const loaded = readThreads();
    if (threadId && !loaded.some((t) => t.id === threadId)) {
      const newThread = {
        id: threadId,
        title: "Nueva consulta",
        updatedAt: Date.now(),
        messages: [],
      };
      loaded.unshift(newThread);
      saveThreads(loaded);
    }
    setThreads(loaded);
  }, [threadId]);
  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [open, threadId, busy]);
  const active = threads.find((t) => t.id === threadId);
  const createThread = () => {
    const id = makeId();
    const next = [
      { id, title: "Nueva consulta", updatedAt: Date.now(), messages: [] },
      ...readThreads(),
    ];
    saveThreads(next);
    setThreads(next);
    setOpen(true);
    navigate({ to: "/chat/$threadId", params: { threadId: id } });
  };
  const show = () => {
    if (!threadId) createThread();
    else setOpen(true);
  };
  const send = (value: string) => {
    const text = value.trim();
    if (!text || !threadId || busy) return;
    const current = readThreads();
    const next = current.map((t) =>
      t.id === threadId
        ? {
            ...t,
            title: t.messages.length ? t.title : text.slice(0, 38),
            updatedAt: Date.now(),
            messages: [
              ...t.messages,
              { id: makeId(), role: "user" as const, parts: [{ type: "text" as const, text }] },
            ],
          }
        : t,
    );
    saveThreads(next);
    setThreads(next);
    setBusy(true);
    setTimeout(() => {
      const updated = readThreads().map((t) =>
        t.id === threadId
          ? {
              ...t,
              updatedAt: Date.now(),
              messages: [
                ...t.messages,
                {
                  id: makeId(),
                  role: "assistant" as const,
                  parts: [{ type: "text" as const, text: responseFor(text) }],
                },
              ],
            }
          : t,
      );
      saveThreads(updated);
      setThreads(updated);
      setBusy(false);
    }, 650);
  };
  return (
    <>
      {open && (
        <div
          className="assistant-panel fixed bottom-20 right-4 z-40 flex h-[min(680px,calc(100dvh-112px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden border border-border bg-card shadow-xl sm:right-6"
          aria-label="Asistente Virtual SERUMS"
        >
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-foreground/15">
              <ShieldPlus className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Asistente Virtual SERUMS</p>
              <p className="text-xs text-primary-foreground/75">
                Ley N.° 23330 · Orientación de prueba
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar asistente"
              className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {threads.map((t) => (
                <Button
                  key={t.id}
                  variant={t.id === threadId ? "secondary" : "ghost"}
                  size="sm"
                  className="max-w-36 shrink-0 truncate text-xs"
                  title={t.title}
                  onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                >
                  {t.title}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              title="Nueva conversación"
              aria-label="Nueva conversación"
              onClick={createThread}
            >
              <Plus />
            </Button>
          </div>
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="gap-4 px-4 py-5">
              {!active?.messages.length && (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 grid size-12 place-items-center rounded-lg bg-secondary text-primary">
                    <ShieldPlus />
                  </div>
                  <h3 className="font-semibold">¿En qué puedo ayudarte?</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Consulta información general sobre el proceso SERUMS. Las respuestas son
                    simuladas.
                  </p>
                </div>
              )}
              {active?.messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent
                    className={
                      message.role === "user" ? "bg-primary text-primary-foreground" : undefined
                    }
                  >
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))}
              {busy && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>Preparando respuesta...</Shimmer>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          {!active?.messages.length && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 pt-3">
              {suggestionTexts.map((s) => (
                <Button
                  variant="outline"
                  size="sm"
                  key={s}
                  className="h-auto whitespace-normal py-1.5 text-left text-xs"
                  onClick={() => send(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
          <div className="p-3">
            <PromptInput onSubmit={({ text }) => send(text)}>
              <PromptInputTextarea
                ref={inputRef}
                placeholder="Escribe tu consulta..."
                className="min-h-12"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={busy ? "submitted" : "ready"}
                  disabled={busy}
                  aria-label="Enviar consulta"
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
      <Button
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        title={open ? "Cerrar asistente" : "Abrir asistente"}
        onClick={() => (open ? setOpen(false) : show())}
        className="fixed bottom-5 right-4 z-40 size-12 rounded-full shadow-lg sm:right-6"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </>
  );
}

function SelectFilter({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-foreground">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos</option>
          {values.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
      </span>
    </label>
  );
}

export default function Dashboard({ threadId }: { threadId?: string }) {
  const [vacancies, setVacancies] = useState(initialVacancies);
  const [turn, setTurn] = useState(42);
  const [seconds, setSeconds] = useState(85);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [modality, setModality] = useState("");
  const [level, setLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [vraem, setVraem] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([1, 4, 3]);
  const [selected, setSelected] = useState<Vacancy | null>(null);
  const [awarded, setAwarded] = useState<Vacancy | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const yourTurn = turn === 45;
  const advance = () => {
    setTurn((n) => Math.min(45, n + 1));
    setSeconds(85);
    setVacancies((prev) =>
      prev.map((v) => (v.status === "reviewing" ? { ...v, status: "available" } : v)),
    );
  };
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 85)), 1000);
    return () => clearInterval(interval);
  }, []);
  const filtered = useMemo(
    () =>
      vacancies.filter((v) => {
        const query = search.trim().toLocaleLowerCase("es");
        return (
          (!query ||
            `${v.name} ${v.code} ${v.district} ${v.province} ${v.region}`
              .toLocaleLowerCase("es")
              .includes(query)) &&
          (!region || v.region === region) &&
          (!modality || v.modality === modality) &&
          (!level || v.level === level) &&
          (!institution || v.institution === institution) &&
          (!vraem || v.vraem)
        );
      }),
    [vacancies, search, region, modality, level, institution, vraem],
  );
  const available = vacancies.filter((v) => v.status === "available").length;
  const reset = () => {
    setSearch("");
    setRegion("");
    setModality("");
    setLevel("");
    setInstitution("");
    setVraem(false);
  };
  const toggleFavorite = (id: number) =>
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((n) => n !== id)
        : prev.length < 3
          ? [...prev, id]
          : [...prev.slice(1), id],
    );
  const confirm = () => {
    if (!selected || !yourTurn) return;
    const result = selected;
    setVacancies((prev) =>
      prev.map((v) =>
        v.id === result.id ? { ...v, status: "occupied", holder: 45, slots: 0 } : v,
      ),
    );
    setSelected(null);
    setAwarded(result);
  };
  const download = async () => {
    if (!awarded) return;
    const [{ jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);
    const doc = new jsPDF();
    const qr = await QRCode.toDataURL(`DEMO SERUMS|${awarded.code}|PUESTO 45|${awarded.name}`);
    doc.setFontSize(18);
    doc.text("ACTA DE ADJUDICACION - SIMULACION", 20, 28);
    doc.setFontSize(11);
    doc.text("Documento de demostracion. Sin validez oficial.", 20, 39);
    doc.line(20, 46, 190, 46);
    doc.text(`Establecimiento: ${awarded.name}`, 20, 60);
    doc.text(`Codigo RENAES: ${awarded.code}`, 20, 70);
    doc.text(`Region: ${awarded.region} - ${awarded.province}`, 20, 80);
    doc.text(`Categoria: ${awarded.level}`, 20, 90);
    doc.text(`Institucion: ${awarded.institution}`, 20, 100);
    doc.text("Puesto de prueba: #45", 20, 110);
    doc.addImage(qr, "PNG", 20, 125, 44, 44);
    doc.text("QR de demostracion", 20, 178);
    doc.save(`acta-demo-${awarded.code}.pdf`);
  };
  const sidebar = (
    <aside className="space-y-6 border-r border-border bg-card p-5 lg:min-h-[calc(100vh-184px)] lg:w-[268px] lg:shrink-0 lg:p-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="size-4 text-primary" /> Filtros de búsqueda
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 lg:hidden"
            onClick={() => setMobileFilters(false)}
            aria-label="Cerrar filtros"
          >
            <X />
          </Button>
        </div>
        <label className="relative block">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, RENAES o distrito"
            className="h-10 pl-9 text-sm"
            aria-label="Buscar establecimiento"
          />
        </label>
      </div>
      <div className="space-y-4">
        <SelectFilter
          label="Región / Departamento"
          value={region}
          values={["Ayacucho", "Huancavelica", "Cusco"]}
          onChange={setRegion}
        />
        <SelectFilter
          label="Modalidad"
          value={modality}
          values={["Remunerada", "Equivalente"]}
          onChange={setModality}
        />
        <SelectFilter
          label="Nivel de establecimiento"
          value={level}
          values={["I-1", "I-2", "I-3", "I-4"]}
          onChange={setLevel}
        />
        <SelectFilter
          label="Institución"
          value={institution}
          values={["MINSA", "EsSalud", "Sanidad PNP", "Sanidad Ejército"]}
          onChange={setInstitution}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <label htmlFor="vraem-filter" className="text-xs font-medium leading-snug">
            Solo zona VRAEM / Quintil 1
          </label>
          <Switch id="vraem-filter" checked={vraem} onCheckedChange={setVraem} />
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="w-full text-muted-foreground">
          <FilterX className="size-4" /> Limpiar filtros
        </Button>
      </div>
      <div className="border-t border-border pt-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold">Mi estrategia</h2>
          <Star className="size-4 text-warning" />
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Hasta 3 plazas favoritas</p>
        <div className="space-y-2">
          {[0, 1, 2].map((position) => {
            const v = vacancies.find((item) => item.id === favorites[position]);
            return (
              <div
                key={position}
                className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded bg-secondary text-xs font-bold text-primary">
                  {String.fromCharCode(65 + position)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {v?.name ?? `Plan ${String.fromCharCode(65 + position)} sin asignar`}
                  </p>
                  {v && (
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        v.status === "occupied"
                          ? "text-danger"
                          : v.status === "reviewing"
                            ? "text-warning"
                            : "text-success",
                      )}
                    >
                      ●{" "}
                      {v.status === "occupied"
                        ? "Tomada"
                        : v.status === "reviewing"
                          ? "En revisión"
                          : "Libre"}
                    </span>
                  )}
                </div>
                {v && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground"
                    onClick={() => toggleFavorite(v.id)}
                    aria-label={`Quitar ${v.name} de favoritos`}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        <CircleHelp className="mb-2 size-4 text-primary" />
        Esta vista usa datos y turnos simulados. No realiza adjudicaciones oficiales.
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1720px] items-center justify-between gap-4 px-4 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldPlus className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold leading-tight sm:text-base">
                SERUMS <span className="font-medium">Adjudicación en Vivo</span>
              </p>
              <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">
                Sistema de Adjudicación SERUMS e Internado
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-success xl:flex">
            <span className="size-2 animate-pulse rounded-full bg-success" /> Conectado · simulación
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-md bg-secondary px-2.5 py-1.5 text-[11px] font-bold uppercase text-secondary-foreground md:inline-flex">
              Entorno de prueba
            </span>
            <span className="grid size-8 place-items-center rounded-full border border-border bg-secondary text-xs font-bold text-primary">
              JP
            </span>
          </div>
        </div>
      </header>
      <div className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1720px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:px-7">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
              Turno actual · demostración
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-50" />
                <span className="relative inline-flex size-2.5 rounded-full bg-warning" />
              </span>
              <p className="truncate text-sm font-bold sm:text-base">
                Puesto #{turn}{" "}
                <span className="font-medium text-muted-foreground">
                  ·{" "}
                  {yourTurn ? "Tu turno" : turn === 42 ? "Dr. Carlos Pérez" : `Postulante #${turn}`}
                </span>
              </p>
            </div>
          </div>
          <div className="hidden min-w-0 border-l border-border pl-5 md:block">
            <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
              Tu posición: #45
            </p>
            <p className="truncate text-sm font-semibold">
              {yourTurn ? "¡Es tu turno de elegir!" : `Faltan ${45 - turn} turnos`}{" "}
              <span className="font-normal text-muted-foreground">
                {!yourTurn && `· Aprox. ${((45 - turn) * 1.3) | 0} min`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5",
                seconds < 20 ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary",
              )}
            >
              <Timer className="size-5" />
              <span className="font-mono text-xl font-extrabold tabular-nums sm:text-2xl">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={advance}
              disabled={yourTurn}
              className="hidden sm:inline-flex"
            >
              {yourTurn ? "Tu turno" : "Avanzar turno"} <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 pb-3 text-xs text-muted-foreground md:hidden">
          <span>
            Tu posición: <strong className="text-foreground">#45</strong> ·{" "}
            {yourTurn ? "¡Tu turno!" : `Faltan ${45 - turn} turnos`}
          </span>
          <Button variant="outline" size="sm" onClick={advance} disabled={yourTurn}>
            {yourTurn ? "Tu turno" : "Avanzar turno"} <ArrowRight />
          </Button>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1720px]">
        <div className="hidden lg:block">{sidebar}</div>
        {mobileFilters && (
          <div
            className="fixed inset-0 z-50 bg-overlay lg:hidden"
            onClick={() => setMobileFilters(false)}
          >
            <div
              className="h-full w-[min(320px,90vw)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebar}
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-7 lg:px-8 lg:pt-8">
          <div className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <Activity className="size-3.5" /> Proceso en curso{" "}
                <span className="size-1 rounded-full bg-border" /> SERUMS 2026
              </div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Plazas disponibles</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Explora y prepara tus opciones antes de que llegue tu turno.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileFilters(true)}
              >
                <SlidersHorizontal /> Filtros
              </Button>
              <span className="rounded-md border border-success/25 bg-success-soft px-3 py-2 text-xs font-bold text-success">
                ● {available} libres
              </span>
              <span className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
                {filtered.length} resultados
              </span>
            </div>
          </div>
          {!yourTurn && (
            <div className="mb-6 flex items-start gap-3 border-l-2 border-primary bg-primary-soft px-4 py-3">
              <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-primary">
                <strong>Prepárate para elegir.</strong> Podrás adjudicar una plaza cuando llegue el
                puesto #45. Usa “Avanzar turno” para probar el flujo.
              </p>
            </div>
          )}
          {yourTurn && !awarded && (
            <div className="mb-6 flex items-start gap-3 border-l-2 border-success bg-success-soft px-4 py-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <p className="text-xs font-semibold leading-relaxed text-success">
                ¡Es tu turno! Ya puedes seleccionar una plaza disponible y completar la simulación.
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((v) => (
              <article
                key={v.id}
                className={cn(
                  "relative flex min-h-[264px] flex-col rounded-md border bg-card p-5 transition-shadow hover:shadow-md",
                  v.status === "available"
                    ? "border-success/40"
                    : v.status === "reviewing"
                      ? "border-warning/60"
                      : "border-danger/30 opacity-70",
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "rounded px-2.5 py-1 text-[10px] font-extrabold uppercase",
                      v.status === "available"
                        ? "bg-success-soft text-success"
                        : v.status === "reviewing"
                          ? "animate-pulse bg-warning-soft text-warning"
                          : "bg-danger-soft text-danger",
                    )}
                  >
                    ●{" "}
                    {v.status === "available"
                      ? "Disponible"
                      : v.status === "reviewing"
                        ? "Revisando"
                        : "Ocupada"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8",
                      favorites.includes(v.id) ? "text-warning" : "text-muted-foreground",
                    )}
                    onClick={() => toggleFavorite(v.id)}
                    aria-label={
                      favorites.includes(v.id)
                        ? `Quitar ${v.name} de favoritos`
                        : `Guardar ${v.name} en favoritos`
                    }
                    title={
                      favorites.includes(v.id) ? "Quitar de favoritos" : "Guardar en favoritos"
                    }
                  >
                    <Star
                      className="size-4"
                      fill={favorites.includes(v.id) ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
                <h3 className="text-lg font-bold leading-snug">
                  {v.name}{" "}
                  <span className="text-sm font-medium text-muted-foreground">({v.level})</span>
                </h3>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  RENAES {v.code}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {v.region} · {v.province}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldPlus className="size-3.5" /> {v.institution}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                    {v.modality}
                  </span>
                  <span className="rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                    {v.quintile}
                  </span>
                </div>
                <div className="mt-auto pt-5">
                  {v.status === "reviewing" && (
                    <p className="mb-2 text-xs font-semibold text-warning">
                      Puesto #{turn} está evaluando esta plaza...
                    </p>
                  )}
                  <Button
                    className={cn(
                      "w-full",
                      v.status === "available" &&
                        yourTurn &&
                        !awarded &&
                        "bg-success text-success-foreground hover:bg-success/90",
                    )}
                    variant={
                      v.status === "available" && yourTurn && !awarded ? "default" : "secondary"
                    }
                    disabled={v.status !== "available" || !yourTurn || Boolean(awarded)}
                    onClick={() => setSelected(v)}
                  >
                    {v.status === "occupied"
                      ? `Adjudicada por puesto #${v.holder}`
                      : v.status === "reviewing"
                        ? "En proceso de elección"
                        : awarded
                          ? "Adjudicación finalizada"
                          : yourTurn
                            ? "Adjudicar plaza"
                            : "Espera tu turno"}
                    {v.status === "available" && yourTurn && !awarded && (
                      <ArrowRight className="size-4" />
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-3 size-8 text-muted-foreground" />
              <h3 className="font-semibold">No encontramos plazas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Prueba con otra búsqueda o cambia los filtros.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
                Limpiar filtros
              </Button>
            </div>
          )}
          <div className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
            <Wifi className="size-4 text-success" />
            <span>Datos simulados para demostración · No conectados a un proceso oficial</span>
          </div>
        </main>
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md rounded-md">
          <DialogHeader>
            <div className="mb-3 grid size-11 place-items-center rounded-md bg-success-soft text-success">
              <FileCheck2 />
            </div>
            <DialogTitle>Confirmar adjudicación</DialogTitle>
            <DialogDescription>
              Revisa los detalles de la plaza antes de continuar.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 border-y border-border py-4 text-sm">
              <p className="text-base font-bold">{selected.name}</p>
              <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                <span>
                  Región
                  <br />
                  <strong className="text-foreground">{selected.region}</strong>
                </span>
                <span>
                  Categoría
                  <br />
                  <strong className="text-foreground">{selected.level}</strong>
                </span>
                <span>
                  Presupuesto
                  <br />
                  <strong className="text-foreground">{selected.institution}</strong>
                </span>
                <span>
                  Modalidad
                  <br />
                  <strong className="text-foreground">{selected.modality}</strong>
                </span>
              </div>
            </div>
          )}
          <div className="border-l-2 border-warning bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
            Esta acción es irreversible y quedará registrada formalmente en un proceso real. Aquí
            solo se simula.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={confirm}
            >
              Confirmar adjudicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(awarded)} onOpenChange={(open) => !open && setAwarded(null)}>
        <DialogContent className="max-w-md rounded-md text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success">
            <Check className="size-9" />
          </div>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl">¡Felicitaciones!</DialogTitle>
            <DialogDescription>
              Has adjudicado con éxito la plaza{" "}
              <strong className="text-foreground">{awarded?.name}</strong> en esta simulación.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            El acta generada es una muestra sin validez oficial.
          </p>
          <Button
            onClick={download}
            className="w-full bg-success text-success-foreground hover:bg-success/90"
          >
            <Download /> Descargar acta digital (PDF con QR)
          </Button>
        </DialogContent>
      </Dialog>
      <Assistant {...(threadId ? { threadId } : {})} />
    </div>
  );
}

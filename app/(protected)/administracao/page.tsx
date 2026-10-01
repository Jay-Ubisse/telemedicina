"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck2,
  Download,
  FileSpreadsheet,
  Info,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";

import { BreakdownBars } from "@/components/dashboard/breakdown-bars";
import {
  PriorityChart,
  StageChart,
  VolumeChart,
} from "@/components/dashboard/clinic-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { FeedbackAlert } from "@/components/layout/feedback-alert";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { initialsOf } from "@/components/layout/nav-items";
import { useSession } from "@/components/layout/session-provider";
import {
  NeighbourhoodField,
  resolveNeighbourhood,
  splitNeighbourhood,
} from "@/components/forms/neighbourhood-field";
import { AvailabilityBadge } from "@/components/telemedicine/availability-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedback } from "@/lib/hooks/use-feedback";
import { useClinicStore } from "@/lib/store/clinic-store";
import { useAvailability, usePediatricians } from "@/lib/store/selectors";
import type { ConsultationChannel } from "@/lib/types/consultation";
import {
  channelLabels,
  priorityLabels,
  statusLabels,
} from "@/lib/types/consultation";
import type { AccountState, Shift, User, UserRole } from "@/lib/types/user";
import {
  accountStateLabels,
  roleLabels,
  shiftLabels,
  shortRoleLabels,
  shortShiftLabels,
} from "@/lib/types/user";
import { rankDoctorsByAvailability } from "@/lib/utils/availability";
import { getChannelBreakdown, getMetrics } from "@/lib/utils/consultations";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { downloadExcel, toExcelWorkbook, type Sheet } from "@/lib/utils/excel";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  specialty: string;
  licenseNumber: string;
  shift: Shift | "";
  available: boolean;
  address: string;
  addressOther: string;
};

const channelBarColors: Record<ConsultationChannel, string> = {
  VIDEO: "bg-primary",
  AUDIO: "bg-accent",
  TEXTO: "bg-success",
};

const emptyUserForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "PEDIATRA",
  phone: "",
  specialty: "",
  licenseNumber: "",
  shift: "",
  available: true,
  address: "",
  addressOther: "",
};

/** Especialidades sugeridas para a escala de pediatria do HGM. */
const specialtySuggestions = [
  "Pediatria Geral",
  "Pediatria e Neonatologia",
  "Urgência pediátrica",
  "Seguimento de casos não urgentes",
  "Enfermagem pediátrica · triagem",
];

const assignableStates: AccountState[] = ["ACTIVA", "INACTIVA", "BLOQUEADA"];

/**
 * Administração.
 *
 * Inclui a activação das contas provisórias criadas por pedidos USSD (§11 do
 * relatório): é uma operação própria, que cria de facto as credenciais e mantém os
 * pedidos associados ao encarregado — não bastava alterar o email e a
 * palavra-passe, como o protótipo testado mostrava.
 */
export default function AdministracaoPage() {
  const user = useSession();

  const users = useClinicStore((state) => state.users);
  const children = useClinicStore((state) => state.children);
  const consultations = useClinicStore((state) => state.consultations);
  const createUser = useClinicStore((state) => state.createUser);
  const updateUser = useClinicStore((state) => state.updateUser);
  const setUserState = useClinicStore((state) => state.setUserState);
  const removeUser = useClinicStore((state) => state.removeUser);
  const activateProvisionalAccount = useClinicStore(
    (state) => state.activateProvisionalAccount,
  );

  const pediatricians = usePediatricians();
  const availability = useAvailability();

  const { feedback, report, showOk } = useFeedback();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [error, setError] = useState<string | null>(null);

  // Activação de conta provisória
  const [activateTarget, setActivateTarget] = useState<User | null>(null);
  const [activateForm, setActivateForm] = useState({
    email: "",
    password: "",
    name: "",
    idDocument: "",
  });
  const [activateError, setActivateError] = useState<string | null>(null);

  const allPediatricians = useMemo(
    () => users.filter((item) => item.role === "PEDIATRA"),
    [users],
  );
  const provisionalAccounts = useMemo(
    () => users.filter((item) => item.state === "PROVISORIA"),
    [users],
  );

  const metrics = useMemo(() => getMetrics(consultations), [consultations]);
  const ranked = useMemo(
    () => rankDoctorsByAvailability(pediatricians, availability),
    [pediatricians, availability],
  );

  const channelBreakdown = useMemo(
    () =>
      getChannelBreakdown(consultations).map((entry) => ({
        key: entry.channel,
        label: channelLabels[entry.channel],
        total: entry.total,
        colorClassName: channelBarColors[entry.channel],
      })),
    [consultations],
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        roleLabels[item.role].toLowerCase().includes(term),
    );
  }, [users, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyUserForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(target: User) {
    const address = splitNeighbourhood(target.address);
    setEditing(target);
    setForm({
      name: target.name,
      email: target.email,
      password: target.password,
      role: target.role,
      phone: target.phone,
      specialty: target.specialty ?? "",
      licenseNumber: target.licenseNumber ?? "",
      shift: target.shift ?? "",
      available: target.available ?? true,
      address: address.value,
      addressOther: address.customValue,
    });
    setError(null);
    setDialogOpen(true);
  }

  function openActivate(target: User) {
    setActivateTarget(target);
    setActivateForm({
      email: "",
      password: "",
      name: target.name,
      idDocument: target.idDocument ?? "",
    });
    setActivateError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Validação explícita antes de chegar à store: mensagens por campo e não
    // apenas um aviso genérico no fim.
    if (form.name.trim().length < 3) {
      setError("Indique o nome completo do utilizador.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Indique um email válido (ex.: nome@hgm.mz).");
      return;
    }
    if (form.password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 9) {
      setError("Indique um número de telefone válido (9 dígitos).");
      return;
    }
    if (form.role === "PEDIATRA") {
      if (!form.specialty.trim()) {
        setError("Indique a especialidade do pediatra.");
        return;
      }
      if (!form.licenseNumber.trim()) {
        setError("Indique o número da Ordem dos Médicos.");
        return;
      }
      if (!form.shift) {
        setError("Seleccione o turno de escala do pediatra.");
        return;
      }
    }

    const address = resolveNeighbourhood(form.address, form.addressOther);

    const result = editing
      ? updateUser(editing.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone.trim(),
          specialty: form.specialty.trim() || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
          shift: form.role === "PEDIATRA" ? (form.shift as Shift) : undefined,
          available: form.role === "PEDIATRA" ? form.available : undefined,
          address: address || undefined,
        })
      : createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone,
          specialty: form.specialty,
          licenseNumber: form.licenseNumber,
          shift: form.role === "PEDIATRA" ? (form.shift as Shift) : undefined,
          available: form.available,
          address,
        });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    showOk(
      editing
        ? `Utilizador ${form.name} actualizado.`
        : `Utilizador ${form.name} criado com sucesso.`,
    );
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyUserForm);
  }

  function handleActivate(event: React.FormEvent) {
    event.preventDefault();
    if (!activateTarget) return;

    const result = activateProvisionalAccount(activateTarget.id, activateForm);

    if (!result.ok) {
      setActivateError(result.error);
      return;
    }

    setActivateTarget(null);
    setActivateError(null);
    showOk(
      `Conta de ${result.data.name} activada. As credenciais definidas já permitem iniciar sessão e os pedidos USSD continuam associados a este encarregado.`,
    );
  }

  /**
   * Linhas usadas tanto no CSV como no livro Excel — uma só definição das colunas
   * evita que os dois ficheiros divirjam.
   */
  const consultationRows = useMemo(
    () =>
      consultations.map((item) => ({
        Referencia: item.reference,
        Crianca: item.childName,
        Idade: item.childAgeYears,
        Encarregado: item.guardianName,
        Telefone: item.phone,
        Bairro: item.location,
        Sintomas: [...item.symptoms, item.otherSymptom].filter(Boolean).join(" | "),
        Canal: channelLabels[item.channel],
        Prioridade: priorityLabels[item.priority],
        Estado: statusLabels[item.status],
        Origem: item.source,
        Submetido: formatDateTime(item.createdAt),
        Triagem: item.triageProfessionalName ?? "",
        TriadoEm: item.triagedAt ? formatDateTime(item.triagedAt) : "",
        Pediatra: item.assignedDoctorName ?? "",
        Agendado: item.scheduledAt ? formatDateTime(item.scheduledAt) : "",
        DuracaoMin: item.durationMinutes ?? "",
        Prescricoes: item.prescriptions.length,
      })),
    [consultations],
  );

  const userRows = useMemo(
    () =>
      users.map((item) => ({
        Nome: item.name,
        Email: item.email,
        Perfil: roleLabels[item.role],
        Telefone: item.phone,
        Especialidade: item.specialty ?? "",
        Ordem: item.licenseNumber ?? "",
        Turno: item.shift ? shiftLabels[item.shift] : "",
        Disponivel:
          item.role === "PEDIATRA" ? (item.available ? "Sim" : "Não") : "",
        Estado: accountStateLabels[item.state],
        Criado: formatDate(item.createdAt),
      })),
    [users],
  );

  const availabilityRows = useMemo(
    () =>
      availability.map((entry) => ({
        Pediatra: entry.doctorName,
        Dia: entry.date,
        Inicio: entry.startTime,
        Fim: entry.endTime,
        DuracaoMin: entry.durationMinutes,
        Modalidade: channelLabels[entry.modality],
        Tipo: entry.kind,
        Estado: entry.state,
        Observacoes: entry.notes,
      })),
    [availability],
  );

  function exportConsultationsCsv() {
    downloadCsv(
      `hgm-teleconsultas-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(consultationRows),
    );
    showOk(`Exportados ${consultationRows.length} pedidos para CSV.`);
  }

  function exportUsers() {
    downloadCsv(
      `hgm-utilizadores-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(userRows),
    );
    showOk(`Exportados ${userRows.length} utilizadores para CSV.`);
  }

  /** Livro Excel: resumo, pedidos, utilizadores e disponibilidade. */
  function exportWorkbook() {
    const today = new Date();

    const summary: Sheet = {
      name: "Resumo",
      notes: [
        "Hospital Geral de Mavalane — Telepediatria",
        `Relatório gerado em ${formatDateTime(today.toISOString())}`,
        "Dados de demonstração do protótipo académico.",
      ],
      columns: [{ header: "Indicador", width: 240 }, { header: "Valor", width: 90 }],
      rows: [
        ["Total de pedidos", consultations.length],
        ["Aguardando triagem", metrics.awaitingTriage],
        ["Triados, por atribuir", metrics.awaitingAssignment],
        ["Atribuídos, por agendar", metrics.awaitingScheduling],
        ["Consultas agendadas", metrics.scheduled],
        ["Consultas em curso", metrics.inProgress],
        ["Consultas concluídas", metrics.completed],
        ["Encaminhados para presencial", metrics.referred],
        ["Cancelados", metrics.cancelled],
        ["Pedidos submetidos por USSD", metrics.fromUssd],
        ["Pedidos por videochamada", metrics.video],
        ["Pedidos por áudio", metrics.audio],
        ["Pedidos por texto", metrics.text],
        ["Pedidos com prescrição registada", metrics.withPrescription],
        ["Utilizadores registados", users.length],
        ["Contas activas", users.filter((item) => item.state === "ACTIVA").length],
        ["Contas provisórias (USSD)", provisionalAccounts.length],
        ["Pediatras na escala", allPediatricians.length],
        ["Profissionais de triagem", users.filter((item) => item.role === "TRIAGEM").length],
        ["Crianças registadas", children.length],
      ],
    };

    const consultationsSheet: Sheet = {
      name: "Pedidos",
      columns: [
        { header: "Referência", width: 80 },
        { header: "Criança", width: 150 },
        { header: "Idade", width: 50 },
        { header: "Encarregado", width: 150 },
        { header: "Telefone", width: 120 },
        { header: "Bairro", width: 120 },
        { header: "Sintomas", width: 220 },
        { header: "Canal", width: 120 },
        { header: "Prioridade", width: 100 },
        { header: "Estado", width: 190 },
        { header: "Origem", width: 60 },
        { header: "Submetido", width: 130 },
        { header: "Triagem", width: 140 },
        { header: "Triado em", width: 130 },
        { header: "Pediatra", width: 150 },
        { header: "Agendado", width: 130 },
        { header: "Duração (min)", width: 90 },
        { header: "Prescrições", width: 80 },
      ],
      rows: consultationRows.map((row) => Object.values(row)),
    };

    const usersSheet: Sheet = {
      name: "Utilizadores",
      columns: [
        { header: "Nome", width: 160 },
        { header: "Email", width: 180 },
        { header: "Perfil", width: 150 },
        { header: "Telefone", width: 120 },
        { header: "Especialidade", width: 180 },
        { header: "Nº da Ordem", width: 90 },
        { header: "Turno", width: 130 },
        { header: "Disponível", width: 80 },
        { header: "Estado", width: 120 },
        { header: "Registado", width: 100 },
      ],
      rows: userRows.map((row) => Object.values(row)),
    };

    const availabilitySheet: Sheet = {
      name: "Disponibilidade",
      columns: [
        { header: "Pediatra", width: 160 },
        { header: "Dia", width: 90 },
        { header: "Início", width: 70 },
        { header: "Fim", width: 70 },
        { header: "Duração (min)", width: 90 },
        { header: "Modalidade", width: 130 },
        { header: "Tipo", width: 110 },
        { header: "Estado", width: 90 },
        { header: "Observações", width: 240 },
      ],
      rows: availabilityRows.map((row) => Object.values(row)),
    };

    downloadExcel(
      `hgm-relatorio-${today.toISOString().slice(0, 10)}.xls`,
      toExcelWorkbook([summary, consultationsSheet, usersSheet, availabilitySheet]),
    );
    showOk(
      "Relatório Excel exportado com as folhas Resumo, Pedidos, Utilizadores e Disponibilidade.",
    );
  }

  return (
    <>
      <AppHeader
        user={user}
        title="Administração"
        subtitle="Gestão de utilizadores, contas provisórias e relatórios institucionais."
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">Novo utilizador</span>
          </Button>
        }
      />

      <PageShell>
        <FeedbackAlert feedback={feedback} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Utilizadores"
            value={users.length}
            icon={Users}
            tone="primary"
            hint={`${users.filter((item) => item.state === "ACTIVA").length} com acesso activo`}
          />
          <StatCard
            label="Contas provisórias"
            value={provisionalAccounts.length}
            icon={KeyRound}
            tone={provisionalAccounts.length > 0 ? "warning" : "default"}
            hint="Criadas por pedidos USSD"
          />
          <StatCard
            label="Pedidos via USSD"
            value={metrics.fromUssd}
            icon={Smartphone}
          />
          <StatCard
            label="Crianças registadas"
            value={children.length}
            icon={ShieldCheck}
            tone="success"
          />
        </section>

        {/* Contas provisórias do USSD — activação (§11) */}
        {provisionalAccounts.length > 0 ? (
          <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-bold tracking-tight">
                Contas provisórias do Simulador USSD
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Contas criadas automaticamente a partir de pedidos USSD de números
                ainda não registados. Não iniciam sessão: precisam de ser activadas
                com email e palavra-passe definitivos.
              </p>
            </div>

            <ul className="divide-y divide-border">
              {provisionalAccounts.map((item) => {
                const requests = consultations.filter(
                  (entry) => entry.guardianId === item.id,
                );

                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.phone} ·{" "}
                        {requests.length === 1
                          ? "1 pedido associado"
                          : `${requests.length} pedidos associados`}
                        {requests.length > 0
                          ? ` (${requests.map((entry) => entry.reference).join(", ")})`
                          : ""}
                      </p>
                    </div>

                    <Button size="sm" onClick={() => openActivate(item)}>
                      <KeyRound data-icon="inline-start" />
                      Activar conta
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <Tabs defaultValue="utilizadores">
          <TabsList>
            <TabsTrigger value="utilizadores">
              <Users />
              Utilizadores
            </TabsTrigger>
            <TabsTrigger value="escala">
              <CalendarCheck2 />
              Escala
            </TabsTrigger>
            <TabsTrigger value="relatorios">
              <Activity />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* --- Utilizadores --- */}
          <TabsContent value="utilizadores" className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar por nome, email ou perfil"
                  aria-label="Pesquisar utilizadores"
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              <Button variant="outline" size="lg" onClick={exportUsers}>
                <Download data-icon="inline-start" />
                Exportar CSV
              </Button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <EmptyState
                  icon={<Users className="size-5" />}
                  title="Nenhum utilizador encontrado"
                  description="Ajuste a pesquisa ou crie um novo utilizador."
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
                <div className="overflow-x-auto">
                  <TooltipProvider>
                    <Table className="min-w-[980px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilizador</TableHead>
                          <TableHead>Perfil</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Registado</TableHead>
                          <TableHead>Estado da conta</TableHead>
                          <TableHead className="w-44 text-right">Acções</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredUsers.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                                  {initialsOf(item.name)}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{item.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {item.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="ghost"
                                className="h-6 px-2 text-[0.6875rem] font-semibold ring-1 ring-border"
                              >
                                {shortRoleLabels[item.role]}
                              </Badge>
                              {item.specialty ? (
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {item.specialty}
                                </span>
                              ) : null}
                              {item.shift ? (
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {shortShiftLabels[item.shift]} ·{" "}
                                  {item.available
                                    ? "disponível no turno"
                                    : "indisponível no turno"}
                                </span>
                              ) : null}
                            </TableCell>

                            <TableCell className="text-muted-foreground">
                              {item.phone}
                            </TableCell>

                            <TableCell className="text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </TableCell>

                            <TableCell>
                              <AccountStateCell
                                state={item.state}
                                disabled={item.id === user.id}
                                onChange={(next) =>
                                  report(
                                    setUserState(item.id, next),
                                    `${item.name}: conta ${accountStateLabels[next].toLowerCase()}.`,
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <div className="flex justify-end gap-1.5">
                                {item.state === "PROVISORIA" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => openActivate(item)}
                                  >
                                    <KeyRound data-icon="inline-start" />
                                    Activar
                                  </Button>
                                ) : null}

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon-sm"
                                      aria-label={`Editar ${item.name}`}
                                      onClick={() => openEdit(item)}
                                    >
                                      <Pencil />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar utilizador</TooltipContent>
                                </Tooltip>

                                {/*
                                  Eliminação só para contas sem qualquer
                                  actividade: a store recusa apagar quem tem
                                  pedidos, crianças ou consultas registadas.
                                */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon-sm"
                                      aria-label={`Eliminar ${item.name}`}
                                      disabled={item.id === user.id}
                                      onClick={() =>
                                        report(
                                          removeUser(item.id),
                                          `${item.name} foi eliminado do sistema.`,
                                        )
                                      }
                                    >
                                      <Trash2 />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Eliminar (só contas sem actividade)
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </TabsContent>

          {/* --- Escala --- */}
          <TabsContent value="escala" className="mt-5 space-y-4">
            <Alert variant="info">
              <Info />
              <AlertTitle>Disponibilidade no momento</AlertTitle>
              <AlertDescription>
                Um pediatra só consta como disponível dentro do turno registado ou
                com uma disponibilidade adicional em vigor. Fora disso, o estado
                indica se está fora do turno, indisponível ou ausente.
              </AlertDescription>
            </Alert>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-bold tracking-tight">Escala de pediatras</h2>
                <p className="text-sm text-muted-foreground">
                  {ranked.filter((entry) => entry.available).length} de{" "}
                  {ranked.length} disponíveis neste momento
                </p>
              </div>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {ranked.map((entry) => (
                  <li
                    key={entry.doctor.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {entry.doctor.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {entry.doctor.specialty ?? "Especialidade por definir"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <AvailabilityBadge status={entry.status} />
                    </div>

                    <dl className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Turno</dt>
                        <dd className="font-medium">
                          {entry.doctor.shift
                            ? shiftLabels[entry.doctor.shift]
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Ordem</dt>
                        <dd className="font-medium">
                          {entry.doctor.licenseNumber ?? "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Janelas hoje</dt>
                        <dd className="font-medium tabular-nums">
                          {
                            availability.filter(
                              (slot) =>
                                slot.doctorId === entry.doctor.id &&
                                slot.state === "ACTIVA",
                            ).length
                          }
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          </TabsContent>

          {/* --- Relatórios --- */}
          <TabsContent value="relatorios" className="mt-5 space-y-6">
            <Alert variant="info">
              <Info />
              <AlertTitle>Gráficos de demonstração</AlertTitle>
              <AlertDescription>
                Construídos a partir dos pedidos actualmente registados nesta
                pré-visualização. Actualizam-se sempre que um novo pedido é
                submetido.
              </AlertDescription>
            </Alert>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold tracking-tight">
                    Pedidos nos últimos 7 dias
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Por dia, os urgentes e críticos ao lado dos restantes
                    pedidos.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="lg" onClick={exportWorkbook}>
                    <FileSpreadsheet data-icon="inline-start" />
                    Exportar Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={exportConsultationsCsv}
                  >
                    <Download data-icon="inline-start" />
                    CSV
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <VolumeChart data={consultations} grouped />
              </div>
            </section>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Percurso dos pedidos</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                As fases somam sempre o total de pedidos registados.
              </p>
              <div className="mt-4">
                <StageChart data={consultations} />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <h2 className="font-bold tracking-tight">Pedidos por prioridade</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Classificação atribuída pelos profissionais de triagem.
                </p>
                <div className="mt-4">
                  <PriorityChart data={consultations} />
                </div>
              </div>

              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <h2 className="font-bold tracking-tight">Pedidos por modalidade</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Vídeo, áudio e texto.
                </p>
                <div className="mt-6">
                  <BreakdownBars items={channelBreakdown} />
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </PageShell>

      {/* Criar / editar utilizador */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar utilizador" : "Novo utilizador"}
            </DialogTitle>
            <DialogDescription>
              Os perfis determinam o que cada pessoa vê na plataforma. Nesta
              pré-visualização sem servidor, as contas criadas ficam guardadas neste
              navegador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FeedbackAlert
              feedback={error ? { tone: "error", text: error } : null}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="user-name" className="text-sm font-semibold">
                  Nome completo
                </Label>
                <Input
                  id="user-name"
                  name="user-name"
                  required
                  aria-required="true"
                  minLength={3}
                  value={form.name}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, name: event.target.value }));
                    setError(null);
                  }}
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="user-email" className="text-sm font-semibold">
                  Email
                </Label>
                <Input
                  id="user-email"
                  name="user-email"
                  type="email"
                  autoComplete="off"
                  required
                  aria-required="true"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, email: event.target.value }));
                    setError(null);
                  }}
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="user-password" className="text-sm font-semibold">
                  Palavra-passe
                </Label>
                <Input
                  id="user-password"
                  name="user-password"
                  type="text"
                  autoComplete="off"
                  required
                  aria-required="true"
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                    setError(null);
                  }}
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="user-role" className="text-sm font-semibold">
                  Perfil
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => {
                    setForm((current) => ({ ...current, role: value as UserRole }));
                    setError(null);
                  }}
                >
                  <SelectTrigger id="user-role" className="mt-2 h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      ["ENCARREGADO", "TRIAGEM", "ADMINISTRATIVO", "PEDIATRA"] as UserRole[]
                    ).map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user-phone" className="text-sm font-semibold">
                  Telefone
                </Label>
                <Input
                  id="user-phone"
                  name="user-phone"
                  type="tel"
                  required
                  aria-required="true"
                  placeholder="+258 84 000 0000"
                  value={form.phone}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, phone: event.target.value }));
                    setError(null);
                  }}
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              {form.role === "PEDIATRA" || form.role === "TRIAGEM" ? (
                <div className={form.role === "TRIAGEM" ? "sm:col-span-2" : ""}>
                  <Label htmlFor="user-specialty" className="text-sm font-semibold">
                    Especialidade
                  </Label>
                  <Input
                    id="user-specialty"
                    name="user-specialty"
                    list="especialidades-hgm"
                    required={form.role === "PEDIATRA"}
                    aria-required={form.role === "PEDIATRA"}
                    value={form.specialty}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        specialty: event.target.value,
                      }));
                      setError(null);
                    }}
                    className="mt-2 h-11 rounded-xl px-3.5"
                  />
                  <datalist id="especialidades-hgm">
                    {specialtySuggestions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>
              ) : null}

              {form.role === "PEDIATRA" ? (
                <>
                  <div>
                    <Label htmlFor="user-license" className="text-sm font-semibold">
                      Nº da Ordem
                    </Label>
                    <Input
                      id="user-license"
                      name="user-license"
                      required
                      aria-required="true"
                      placeholder="OM-0000"
                      value={form.licenseNumber}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          licenseNumber: event.target.value,
                        }));
                        setError(null);
                      }}
                      className="mt-2 h-11 rounded-xl px-3.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="user-shift" className="text-sm font-semibold">
                      Turno de escala
                    </Label>
                    <Select
                      value={form.shift}
                      onValueChange={(value) => {
                        setForm((current) => ({ ...current, shift: value as Shift }));
                        setError(null);
                      }}
                    >
                      <SelectTrigger id="user-shift" className="mt-2 h-11 w-full rounded-xl">
                        <SelectValue placeholder="Seleccione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANHA">{shiftLabels.MANHA}</SelectItem>
                        <SelectItem value="TARDE">{shiftLabels.TARDE}</SelectItem>
                        <SelectItem value="NOITE">{shiftLabels.NOITE}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="user-available" className="text-sm font-semibold">
                      Disponibilidade no turno
                    </Label>
                    <Select
                      value={form.available ? "SIM" : "NAO"}
                      onValueChange={(value) => {
                        setForm((current) => ({
                          ...current,
                          available: value === "SIM",
                        }));
                        setError(null);
                      }}
                    >
                      <SelectTrigger
                        id="user-available"
                        className="mt-2 h-11 w-full rounded-xl"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">Disponível no turno</SelectItem>
                        <SelectItem value="NAO">Indisponível no turno</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Fora do turno registado, o pediatra só aparece disponível se
                      tiver uma disponibilidade adicional.
                    </p>
                  </div>
                </>
              ) : null}

              <div className="sm:col-span-2">
                <NeighbourhoodField
                  id="user-address"
                  label="Bairro"
                  required={false}
                  value={form.address}
                  customValue={form.addressOther}
                  onChange={(value) => {
                    setForm((current) => ({ ...current, address: value }));
                    setError(null);
                  }}
                  onCustomChange={(value) => {
                    setForm((current) => ({ ...current, addressOther: value }));
                    setError(null);
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg">
                {editing ? "Guardar alterações" : "Criar utilizador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activar conta provisória (§11) */}
      <Dialog
        open={activateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActivateTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activar conta provisória</DialogTitle>
            <DialogDescription>
              A conta de {activateTarget?.name} foi criada a partir de um pedido
              USSD. Defina o email e a palavra-passe definitivos: as credenciais são
              efectivamente criadas, a conta passa a activa e os pedidos USSD
              continuam associados a este encarregado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleActivate} className="space-y-4">
            <FeedbackAlert
              feedback={activateError ? { tone: "error", text: activateError } : null}
            />

            <div className="grid gap-4">
              <div>
                <Label htmlFor="activate-name" className="text-sm font-semibold">
                  Nome do encarregado
                </Label>
                <Input
                  id="activate-name"
                  value={activateForm.name}
                  onChange={(event) => {
                    setActivateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    setActivateError(null);
                  }}
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="activate-email" className="text-sm font-semibold">
                  Email definitivo
                </Label>
                <Input
                  id="activate-email"
                  type="email"
                  required
                  aria-required="true"
                  value={activateForm.email}
                  onChange={(event) => {
                    setActivateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                    setActivateError(null);
                  }}
                  placeholder="nome@exemplo.mz"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="activate-password" className="text-sm font-semibold">
                  Palavra-passe
                </Label>
                <Input
                  id="activate-password"
                  type="text"
                  required
                  aria-required="true"
                  minLength={6}
                  value={activateForm.password}
                  onChange={(event) => {
                    setActivateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                    setActivateError(null);
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="activate-document" className="text-sm font-semibold">
                  Documento de identificação{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="activate-document"
                  value={activateForm.idDocument}
                  onChange={(event) => {
                    setActivateForm((current) => ({
                      ...current,
                      idDocument: event.target.value,
                    }));
                    setActivateError(null);
                  }}
                  placeholder="BI / DIRE / Passaporte"
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setActivateTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg">
                <KeyRound data-icon="inline-start" />
                Activar conta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Estado da conta. Uma conta provisória não pode ser activada por aqui: tem de
 * passar pela activação com credenciais definitivas.
 */
function AccountStateCell({
  state,
  disabled,
  onChange,
}: {
  state: AccountState;
  disabled: boolean;
  onChange: (state: AccountState) => void;
}) {
  if (state === "PROVISORIA") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
        <span className="size-1.5 rounded-full bg-warning" />
        {accountStateLabels.PROVISORIA}
      </span>
    );
  }

  return (
    <Select
      value={state}
      disabled={disabled}
      onValueChange={(value) => onChange(value as AccountState)}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-36 rounded-lg text-xs",
          state === "ACTIVA" ? "text-success" : "text-muted-foreground",
        )}
        aria-label="Estado da conta"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {assignableStates.map((option) => (
          <SelectItem key={option} value={option}>
            {accountStateLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

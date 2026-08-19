"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Pencil,
  Plus,
  Search,
  ShieldOff,
  ShieldCheck,
  Users,
  Video,
  Smartphone,
  Activity,
  CalendarCheck2,
  FileSpreadsheet,
  Inbox,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { BreakdownBars } from "@/components/dashboard/breakdown-bars";
import {
  PriorityChart,
  StageChart,
  VolumeChart,
} from "@/components/dashboard/clinic-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { initialsOf } from "@/components/layout/nav-items";
import { useSession } from "@/components/layout/session-provider";
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
import { useClinicStore } from "@/lib/store/clinic-store";
import type { ConsultationChannel } from "@/lib/types/consultation";
import {
  channelLabels,
  priorityLabels,
  statusLabels,
} from "@/lib/types/consultation";
import type { Shift, User, UserRole } from "@/lib/types/user";
import {
  roleLabels,
  shiftLabels,
  shortRoleLabels,
  shortShiftLabels,
} from "@/lib/types/user";
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
};

const channelBarColors: Record<ConsultationChannel, string> = {
  VIDEO: "bg-primary",
  VOZ: "bg-accent",
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
};

/** Especialidades sugeridas para a escala de pediatria do HGM. */
const specialtySuggestions = [
  "Pediatria Geral",
  "Pediatria e Neonatologia",
  "Urgência / Triagem Pediátrica",
  "Seguimento de casos não urgentes",
];

export default function AdministracaoPage() {
  const user = useSession();

  const users = useClinicStore((state) => state.users);
  const children = useClinicStore((state) => state.children);
  const consultations = useClinicStore((state) => state.consultations);
  const createUser = useClinicStore((state) => state.createUser);
  const updateUser = useClinicStore((state) => state.updateUser);
  const setUserActive = useClinicStore((state) => state.setUserActive);
  const removeUser = useClinicStore((state) => state.removeUser);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const pediatricians = useMemo(
    () => users.filter((item) => item.role === "PEDIATRA"),
    [users],
  );

  const metrics = useMemo(() => getMetrics(consultations), [consultations]);

  // Os gráficos derivam dos pedidos reais, por isso actualizam-se sozinhos
  // sempre que a lista de consultas muda.
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
      address: target.address ?? "",
    });
    setError(null);
    setDialogOpen(true);
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
          address: form.address.trim() || undefined,
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
          address: form.address,
        });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setFeedback(
      editing
        ? `Utilizador ${form.name} actualizado.`
        : `Utilizador ${form.name} criado com sucesso.`,
    );
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyUserForm);
  }

  /**
   * Linhas usadas tanto no CSV como no livro Excel — uma só definição das
   * colunas evita que os dois ficheiros divirjam.
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
        Agendado: item.scheduledAt ? formatDateTime(item.scheduledAt) : "",
        Pediatra: item.assignedDoctorName ?? "",
        Orientacao: item.guidance,
        Encaminhamento: item.referralReason,
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
        Estado: item.active ? "Activo" : "Inactivo",
        Criado: formatDate(item.createdAt),
      })),
    [users],
  );

  function exportConsultationsCsv() {
    downloadCsv(
      `hgm-teleconsultas-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(consultationRows),
    );
    setFeedback(`Exportadas ${consultationRows.length} teleconsultas para CSV.`);
  }

  function exportUsers() {
    downloadCsv(
      `hgm-utilizadores-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(userRows),
    );
    setFeedback(`Exportados ${userRows.length} utilizadores para CSV.`);
  }

  /** Livro Excel com três folhas: resumo, teleconsultas e utilizadores. */
  function exportWorkbook() {
    const today = new Date();

    const summary: Sheet = {
      name: "Resumo",
      notes: [
        "Hospital Geral de Mavalane — Telepediatria",
        `Relatório gerado em ${formatDateTime(today.toISOString())}`,
        "Dados de demonstração do protótipo.",
      ],
      columns: [{ header: "Indicador", width: 220 }, { header: "Valor", width: 90 }],
      rows: [
        ["Total de pedidos", consultations.length],
        ["Pendentes", metrics.pending],
        ["Agendadas", metrics.scheduled],
        ["Em curso", metrics.inProgress],
        ["Concluídas", metrics.completed],
        ["Encaminhadas", metrics.referred],
        ["Pedidos submetidos por USSD", metrics.fromUssd],
        ["Teleconsultas por videochamada", metrics.video],
        ["Utilizadores registados", users.length],
        ["Utilizadores activos", users.filter((item) => item.active).length],
        ["Pediatras na escala", pediatricians.length],
        ["Crianças registadas", children.length],
      ],
    };

    const consultationsSheet: Sheet = {
      name: "Teleconsultas",
      columns: [
        { header: "Referência", width: 80 },
        { header: "Criança", width: 150 },
        { header: "Idade", width: 50 },
        { header: "Encarregado", width: 150 },
        { header: "Telefone", width: 120 },
        { header: "Bairro", width: 120 },
        { header: "Sintomas", width: 220 },
        { header: "Canal", width: 110 },
        { header: "Prioridade", width: 110 },
        { header: "Estado", width: 100 },
        { header: "Origem", width: 60 },
        { header: "Submetido", width: 130 },
        { header: "Agendado", width: 130 },
        { header: "Pediatra", width: 150 },
        { header: "Orientação", width: 260 },
        { header: "Encaminhamento", width: 260 },
      ],
      rows: consultationRows.map((row) => Object.values(row)),
    };

    const usersSheet: Sheet = {
      name: "Utilizadores",
      columns: [
        { header: "Nome", width: 160 },
        { header: "Email", width: 180 },
        { header: "Perfil", width: 140 },
        { header: "Telefone", width: 120 },
        { header: "Especialidade", width: 180 },
        { header: "Nº da Ordem", width: 90 },
        { header: "Turno", width: 130 },
        { header: "Disponível", width: 80 },
        { header: "Estado", width: 80 },
        { header: "Registado", width: 100 },
      ],
      rows: userRows.map((row) => Object.values(row)),
    };

    downloadExcel(
      `hgm-relatorio-${today.toISOString().slice(0, 10)}.xls`,
      toExcelWorkbook([summary, consultationsSheet, usersSheet]),
    );
    setFeedback(
      "Relatório Excel exportado com as folhas Resumo, Teleconsultas e Utilizadores.",
    );
  }

  function handleRemoveUser(target: User) {
    const result = removeUser(target.id);
    if (!result.ok) {
      setFeedback(null);
      setPageError(result.error);
      return;
    }
    setPageError(null);
    setFeedback(`${target.name} foi eliminado do sistema.`);
  }

  return (
    <>
      <AppHeader
        user={user}
        title="Administração"
        subtitle="Gestão de utilizadores e relatórios institucionais."
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">Novo utilizador</span>
          </Button>
        }
      />

      <PageShell>
        {feedback ? (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        ) : null}

        {pageError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Operação não permitida</AlertTitle>
            <AlertDescription>{pageError}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Utilizadores"
            value={users.length}
            icon={Users}
            tone="primary"
            hint={`${users.filter((item) => item.active).length} activos`}
          />
          <StatCard
            label="Crianças registadas"
            value={children.length}
            icon={ShieldCheck}
            tone="success"
          />
          <StatCard
            label="Pedidos via USSD"
            value={metrics.fromUssd}
            icon={Smartphone}
          />
          <StatCard
            label="Videochamadas"
            value={metrics.video}
            icon={Video}
            tone="primary"
          />
        </section>

        <Tabs defaultValue="utilizadores">
          <TabsList>
            <TabsTrigger value="utilizadores">
              <Users />
              Gestão de utilizadores
            </TabsTrigger>
            <TabsTrigger value="relatorios">
              <Activity />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* --- Utilizadores --- */}
          <TabsContent value="utilizadores" className="mt-5 space-y-4">
            {/*
              Escala de pediatria: especialidade, turno e disponibilidade. Os
              turnos estão distribuídos — nunca aparecem todos disponíveis ao
              mesmo tempo.
            */}
            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-bold tracking-tight">Escala de pediatras</h2>
                <p className="text-sm text-muted-foreground">
                  {pediatricians.filter((item) => item.available && item.active).length}{" "}
                  de {pediatricians.length} disponíveis neste momento
                </p>
              </div>

              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {pediatricians.map((doctor) => (
                  <li
                    key={doctor.id}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <Stethoscope className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {doctor.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {doctor.specialty ?? "Especialidade por definir"}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Turno</dt>
                        <dd className="font-medium">
                          {doctor.shift ? shiftLabels[doctor.shift] : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Disponibilidade</dt>
                        <dd
                          className={cn(
                            "font-semibold",
                            doctor.active && doctor.available
                              ? "text-success"
                              : "text-muted-foreground",
                          )}
                        >
                          {!doctor.active
                            ? "Conta inactiva"
                            : doctor.available
                              ? "Disponível"
                              : "Fora de turno"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Ordem</dt>
                        <dd className="font-medium">
                          {doctor.licenseNumber ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>

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
                  <Table className="min-w-[860px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilizador</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Registado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-32 text-right">Acções</TableHead>
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
                                {item.available ? "disponível" : "fora de turno"}
                              </span>
                            ) : null}
                            {item.provisional ? (
                              <span className="mt-0.5 block text-xs text-warning-foreground">
                                Conta provisória (pedido USSD)
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
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-semibold",
                                item.active ? "text-success" : "text-muted-foreground",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  item.active ? "bg-success" : "bg-muted-foreground",
                                )}
                              />
                              {item.active ? "Activo" : "Inactivo"}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-1.5">
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

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={item.active ? "destructive" : "outline"}
                                    size="icon-sm"
                                    aria-label={
                                      item.active
                                        ? `Desactivar ${item.name}`
                                        : `Activar ${item.name}`
                                    }
                                    disabled={item.id === user.id}
                                    onClick={() => {
                                      setUserActive(item.id, !item.active);
                                      setFeedback(
                                        `${item.name} ${item.active ? "desactivado" : "activado"}.`,
                                      );
                                    }}
                                  >
                                    {item.active ? <ShieldOff /> : <ShieldCheck />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {item.active ? "Desactivar utilizador" : "Activar utilizador"}
                                </TooltipContent>
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
                                    onClick={() => handleRemoveUser(item)}
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

          {/* --- Relatórios --- */}
          <TabsContent value="relatorios" className="mt-5 space-y-6">
            <Alert variant="info">
              <Info />
              <AlertTitle>Gráficos de demonstração</AlertTitle>
              <AlertDescription>
                Construídos a partir dos pedidos actualmente registados nesta
                pré-visualização. Em produção, actualizam-se automaticamente
                sempre que um novo pedido é submetido.
              </AlertDescription>
            </Alert>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold tracking-tight">
                    Consultas nos últimos 7 dias
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Calculado a partir dos pedidos registados — actualiza sempre
                    que entra um novo pedido.
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
                <VolumeChart data={consultations} />
              </div>
            </section>

            {/*
              Cinco estados, cinco cartões: no protótipo testado faltava "Em
              curso" e os totais apresentados somavam menos um pedido do que os
              que existiam de facto.
            */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Pendentes" value={metrics.pending} icon={Inbox} tone="warning" />
              <StatCard label="Agendadas" value={metrics.scheduled} icon={CalendarCheck2} tone="primary" />
              <StatCard label="Em curso" value={metrics.inProgress} icon={Activity} tone="success" />
              <StatCard label="Concluídas" value={metrics.completed} icon={CheckCircle2} tone="success" />
              <StatCard label="Encaminhadas" value={metrics.referred} icon={ShieldOff} tone="danger" />
            </section>

            <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
              <h2 className="font-bold tracking-tight">Percurso dos pedidos</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Os cinco estados somam sempre o total de pedidos registados.
              </p>
              <div className="mt-4">
                <StageChart data={consultations} />
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <h2 className="font-bold tracking-tight">Pedidos por prioridade</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Classificação atribuída pela triagem automática.
                </p>
                <div className="mt-4">
                  <PriorityChart data={consultations} />
                </div>
              </div>

              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <h2 className="font-bold tracking-tight">Pedidos por canal</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Videochamada vs. chamada de voz.
                </p>
                <div className="mt-6">
                  <BreakdownBars items={channelBreakdown} />
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </PageShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar utilizador" : "Novo utilizador"}
            </DialogTitle>
            <DialogDescription>
              Os perfis determinam o que cada pessoa vê na plataforma. Nesta
              pré-visualização sem servidor, as contas criadas ficam guardadas
              neste navegador — noutro computador ou numa janela anónima, o
              início de sessão não as encontra.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

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
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
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
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
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
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              <div>
                <Label htmlFor="user-role" className="text-sm font-semibold">
                  Perfil
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, role: value as UserRole }))
                  }
                >
                  <SelectTrigger id="user-role" className="mt-2 h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENCARREGADO">
                      {roleLabels.ENCARREGADO}
                    </SelectItem>
                    <SelectItem value="PEDIATRA">{roleLabels.PEDIATRA}</SelectItem>
                    <SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem>
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
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="mt-2 h-11 rounded-xl px-3.5"
                />
              </div>

              {form.role === "PEDIATRA" ? (
                <>
                  <div>
                    <Label htmlFor="user-specialty" className="text-sm font-semibold">
                      Especialidade
                    </Label>
                    <Input
                      id="user-specialty"
                      name="user-specialty"
                      list="especialidades-hgm"
                      required
                      aria-required="true"
                      value={form.specialty}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specialty: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-xl px-3.5"
                    />
                    <datalist id="especialidades-hgm">
                      {specialtySuggestions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </div>

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
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          licenseNumber: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-xl px-3.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="user-shift" className="text-sm font-semibold">
                      Turno de escala
                    </Label>
                    <Select
                      value={form.shift}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          shift: value as Shift,
                        }))
                      }
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
                      Disponibilidade
                    </Label>
                    <Select
                      value={form.available ? "SIM" : "NAO"}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          available: value === "SIM",
                        }))
                      }
                    >
                      <SelectTrigger id="user-available" className="mt-2 h-11 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SIM">Disponível no turno</SelectItem>
                        <SelectItem value="NAO">Fora de turno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
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
    </>
  );
}

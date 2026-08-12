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
} from "lucide-react";

import { BreakdownBars } from "@/components/dashboard/breakdown-bars";
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
import type { ConsultationChannel, ConsultationPriority } from "@/lib/types/consultation";
import {
  channelLabels,
  priorityLabels,
  statusLabels,
} from "@/lib/types/consultation";
import type { User, UserRole } from "@/lib/types/user";
import { roleLabels, shortRoleLabels } from "@/lib/types/user";
import {
  getChannelBreakdown,
  getDailyVolume,
  getMetrics,
  getPriorityBreakdown,
} from "@/lib/utils/consultations";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
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
  address: string;
};

const priorityBarColors: Record<ConsultationPriority, string> = {
  CRITICA: "bg-destructive",
  URGENTE: "bg-warning",
  AVALIACAO: "bg-primary",
  NORMAL: "bg-success",
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
  address: "",
};

export default function AdministracaoPage() {
  const user = useSession();

  const users = useClinicStore((state) => state.users);
  const children = useClinicStore((state) => state.children);
  const consultations = useClinicStore((state) => state.consultations);
  const createUser = useClinicStore((state) => state.createUser);
  const updateUser = useClinicStore((state) => state.updateUser);
  const setUserActive = useClinicStore((state) => state.setUserActive);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const metrics = useMemo(() => getMetrics(consultations), [consultations]);
  // Os gráficos são derivados dos pedidos reais, por isso actualizam-se sozinhos
  // sempre que a lista de consultas muda.
  const volume = useMemo(() => getDailyVolume(consultations, 7), [consultations]);
  const maxVolume = Math.max(...volume.map((entry) => entry.total), 1);

  const priorityBreakdown = useMemo(
    () =>
      getPriorityBreakdown(consultations).map((entry) => ({
        key: entry.priority,
        label: priorityLabels[entry.priority],
        total: entry.total,
        colorClassName: priorityBarColors[entry.priority],
      })),
    [consultations],
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
    setEditing(target);
    setForm({
      name: target.name,
      email: target.email,
      password: target.password,
      role: target.role,
      phone: target.phone,
      specialty: target.specialty ?? "",
      licenseNumber: target.licenseNumber ?? "",
      address: target.address ?? "",
    });
    setError(null);
    setDialogOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const result = editing
      ? updateUser(editing.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone.trim(),
          specialty: form.specialty.trim() || undefined,
          licenseNumber: form.licenseNumber.trim() || undefined,
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

  function exportConsultations() {
    const rows = consultations.map((item) => ({
      Referencia: item.reference,
      Crianca: item.childName,
      Idade: item.childAgeYears,
      Encarregado: item.guardianName,
      Telefone: item.phone,
      Localizacao: item.location,
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
    }));

    downloadCsv(
      `hgm-teleconsultas-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows),
    );
    setFeedback(`Exportadas ${rows.length} teleconsultas para CSV.`);
  }

  function exportUsers() {
    const rows = users.map((item) => ({
      Nome: item.name,
      Email: item.email,
      Perfil: roleLabels[item.role],
      Telefone: item.phone,
      Especialidade: item.specialty ?? "",
      Ordem: item.licenseNumber ?? "",
      Estado: item.active ? "Activo" : "Inactivo",
      Criado: formatDate(item.createdAt),
    }));

    downloadCsv(
      `hgm-utilizadores-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows),
    );
    setFeedback(`Exportados ${rows.length} utilizadores para CSV.`);
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

                <Button variant="outline" size="lg" onClick={exportConsultations}>
                  <Download data-icon="inline-start" />
                  Exportar CSV
                </Button>
              </div>

              <div className="mt-7 flex h-52 items-end gap-2 sm:gap-4">
                {volume.map((entry) => (
                  <div
                    key={entry.label}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-xs font-semibold tabular-nums">
                      {entry.total}
                    </span>

                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="relative w-full overflow-hidden rounded-t-lg bg-primary/85 transition-all"
                        style={{
                          height: `${Math.max((entry.total / maxVolume) * 100, entry.total > 0 ? 6 : 2)}%`,
                        }}
                      >
                        {entry.urgent > 0 ? (
                          <div
                            className="absolute inset-x-0 bottom-0 bg-warning"
                            style={{
                              height: `${(entry.urgent / Math.max(entry.total, 1)) * 100}%`,
                            }}
                          />
                        ) : null}
                      </div>
                    </div>

                    <span className="text-[0.625rem] text-muted-foreground tabular-nums">
                      {entry.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-5 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-primary/85" />
                  Total de pedidos
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm bg-warning" />
                  Urgentes e críticos
                </span>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Pendentes" value={metrics.pending} icon={Activity} tone="warning" />
              <StatCard label="Agendadas" value={metrics.scheduled} icon={Activity} tone="primary" />
              <StatCard label="Concluídas" value={metrics.completed} icon={CheckCircle2} tone="success" />
              <StatCard label="Encaminhadas" value={metrics.referred} icon={ShieldOff} tone="danger" />
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8">
                <h2 className="font-bold tracking-tight">Pedidos por prioridade</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Classificação atribuída pela triagem automática.
                </p>
                <div className="mt-6">
                  <BreakdownBars items={priorityBreakdown} />
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
              Os perfis determinam o que cada pessoa vê na plataforma.
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
                      value={form.specialty}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          specialty: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-xl px-3.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="user-license" className="text-sm font-semibold">
                      Nº da Ordem
                    </Label>
                    <Input
                      id="user-license"
                      name="user-license"
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

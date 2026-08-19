"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Consultation, ConsultationStatus } from "@/lib/types/consultation";
import { priorityLabels, statusLabels } from "@/lib/types/consultation";
import {
  getDailyVolume,
  getPriorityBreakdown,
} from "@/lib/utils/consultations";

/**
 * Gráficos do painel clínico (pediatra e administração).
 *
 * As cores vivem em `globals.css` (`--chart-*`), foram escolhidas contra a
 * superfície do cartão e validadas para daltonismo. Cada gráfico traz rótulo ou
 * legenda: a identidade nunca depende só da cor.
 *
 * A animação de entrada está desligada de propósito: um gráfico que começa
 * vazio e cresce durante um segundo e meio parece um gráfico que não carregou —
 * foi essa a leitura registada no relatório de testes.
 */

// --- Volume diário --------------------------------------------------------

const volumeConfig = {
  restantes: {
    label: "Normais e avaliação",
    color: "var(--chart-avaliacao)",
  },
  urgentes: {
    label: "Urgentes e críticos",
    color: "var(--chart-urgente)",
  },
} satisfies ChartConfig;

/**
 * Pedidos por dia nos últimos sete dias.
 *
 * Colunas empilhadas em vez de duas linhas: os urgentes são um subconjunto do
 * total, por isso a altura da coluna é o total do dia e o segmento de baixo diz
 * quanto desse total exigiu prioridade.
 */
export function VolumeChart({ data }: { data: Consultation[] }) {
  const points = useMemo(
    () =>
      getDailyVolume(data, 7).map((entry) => ({
        dia: entry.label,
        urgentes: entry.urgent,
        restantes: entry.total - entry.urgent,
        total: entry.total,
      })),
    [data],
  );

  const empty = points.every((point) => point.total === 0);

  return (
    <ChartContainer config={volumeConfig} className="aspect-auto h-64 w-full">
      <BarChart accessibilityLayer data={points} margin={{ top: 12, left: -18 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={44}
          domain={empty ? [0, 4] : undefined}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {/* Contorno da cor do cartão: 2px de folga entre segmentos empilhados. */}
        <Bar
          dataKey="urgentes"
          stackId="pedidos"
          fill="var(--color-urgentes)"
          stroke="var(--card)"
          strokeWidth={2}
          radius={[0, 0, 4, 4]}
          isAnimationActive={false}
        />
        <Bar
          dataKey="restantes"
          stackId="pedidos"
          fill="var(--color-restantes)"
          stroke="var(--card)"
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}

// --- Fila por gravidade ---------------------------------------------------

const priorityConfig = {
  total: { label: "Pedidos" },
  CRITICA: { label: priorityLabels.CRITICA, color: "var(--chart-critica)" },
  URGENTE: { label: priorityLabels.URGENTE, color: "var(--chart-urgente)" },
  AVALIACAO: { label: priorityLabels.AVALIACAO, color: "var(--chart-avaliacao)" },
  NORMAL: { label: priorityLabels.NORMAL, color: "var(--chart-normal)" },
} satisfies ChartConfig;

/**
 * Distribuição por gravidade, em barras horizontais — os nomes das categorias
 * são longos e a leitura é de magnitude, não de identidade.
 */
export function PriorityChart({ data }: { data: Consultation[] }) {
  const points = useMemo(
    () =>
      getPriorityBreakdown(data).map((entry) => ({
        prioridade: priorityLabels[entry.priority],
        total: entry.total,
        fill: `var(--color-${entry.priority})`,
      })),
    [data],
  );

  return (
    <ChartContainer config={priorityConfig} className="aspect-auto h-64 w-full">
      <BarChart
        accessibilityLayer
        layout="vertical"
        data={points}
        margin={{ left: 4, right: 34 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" dataKey="total" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="prioridade"
          tickLine={false}
          axisLine={false}
          width={132}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        {/*
          `minPointSize` deixa um traço mínimo nas categorias a zero: sem ele a
          barra desaparece e o rótulo com o valor desaparece com ela.
        */}
        <Bar
          dataKey="total"
          radius={4}
          barSize={22}
          minPointSize={2}
          isAnimationActive={false}
        >
          {/* Rótulo directo: o âmbar fica abaixo de 3:1 no branco. */}
          <LabelList
            dataKey="total"
            position="right"
            offset={10}
            className="fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// --- Percurso dos pedidos -------------------------------------------------

const stageOrder: ConsultationStatus[] = [
  "PENDENTE",
  "AGENDADA",
  "EM_CURSO",
  "CONCLUIDA",
  "ENCAMINHADA",
];

const stageConfig = {
  PENDENTE: { label: statusLabels.PENDENTE, color: "var(--chart-stage-1)" },
  AGENDADA: { label: statusLabels.AGENDADA, color: "var(--chart-stage-2)" },
  EM_CURSO: { label: statusLabels.EM_CURSO, color: "var(--chart-stage-3)" },
  CONCLUIDA: { label: statusLabels.CONCLUIDA, color: "var(--chart-stage-4)" },
  ENCAMINHADA: { label: statusLabels.ENCAMINHADA, color: "var(--chart-stage-5)" },
} satisfies ChartConfig;

/**
 * Percurso dos pedidos: uma só barra empilhada, do estado inicial ao final.
 *
 * Como as fases são ordenadas, a cor é uma rampa sequencial de um só tom em vez
 * de cinco cores independentes — e a barra inteira é, por construção, o total
 * de pedidos registados.
 */
export function StageChart({ data }: { data: Consultation[] }) {
  const counts = useMemo(() => {
    const row: Record<string, number | string> = { linha: "Pedidos" };
    for (const status of stageOrder) {
      row[status] = data.filter((item) => item.status === status).length;
    }
    return [row];
  }, [data]);

  const total = data.length;

  return (
    <div>
      <ChartContainer config={stageConfig} className="aspect-auto h-24 w-full">
        <BarChart
          accessibilityLayer
          layout="vertical"
          data={counts}
          margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          barSize={44}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="linha" hide />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          {stageOrder.map((status, index) => (
            <Bar
              key={status}
              dataKey={status}
              stackId="percurso"
              fill={`var(--color-${status})`}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
              radius={
                index === 0
                  ? [8, 0, 0, 8]
                  : index === stageOrder.length - 1
                    ? [0, 8, 8, 0]
                    : 0
              }
            />
          ))}
        </BarChart>
      </ChartContainer>

      {/*
        Legenda com os valores: serve de rótulo directo e de vista em tabela,
        para quem não distingue os degraus da rampa.
      */}
      <ul className="mt-4 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {stageOrder.map((status) => (
          <li
            key={status}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: `var(--color-${status})` }}
              />
              <span className="truncate text-muted-foreground">
                {statusLabels[status]}
              </span>
            </span>
            <span className="font-semibold tabular-nums">
              {counts[0][status] as number}
            </span>
          </li>
        ))}

        <li className="flex items-center justify-between gap-3 border-t border-border pt-2 text-sm sm:col-span-2 lg:col-span-3">
          <span className="text-muted-foreground">Total de pedidos</span>
          <span className="font-bold tabular-nums">{total}</span>
        </li>
      </ul>
    </div>
  );
}

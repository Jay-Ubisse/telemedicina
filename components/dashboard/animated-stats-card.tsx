"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnimatedStatsCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  delay?: number;
};

export function AnimatedStatsCard({
  title,
  value,
  icon,
  description,
  delay = 0,
}: AnimatedStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </CardHeader>

        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

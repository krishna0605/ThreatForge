"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type CalloutType = "info" | "warning" | "danger" | "success" | "theorem";

interface InfoCalloutProps {
  type: CalloutType;
  title: string;
  children: ReactNode;
}

const config: Record<CalloutType, { icon: string; border: string; bg: string; text: string; iconColor: string }> = {
  info: {
    icon: "info",
    border: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/10",
    text: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: "warning",
    border: "border-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    text: "text-yellow-700 dark:text-yellow-400",
    iconColor: "text-yellow-500",
  },
  danger: {
    icon: "error",
    border: "border-red-500",
    bg: "bg-red-50 dark:bg-red-900/10",
    text: "text-red-700 dark:text-red-400",
    iconColor: "text-red-500",
  },
  success: {
    icon: "check_circle",
    border: "border-green-500",
    bg: "bg-green-50 dark:bg-green-900/10",
    text: "text-green-700 dark:text-green-400",
    iconColor: "text-green-500",
  },
  theorem: {
    icon: "functions",
    border: "border-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/10",
    text: "text-purple-700 dark:text-purple-400",
    iconColor: "text-purple-500",
  },
};

export const InfoCallout = ({ type, title, children }: InfoCalloutProps) => {
  const c = config[type];
  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`my-6 border-l-4 ${c.border} ${c.bg} rounded-r-lg p-5`}
    >
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          initial={{ scale: 0.5 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          className={`material-icons ${c.iconColor} text-xl`}
        >
          {c.icon}
        </motion.span>
        <h4 className={`font-display font-bold text-sm ${c.text}`}>{title}</h4>
      </div>
      <div className={`text-sm ${c.text} opacity-90 leading-relaxed [&_strong]:font-bold [&_code]:font-mono [&_code]:text-xs [&_code]:bg-black/10 [&_code]:dark:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded`}>
        {children}
      </div>
    </motion.div>
  );
};

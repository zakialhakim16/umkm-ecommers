"use client";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function Shell({ children, title, eyebrow = "OPERASIONAL" }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  const [open, setOpen] = useState(false);
  return <div className="app-shell"><Sidebar open={open} close={() => setOpen(false)} /><main><Header title={title} eyebrow={eyebrow} onMenu={() => setOpen(true)} /><div className="content">{children}</div></main></div>;
}

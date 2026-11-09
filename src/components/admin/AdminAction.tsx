import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Confirmation = createContext<(message: string) => Promise<boolean>>(async () => false);
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<{ message: string; resolve: (value: boolean) => void } | null>(null);
  const finish = (value: boolean) => { request?.resolve(value); setRequest(null); };
  return <Confirmation.Provider value={(message) => new Promise((resolve) => setRequest({ message, resolve }))}>{children}<AlertDialog open={!!request} onOpenChange={(open) => { if (!open) finish(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar alteração</AlertDialogTitle><AlertDialogDescription>{request?.message}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => finish(false)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => finish(true)}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></Confirmation.Provider>;
}
export const useAdminConfirmation = () => useContext(Confirmation);
export function ActionNote({ writes, description }: { writes: boolean; description: string }) { return <div className="mt-2 space-y-2"><span className={`inline-flex rounded px-2 py-1 text-[11px] font-semibold ${writes ? "bg-seal-soft text-seal-foreground" : "bg-deal-soft text-deal-strong"}`}>{writes ? "Executa (grava dados)" : "Simulação (não grava)"}</span><p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{description}</p></div>; }
export function AdminAction({ description, writes = false, children, onClick, ...props }: React.ComponentProps<typeof Button> & { description: string; writes?: boolean }) {
  const confirm = useAdminConfirmation();
  return <div className="min-w-0"><Button {...props} className={`max-w-full whitespace-normal text-left ${props.className ?? ""}`} onClick={async (event) => { if (writes && !await confirm(description)) return; try { await onClick?.(event); } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível executar a ação."); } }}>{children}</Button><ActionNote writes={writes} description={description} /></div>;
}

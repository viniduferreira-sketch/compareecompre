import { queryOptions } from "@tanstack/react-query";
import { getImportStatus } from "@/lib/admin-import.functions";
export const importsQuery = queryOptions({ queryKey: ["admin", "awin-imports"], queryFn: () => getImportStatus(), refetchInterval: 10000 });
export const adminHead = (title: string, description: string) => ({ meta: [{ title: `${title} | Administração Compare e Compre` }, { name: "description", content: description }, { property: "og:title", content: `${title} | Compare e Compre` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" }] });

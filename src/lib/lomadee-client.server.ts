const GATEWAY = "https://connector-gateway.lovable.dev/udc_lomadee";

export function lomadeeRequests(budget = 40) {
  const lovable = process.env["LOVABLE_API_KEY"];
  const key = process.env["UDC_LOMADEE_API_KEY"];
  if (!lovable || !key) throw new Error("A conexão com a Lomadee não está configurada.");
  let calls = 0;
  return {
    get remaining() { return budget - calls; },
    async call<T>(path: string, init?: RequestInit): Promise<T> {
      if (calls >= budget) throw new Error("Limite de consultas desta rodada atingido.");
      if (calls > 0) await new Promise((resolve) => setTimeout(resolve, 1100));
      calls += 1;
      const res = await fetch(`${GATEWAY}${path}`, { ...init, headers: {
        Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": key, Accept: "application/json", ...(init?.headers ?? {}),
      } });
      if (!res.ok) {
        const body = await res.text();
        console.error(`Lomadee request failed [${res.status}]: ${body}`);
        throw new Error(`A Lomadee recusou a consulta (${res.status}): ${body.slice(0, 300)}`);
      }
      return res.json() as Promise<T>;
    },
  };
}
type Db = {
  from: (tabela: string) => {
    insert: (valor: unknown) => {
      select: (campos: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
    upsert: (
      valor: unknown,
      options?: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
    update: (valor: unknown) => {
      eq: (campo: string, valor: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export type EtapaConstrucao =
  "diagnostico" | "planejamento" | "construcao" | "revisao" | "teste" | "correcao" | "entrega";

export async function iniciarExecucao(
  db: Db,
  dados: { projetoId: string; userId: string; pedido: string; diagnostico: string },
) {
  const { data, error } = await db
    .from("execucoes_construcao")
    .insert({
      projeto_id: dados.projetoId,
      user_id: dados.userId,
      pedido: dados.pedido,
      etapa_atual: "diagnostico",
      estado: "em_andamento",
      provas: { diagnostico: dados.diagnostico.slice(0, 4000) },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não consegui iniciar a execução.");
  await registrarEtapa(db, {
    execucaoId: data.id,
    userId: dados.userId,
    etapa: "diagnostico",
    estado: "concluida",
    resultado: dados.diagnostico,
  });
  return data.id;
}

export async function registrarEtapa(
  db: Db,
  dados: {
    execucaoId: string;
    userId: string;
    etapa: EtapaConstrucao;
    estado: "pendente" | "em_andamento" | "concluida" | "bloqueada" | "falhou";
    entrada?: string;
    resultado?: string;
    erro?: string;
    modelo?: string;
    tentativa?: number;
    arquivos?: string[];
  },
) {
  const agora = new Date().toISOString();
  const { error } = await db.from("etapas_construcao").upsert(
    {
      execucao_id: dados.execucaoId,
      user_id: dados.userId,
      etapa: dados.etapa,
      estado: dados.estado,
      entrada_resumo: dados.entrada?.slice(0, 4000),
      resultado_resumo: dados.resultado?.slice(0, 4000),
      erro: dados.erro?.slice(0, 2000),
      modelo: dados.modelo,
      tentativa: dados.tentativa ?? 1,
      arquivos_produzidos: dados.arquivos ?? [],
      concluida_em: ["concluida", "bloqueada", "falhou"].includes(dados.estado) ? agora : null,
    },
    { onConflict: "execucao_id,etapa,tentativa" },
  );
  if (error) throw new Error(error.message);
  await db
    .from("execucoes_construcao")
    .update({
      etapa_atual: dados.etapa,
      tentativa: dados.tentativa ?? 1,
      ultimo_erro: dados.erro ?? null,
    })
    .eq("id", dados.execucaoId);
}

export async function finalizarExecucao(
  db: Db,
  dados: {
    execucaoId: string;
    userId: string;
    ok: boolean;
    modelos: string[];
    arquivos: string[];
    resumo: string;
  },
) {
  const etapaFinal: Parameters<typeof registrarEtapa>[1] = {
    execucaoId: dados.execucaoId,
    userId: dados.userId,
    etapa: "entrega",
    estado: dados.ok ? "concluida" : "bloqueada",
    arquivos: dados.arquivos,
  };
  if (dados.ok) etapaFinal.resultado = dados.resumo;
  else etapaFinal.erro = dados.resumo;
  await registrarEtapa(db, etapaFinal);
  await db
    .from("execucoes_construcao")
    .update({
      estado: dados.ok ? "concluida" : "bloqueada",
      etapa_atual: "entrega",
      modelos_usados: [...new Set(dados.modelos)],
      ultimo_erro: dados.ok ? null : dados.resumo.slice(0, 2000),
      provas: { arquivos_salvos: dados.ok ? dados.arquivos : [], entrega_verificada: dados.ok },
      concluida_em: new Date().toISOString(),
    })
    .eq("id", dados.execucaoId);
}

import React from 'react';

export const PainelRecursos = () => {
  return (
    <div className="p-4 bg-zinc-900 text-white rounded-lg border border-zinc-800">
      <h3 className="text-sm font-bold mb-2 text-emerald-400">🛡️ Batalhao de IAs Ativo (OmniRoute)</h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center bg-zinc-800 p-2 rounded">
          <div>
            <p className="font-semibold">Arquiteto-IA</p>
            <p className="text-zinc-400 text-[10px]">Planejador de Rotas</p>
          </div>
          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px] border border-emerald-800">ativo</span>
        </div>
        <div className="flex justify-between items-center bg-zinc-800 p-2 rounded">
          <div>
            <p className="font-semibold">Programador-IA</p>
            <p className="text-zinc-400 text-[10px]">Desenvolvedor Backend</p>
          </div>
          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px] border border-emerald-800">ativo</span>
        </div>
        <div className="flex justify-between items-center bg-zinc-800 p-2 rounded">
          <div>
            <p className="font-semibold">Revisor-IA</p>
            <p className="text-zinc-400 text-[10px]">Auditor de Codigo</p>
          </div>
          <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px] border border-emerald-800">ativo</span>
        </div>
      </div>
    </div>
  );
};

export default PainelRecursos;

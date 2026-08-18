import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { IconBarbell, IconHeartbeat } from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDias, domingoDaSemana, fmtData, hoje, segundaDaSemana } from "@/lib/data";
import { useCheckins, useUpdateCheckin, useUpsertCheckinHoje } from "@/features/saude/hooks";
import type { CheckinSaude } from "@/features/saude/types";
import {
  useCheckinsAcademia,
  useDesmarcarCheckinAcademia,
  useMarcarCheckinAcademiaHoje,
} from "@/features/academia/hooks";
import { useDadosGoogleHealth } from "@/features/google-health/hooks";

export const Route = createFileRoute("/_authenticated/saude")({
  component: Saude,
});

const HUMORES = ["Péssimo", "Ruim", "Neutro", "Bom", "Ótimo"];

function Escala({
  valor,
  onEscolher,
  rotulos,
}: {
  valor: number;
  onEscolher: (n: number) => void;
  rotulos?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onEscolher(n)}
          className={cn(
            "rounded-md border px-3 py-2 text-xs font-semibold transition",
            n === valor
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-transparent text-foreground",
          )}
        >
          {rotulos ? rotulos[n - 1] : n}
        </button>
      ))}
    </div>
  );
}

function Saude() {
  const { data: checkins = [], isLoading } = useCheckins();
  const salvar = useUpsertCheckinHoje();
  const { data: dadosGoogleHealth = [] } = useDadosGoogleHealth();

  const { data: checkinsAcademia = [] } = useCheckinsAcademia();
  const marcarAcademia = useMarcarCheckinAcademiaHoje();
  const desmarcarAcademia = useDesmarcarCheckinAcademia();

  const checkinAcademiaHoje = checkinsAcademia.find((c) => c.data === hoje());
  const semanaAtual = useMemo(() => segundaDaSemana(hoje()), []);
  // Academia conta domingo a domingo (diferente da semana seg-dom usada nas
  // médias de energia/sono abaixo) — pedido explícito do usuário.
  const semanaAcademia = useMemo(() => domingoDaSemana(hoje()), []);
  const checkinsNaSemana = useMemo(() => {
    const fimSemana = addDias(semanaAcademia, 6);
    return checkinsAcademia.filter((c) => c.data >= semanaAcademia && c.data <= fimSemana).length;
  }, [checkinsAcademia, semanaAcademia]);

  function alternarAcademia() {
    if (checkinAcademiaHoje) {
      desmarcarAcademia.mutate(checkinAcademiaHoje.id, {
        onError: (e: Error) => toast.error(e.message),
      });
    } else {
      marcarAcademia.mutate(undefined, { onError: (e: Error) => toast.error(e.message) });
    }
  }

  const atualizar = useUpdateCheckin();
  const registroHoje = checkins.find((c) => c.data === hoje());

  const [editando, setEditando] = useState<CheckinSaude | null>(null);
  const [humor, setHumor] = useState(0);
  const [energia, setEnergia] = useState(0);
  const [obs, setObs] = useState("");

  // Sem edição manual, o formulário sempre reflete o check-in de hoje (se
  // já existir); clicar num registro passado troca o "alvo" pra ele.
  const alvo = editando ?? registroHoje ?? null;

  useEffect(() => {
    if (!alvo) {
      setHumor(0);
      setEnergia(0);
      setObs("");
      return;
    }
    setHumor(alvo.humor);
    setEnergia(alvo.energia ?? 0);
    setObs(alvo.obs ?? "");
    // roda só quando o alvo muda, não a cada digitação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando, registroHoje?.data]);

  function iniciarEdicao(c: CheckinSaude) {
    setEditando(c);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
  }

  function salvarCheckin() {
    if (!humor) return;
    const input = {
      humor,
      energia: energia || null,
      // Sono não é mais preenchido manualmente (vem do Google Health) — ao
      // editar um registro antigo, preserva o valor manual que já existia.
      sono: editando?.sono ?? null,
      obs: obs.trim() || null,
    };
    if (editando) {
      atualizar.mutate(
        { id: editando.id, input },
        { onSuccess: cancelarEdicao, onError: (e: Error) => toast.error(e.message) },
      );
    } else {
      salvar.mutate(input, { onError: (e: Error) => toast.error(e.message) });
    }
  }

  const ultimos14 = useMemo(
    () => [...checkins].sort((a, b) => a.data.localeCompare(b.data)).slice(-14),
    [checkins],
  );

  const diasComAcademia = useMemo(
    () => new Set(checkinsAcademia.map((c) => c.data)),
    [checkinsAcademia],
  );

  const mediasSemana = useMemo(() => {
    const doSemana = checkins.filter((c) => c.data >= semanaAtual && c.data <= hoje());
    const energias = doSemana.filter((c) => c.energia != null).map((c) => c.energia as number);
    const mediaEnergia = energias.length
      ? energias.reduce((a, b) => a + b, 0) / energias.length
      : null;

    // Sono agora vem do Google Health (sincronizado automaticamente), não
    // mais de um campo manual do check-in.
    const sonosMinutos = dadosGoogleHealth
      .filter((d) => d.data >= semanaAtual && d.data <= hoje() && d.sono_minutos != null)
      .map((d) => d.sono_minutos as number);
    const mediaSono = sonosMinutos.length
      ? sonosMinutos.reduce((a, b) => a + b, 0) / sonosMinutos.length / 60
      : null;

    return { mediaEnergia, mediaSono };
  }, [checkins, semanaAtual, dadosGoogleHealth]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Saúde" />

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        {mediasSemana.mediaEnergia != null && (
          <span>
            <strong className="text-foreground">{mediasSemana.mediaEnergia.toFixed(1)}</strong>{" "}
            energia média (semana)
          </span>
        )}
        {mediasSemana.mediaSono != null && (
          <span>
            <strong className="text-foreground">{mediasSemana.mediaSono.toFixed(1)}h</strong> sono
            médio (semana)
          </span>
        )}
        <span>
          <strong className="text-foreground">{checkinsNaSemana}</strong> vezes na academia (semana)
        </span>
      </div>

      <Card className="mb-5">
        <CardContent className="pt-6">
          <div className="mb-3.5 flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
            {editando
              ? `Editando registro de ${fmtData(editando.data)}`
              : "Como estou me sentindo hoje?"}
            {!editando && registroHoje && (
              <span className="text-xs font-medium text-green-600">registrado — pode ajustar</span>
            )}
            {editando && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-auto py-1 text-xs"
                onClick={cancelarEdicao}
              >
                Cancelar
              </Button>
            )}
          </div>
          <div className="mb-3.5 space-y-1.5">
            <Label>Humor</Label>
            <Escala valor={humor} onEscolher={setHumor} rotulos={HUMORES} />
          </div>
          <div className="mb-3.5 space-y-1.5">
            <Label>Energia (1 = esgotado · 5 = a mil)</Label>
            <Escala valor={energia} onEscolher={setEnergia} />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Observação (opcional)</Label>
            <Input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="ex.: caminhei 40 min"
            />
          </div>
          <Button
            onClick={salvarCheckin}
            disabled={!humor || salvar.isPending || atualizar.isPending}
          >
            {salvar.isPending || atualizar.isPending
              ? "Salvando…"
              : editando
                ? "Salvar edição"
                : registroHoje
                  ? "Atualizar check-in"
                  : "Salvar check-in"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="flex items-center justify-between gap-2 pt-6">
          <Button
            variant={checkinAcademiaHoje ? "default" : "outline"}
            onClick={alternarAcademia}
            disabled={marcarAcademia.isPending || desmarcarAcademia.isPending}
          >
            <IconBarbell className="size-4" />
            {checkinAcademiaHoje ? "Fui à academia hoje ✓" : "Check Academia"}
          </Button>
          <span className="text-xs text-muted-foreground">({checkinsNaSemana}/7)</span>
        </CardContent>
      </Card>

      {ultimos14.length > 1 && (
        <Card className="mb-5">
          <CardContent className="pt-6">
            <div className="mb-2.5 text-xs uppercase tracking-wide text-muted-foreground">
              Humor — últimos {ultimos14.length} registros
            </div>
            <div className="flex h-20 items-end gap-1">
              {ultimos14.map((c) => (
                <div
                  key={c.data}
                  title={`${fmtData(c.data)} — ${HUMORES[c.humor - 1]}`}
                  className={cn(
                    "min-w-2 flex-1 rounded-t",
                    c.humor >= 4 ? "bg-green-500" : c.humor === 3 ? "bg-amber-400" : "bg-primary",
                  )}
                  style={{ height: `${(c.humor / 5) * 100}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : checkins.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconHeartbeat className="size-8" stroke={1.5} />
          <p className="text-sm">
            Nenhum check-in ainda. Trinta segundos por dia bastam para enxergar padrões.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {checkins.slice(0, 10).map((c) => (
            <Card
              key={c.data}
              onClick={() => iniciarEdicao(c)}
              className={cn("cursor-pointer transition", editando?.id === c.id && "border-primary")}
            >
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3.5 text-sm text-foreground">
                <strong className="min-w-[84px]">{fmtData(c.data)}</strong>
                <span>Humor: {HUMORES[c.humor - 1]}</span>
                {!!c.energia && <span>Energia: {c.energia}/5</span>}
                {c.sono != null && <span>Sono: {c.sono}h</span>}
                {diasComAcademia.has(c.data) && (
                  <span className="ml-auto text-base" title="Foi à academia">
                    🏋️
                  </span>
                )}
                {c.obs && <span className="w-full text-xs text-muted-foreground">{c.obs}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

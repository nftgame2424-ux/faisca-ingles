import type { IconName } from "../components/Icon";

export const SCIENCE: [string, string, string][] = [
  ["Repetição espaçada", "Cada palavra volta no momento em que você está quase esquecendo. Acertou, a próxima revisão fica mais distante: 1, 2, 4, 8, 16 dias. Errou, ela volta logo.", "Ebbinghaus (1885); Cepeda e colegas (2006), meta-análise sobre espaçamento"],
  ["Prática de recuperação", "Os exercícios pedem que você puxe a resposta da memória antes de vê-la. Isso fixa mais do que ler a lista de novo.", "Roediger e Karpicke (2006), efeito de teste"],
  ["Intercalação", "Cada sessão mistura tipos de exercício e assuntos. Dá mais trabalho no momento, mas a retenção melhora.", "Rohrer e Taylor (2007)"],
  ["Pares mínimos", "Ouvir e falar palavras que mudam por um único som (ship / sheep) ensina o ouvido a separar os sons. Treinar a percepção melhora também a produção.", "Bradlow e colegas (1997), treino de percepção de /r/ e /l/"],
  ["Nota de pronúncia na hora", "O reconhecimento de voz devolve o que entendeu da sua fala e marca as palavras que não saíram claras. Correção imediata e específica acelera a melhora da pronúncia.", "Neri, Cucchiarini e Strik (2008), feedback de pronúncia por computador"],
  ["Shadowing", "Repetir junto com o áudio, no mesmo ritmo, treina pronúncia, entonação e escuta ao mesmo tempo.", "Hamada (2016), estudos com aprendizes de inglês"],
  ["Input compreensível", "As histórias com áudio trazem frases um pouco acima do seu nível, com tradução a um toque.", "Krashen (1982), hipótese do input"],
  ["Falar e receber correção", "Nos diálogos e na conversa você produz frases e recebe a versão mais natural na hora.", "Swain (1985), hipótese do output; Lyster e Ranta (1997), feedback corretivo"],
  ["Frases prontas (chunks)", "Expressões como “I'm running late” são guardadas como um bloco e saem mais rápido na hora de falar.", "Lewis (1993), abordagem lexical"],
  ["Plano “quando X, faço Y”", "Ligar o treino a um momento fixo do dia aumenta muito a chance de fazer.", "Gollwitzer (1999), intenções de implementação"],
  ["Jogos e recompensa rápida", "Elementos de jogo aumentam a motivação e o engajamento. O cérebro com TDAH tende a evitar esperas longas e responde bem a recompensas frequentes e a variedade.", "Sailer e Homner (2020), meta-análise de gamificação; Sonuga-Barke (2002), aversão à espera"]
];

export const BADGES: { id: string; t: string; d: string; icon: IconName }[] = [
  { id: "first", t: "Primeira sessão", d: "Completou 1 sessão", icon: "bolt" },
  { id: "s3", t: "3 dias", d: "Sequência de 3 dias", icon: "flame" },
  { id: "s7", t: "1 semana", d: "Sequência de 7 dias", icon: "flame" },
  { id: "w25", t: "25 itens", d: "Conhece 25 palavras e frases", icon: "book" },
  { id: "w100", t: "100 itens", d: "Conhece 100 palavras e frases", icon: "trophy" },
  { id: "mic", t: "Primeira fala", d: "Recebeu nota de pronúncia", icon: "mic" },
  { id: "tw90", t: "Língua solta", d: "90% num trava-língua", icon: "wave" },
  { id: "warm", t: "Aquecido", d: "Fez o aquecimento de dicção", icon: "spark" },
  { id: "mem", t: "Memória boa", d: "Completou o jogo da memória", icon: "cards" },
  { id: "blitz", t: "Relâmpago 20", d: "20 pontos no Relâmpago", icon: "timer" },
  { id: "dialog", t: "Bom de papo", d: "Completou um diálogo", icon: "chat" },
  { id: "boss", t: "Caça-chefes", d: "Derrotou um chefe", icon: "sword" },
  { id: "epic", t: "Sortudo", d: "Ganhou um item Épico", icon: "gem" },
  { id: "s30", t: "30 dias", d: "Sequência de 30 dias", icon: "trophy" }
];

export const MODES: Record<string, { t: string; icon: IconName }> = {
  focus: { t: "Sessão de foco", icon: "spark" },
  unit: { t: "Unidade", icon: "path" },
  listen: { t: "Ditado", icon: "head" },
  speak: { t: "Repetir frases", icon: "mic" },
  build: { t: "Montar frases", icon: "puzzle" },
  flash: { t: "Flashcards", icon: "cards" },
  gram: { t: "Gramática", icon: "pen" },
  review: { t: "Palavras difíceis", icon: "target" },
  diction: { t: "Dicção", icon: "wave" },
  blitz: { t: "Relâmpago", icon: "bolt" },
  memory: { t: "Jogo da memória", icon: "cards" },
  story: { t: "História", icon: "book" },
  twister: { t: "Trava-línguas", icon: "wave" },
  warm: { t: "Aquecimento", icon: "spark" },
  dialog: { t: "Diálogo guiado", icon: "chat" },
  chat: { t: "Conversa com IA", icon: "chat" },
  boss: { t: "Batalha contra chefe", icon: "sword" }
};

# Faísca Inglês

App de inglês para celular (Android + Chrome), pensado para TDAH: sessões de 2 a 15 minutos, repetição espaçada, voz em todos os exercícios, nota de pronúncia pelo microfone, treino de dicção, jogos e histórico completo.

Feito com Vite + React + TypeScript, instalável na tela inicial (PWA). O progresso fica salvo no aparelho e pode ser copiado em Ajustes › Backup.

## Rodar no PC

```bash
npm install
npm run dev
```

## Testar no celular pela rede de casa

O microfone do Chrome só funciona em HTTPS, então este comando sobe o app com um certificado local:

```bash
npm run phone
```

1. O celular precisa estar no mesmo Wi-Fi do PC.
2. No Chrome do celular, abra o endereço `https://192.168.x.x:5173` que aparece no terminal (o "Network").
3. O Chrome avisa que a conexão não é particular (o certificado é local). Toque em **Avançado** › **Continuar**.
4. Na primeira fala, permita o microfone.

## Publicar para usar sempre (link fixo)

```bash
npm run build
npx netlify deploy --prod --dir dist
```

Depois abra o link no Chrome do Android › menu ⋮ › **Instalar app** (ou **Adicionar à tela inicial**).

## Estrutura

- `src/data` — conteúdo: unidades, histórias, sons de dicção, trava-línguas, diálogos
- `src/lib` — estado salvo, repetição espaçada, voz e reconhecimento de fala, nota de pronúncia, IA opcional
- `src/screens` — telas (Hoje, Trilha, Treinar, Falar, Histórico, Ajustes, jogos)
- `src/components` — peças reutilizáveis (caixa de fala, gráficos, ícones)

## Conversa com IA (opcional)

A conversa livre com o "Sam" usa a API da Anthropic com a chave colada em Ajustes. A chave fica só no aparelho e o uso é cobrado na conta de quem a criou. Sem chave, os diálogos falados da aba Falar funcionam de graça.

## Modo RPG

- **Herói:** nome e classe (Guerreiro, Mago, Bardo, Ladino). O nível sobe com o XP de estudo.
- **Ouro:** cada resposta certa, cada treino terminado, missões e chefes.
- **Baús:** todo treino concluído solta um item (Comum, Incomum, Raro, Épico, Lendário). Ir bem aumenta a chance de item raro; a cada 8 baús sem Raro, o próximo é garantido.
- **Equipamento:** 5 partes do corpo com bônus de XP, ouro, dano, sorte e corações.
- **Mundo:** a trilha virou mapa, com um chefe no fim de cada região e o chefe diário das suas revisões.
- **Chefes:** acertar ataca, falar certo é crítico, errar tira coração. A vida do chefe fica salva entre tentativas.
- **Missões diárias e loja:** 3 missões por dia; o ouro compra baús, poção de XP, elixir da sorte e escudos de sequência.

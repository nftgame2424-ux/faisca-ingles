// Treino de dicção e pronúncia: sons que mais pegam para quem fala português.
import type { Level, Pair } from "./content";

export interface Sound {
  id: string;
  t: string;
  ipa: string;
  tip: string;
  short: string;
  words: string[];
  pairs: [string, string][];
  sentences: string[];
}

export const SOUNDS: Sound[] = [
  {
    id: "th", t: "TH (think, this)", ipa: "/θ/ · /ð/",
    tip: "Coloque a ponta da língua entre os dentes e sopre. Não é “f”, “t” nem “d”. Em “think” é só ar; em “this” a garganta vibra.",
    short: "TH: ponta da língua entre os dentes, soprando.",
    words: ["think", "three", "thank", "this", "mother", "weather"],
    pairs: [["three", "free"], ["think", "sink"], ["thank", "tank"], ["mouth", "mouse"], ["they", "day"], ["then", "den"]],
    sentences: ["I think three things are free.", "They thank their mother."]
  },
  {
    id: "ih", t: "I curto x I longo (ship / sheep)", ipa: "/ɪ/ · /iː/",
    tip: "I longo (/iː/): sorriso, som esticado, como “ii”. I curto (/ɪ/): boca relaxada e som rápido, quase entre “i” e “ê”.",
    short: "I curto: boca relaxada e rápido. I longo: sorriso e esticado.",
    words: ["ship", "sheep", "live", "leave", "sit", "seat"],
    pairs: [["ship", "sheep"], ["live", "leave"], ["sit", "seat"], ["fill", "feel"], ["bit", "beat"], ["hit", "heat"]],
    sentences: ["Please sit in this seat.", "I live here, but I leave at six."]
  },
  {
    id: "ae", t: "A aberto (bad / bed)", ipa: "/æ/ · /e/",
    tip: "O /æ/ de bad, cat e man fica entre “é” e “a”: abra bem a boca e puxe os cantos para os lados.",
    short: "/æ/: boca bem aberta, entre “é” e “a”.",
    words: ["bad", "cat", "man", "black", "happy", "thank"],
    pairs: [["bad", "bed"], ["man", "men"], ["sad", "said"], ["pan", "pen"], ["had", "head"], ["sat", "set"]],
    sentences: ["The man had a bad day.", "That black cat is happy."]
  },
  {
    id: "h", t: "H aspirado (house, hello)", ipa: "/h/",
    tip: "O H inglês é só um sopro leve, como embaçar um vidro. Não é o “R” de “rato”: house não é “ráus”.",
    short: "H: só um sopro leve, não “R”.",
    words: ["house", "hello", "happy", "hair", "hotel", "who"],
    pairs: [["hat", "at"], ["heat", "eat"], ["hear", "ear"], ["hold", "old"], ["hair", "air"], ["high", "eye"]],
    sentences: ["He has a huge house.", "How happy are you?"]
  },
  {
    id: "r", t: "R inglês (red, car)", ipa: "/ɹ/",
    tip: "Puxe a ponta da língua para trás sem encostar no céu da boca e arredonde um pouco os lábios. Nunca é o “R” forte de “carro”. No fim da palavra (car, never) o americano faz um R suave.",
    short: "R: língua para trás sem tocar o céu da boca.",
    words: ["red", "right", "road", "car", "very", "world"],
    pairs: [["right", "light"], ["road", "load"], ["rice", "lice"], ["fry", "fly"], ["crowd", "cloud"], ["grass", "glass"]],
    sentences: ["The red car is right there.", "Read every word clearly."]
  },
  {
    id: "ed", t: "Final -ED (worked, played, wanted)", ipa: "/t/ · /d/ · /ɪd/",
    tip: "O -ED quase nunca é “êd”. Depois de som surdo vira /t/: worked soa “workt”. Depois de som sonoro vira /d/: played soa “pleid”. Só vira /ɪd/ depois de t ou d: wanted, needed.",
    short: "-ED: worked = “workt”, played = “pleid”. Só “id” depois de t ou d.",
    words: ["worked", "played", "wanted", "walked", "needed", "liked"],
    pairs: [["work", "worked"], ["play", "played"], ["walk", "walked"], ["like", "liked"], ["stop", "stopped"]],
    sentences: ["I worked, walked and talked.", "She wanted and needed a break."]
  },
  {
    id: "end", t: "Final sem “i” extra (big, book)", ipa: "consoante final",
    tip: "É comum somar um “i” no fim: “big-i”, “book-i”. Termine a palavra na consoante e corte o som ali.",
    short: "Final: pare na consoante, sem “i” no fim.",
    words: ["big", "book", "stop", "club", "good", "like"],
    pairs: [],
    sentences: ["Stop at the big club.", "I like that good book."]
  },
  {
    id: "s", t: "S no começo (school, speak)", ipa: "/s/ + consoante",
    tip: "Não coloque “e” antes: é “school”, não “eschool”. Comece direto no “sss” e emende na consoante.",
    short: "S inicial: comece direto no “sss”, sem “e” antes.",
    words: ["school", "speak", "study", "start", "sleep", "small"],
    pairs: [],
    sentences: ["Students speak at school.", "Stop and sleep a little."]
  },
  {
    id: "l", t: "L no final (milk, people)", ipa: "/ɫ/",
    tip: "No fim da palavra o L não vira “u”: milk não é “miuk”. Encoste a ponta da língua atrás dos dentes de cima e mantenha ali.",
    short: "L final: língua atrás dos dentes, não vira “u”.",
    words: ["milk", "people", "feel", "school", "call", "world"],
    pairs: [],
    sentences: ["People feel cold.", "Call me about the milk."]
  },
  {
    id: "v", t: "V x W (very, west)", ipa: "/v/ · /w/",
    tip: "V: dentes de cima apoiados no lábio de baixo, com vibração. W: lábios em bico, como um “u” rápido. Very não é “uéri”.",
    short: "V: dentes de cima no lábio de baixo, vibrando.",
    words: ["very", "voice", "visit", "west", "wine", "water"],
    pairs: [["vest", "west"], ["vine", "wine"], ["vet", "wet"], ["van", "ban"], ["very", "berry"]],
    sentences: ["Very well, I will visit the west.", "We have wine in the van."]
  },
  {
    id: "stress", t: "Sílaba tônica", ipa: "ˈ acento",
    tip: "Errar a sílaba forte confunde mais do que errar um som. COMfortable, VEGetable, deVELop, hoTEL. As sílabas fracas viram um “ã” curtinho (schwa).",
    short: "Tônica: marque a sílaba forte e encurte as fracas.",
    words: ["comfortable", "vegetable", "develop", "hotel", "interesting", "photograph"],
    pairs: [],
    sentences: ["This hotel is comfortable.", "Vegetables are interesting."]
  }
];

export interface Twister { t: string; pt: string; focus: string; lv: Level }
export const TWISTERS: Twister[] = [
  { t: "She sells seashells by the seashore.", pt: "Ela vende conchas à beira-mar.", focus: "S e SH", lv: "A" },
  { t: "Red lorry, yellow lorry.", pt: "Caminhão vermelho, caminhão amarelo.", focus: "R e L", lv: "A" },
  { t: "Three free throws.", pt: "Três arremessos livres.", focus: "TH", lv: "A" },
  { t: "Which witch is which?", pt: "Qual bruxa é qual?", focus: "W e I curto", lv: "A" },
  { t: "A big black bug bit a big black bear.", pt: "Um grande inseto preto mordeu um grande urso preto.", focus: "B e /æ/", lv: "A" },
  { t: "Fresh French fried fish.", pt: "Peixe frito francês fresquinho.", focus: "F e R", lv: "B" },
  { t: "Six sticky skeletons.", pt: "Seis esqueletos grudentos.", focus: "S + consoante", lv: "B" },
  { t: "Betty bought a bit of better butter.", pt: "Betty comprou um pouco de manteiga melhor.", focus: "T", lv: "B" },
  { t: "Peter Piper picked a peck of pickled peppers.", pt: "Peter Piper pegou um punhado de pimentas em conserva.", focus: "P", lv: "B" },
  { t: "Unique New York, you know you need unique New York.", pt: "Nova York única, você sabe que precisa da Nova York única.", focus: "ritmo", lv: "C" },
  { t: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", pt: "Quanta madeira uma marmota jogaria se uma marmota pudesse jogar madeira?", focus: "W e U", lv: "C" },
  { t: "I thought a thought, but the thought I thought wasn't the thought I thought.", pt: "Pensei um pensamento, mas o pensamento que pensei não era o que eu achava.", focus: "TH", lv: "C" }
];

export interface WarmStep { t: string; d: string; s: number; say?: string; slow?: boolean }
export const WARMUP: WarmStep[] = [
  { t: "Solte os lábios", d: "Solte o ar fazendo “brrrr” com os lábios bem soltos, como um motorzinho.", s: 10 },
  { t: "Boca bem aberta", d: "Exagere as vogais junto com a voz: “ah · ee · oo”.", s: 12, say: "ah... ee... oo... ah... ee... oo." },
  { t: "Língua entre os dentes", d: "Sopre com a ponta da língua para fora: think, three, this, that.", s: 12, say: "think. three. this. that." },
  { t: "Lábio e dente", d: "Dentes de cima no lábio de baixo, vibrando: very, voice, van.", s: 10, say: "very. voice. van." },
  { t: "O exercício da caneta", d: "Prenda uma caneta entre os dentes e leia a frase em voz alta. Tire a caneta e leia de novo: vai sair mais clara.", s: 20, say: "Red lorry, yellow lorry. Red lorry, yellow lorry." },
  { t: "Devagar e claro", d: "Fale bem devagar, articulando cada som até o fim da palavra.", s: 12, say: "I speak slowly and clearly.", slow: true }
];

export interface DialogueTurn { npc: Pair; opts: Pair[] }
export interface Dialogue { id: string; lv: Level; t: string; d: string; turns: DialogueTurn[] }
export const DIALOGUES: Dialogue[] = [
  { id: "cafe", lv: "A", t: "Pedindo um café", d: "Faça seu pedido no balcão.", turns: [
    { npc: ["Hi! What can I get you?", "Oi! O que vai querer?"], opts: [["Can I have a coffee, please?", "Pode me ver um café, por favor?"], ["I'd like a tea, please.", "Eu gostaria de um chá, por favor."]] },
    { npc: ["Sure! What size?", "Claro! Qual tamanho?"], opts: [["Small, please.", "Pequeno, por favor."], ["A large one, please.", "Um grande, por favor."]] },
    { npc: ["For here or to go?", "Para tomar aqui ou levar?"], opts: [["For here, please.", "Para tomar aqui."], ["To go, please.", "Para levar."]] },
    { npc: ["That's four dollars.", "São quatro dólares."], opts: [["Here you go.", "Aqui está."], ["Can I pay by card?", "Posso pagar com cartão?"]] },
    { npc: ["Perfect. Have a great day!", "Perfeito. Tenha um ótimo dia!"], opts: [["Thanks, you too!", "Obrigado, pra você também!"]] }
  ] },
  { id: "meet", lv: "A", t: "Conhecendo alguém", d: "Apresente-se para uma pessoa nova.", turns: [
    { npc: ["Hi! I'm Sam. What's your name?", "Oi! Eu sou o Sam. Qual é o seu nome?"], opts: [["Hi Sam! My name is Leo.", "Oi Sam! Meu nome é Leo."], ["Nice to meet you. I'm Ana.", "Prazer. Eu sou a Ana."]] },
    { npc: ["Nice to meet you! Where are you from?", "Prazer! De onde você é?"], opts: [["I'm from Brazil.", "Eu sou do Brasil."], ["I'm from São Paulo, in Brazil.", "Eu sou de São Paulo, no Brasil."]] },
    { npc: ["Cool! What do you do?", "Legal! O que você faz?"], opts: [["I'm a student.", "Eu sou estudante."], ["I work in an office.", "Eu trabalho num escritório."]] },
    { npc: ["And what do you like to do in your free time?", "E o que você gosta de fazer no tempo livre?"], opts: [["I like music and movies.", "Eu gosto de música e filmes."], ["I love to play video games.", "Eu adoro jogar videogame."]] },
    { npc: ["Awesome. See you later!", "Show. Até mais!"], opts: [["See you later!", "Até mais!"]] }
  ] },
  { id: "dir", lv: "A", t: "Pedindo direções", d: "Você está perdido na cidade.", turns: [
    { npc: ["Hi! Can I help you?", "Oi! Posso ajudar?"], opts: [["Yes, please. I'm lost.", "Sim, por favor. Estou perdido."], ["Where is the train station?", "Onde fica a estação de trem?"]] },
    { npc: ["Where do you want to go?", "Para onde você quer ir?"], opts: [["To the train station.", "Para a estação de trem."], ["To the city center.", "Para o centro da cidade."]] },
    { npc: ["Go straight ahead and turn left.", "Siga em frente e vire à esquerda."], opts: [["Is it far from here?", "É longe daqui?"], ["Turn left, okay.", "Virar à esquerda, certo."]] },
    { npc: ["No, it's about five minutes on foot.", "Não, uns cinco minutos a pé."], opts: [["Thank you so much!", "Muito obrigado!"]] }
  ] },
  { id: "hotel", lv: "B", t: "Check-in no hotel", d: "Chegue ao hotel e resolva um problema.", turns: [
    { npc: ["Good evening! Do you have a reservation?", "Boa noite! Você tem reserva?"], opts: [["Yes, I have a booking for two nights.", "Sim, tenho uma reserva para duas noites."], ["Yes, it's under the name Silva.", "Sim, está no nome Silva."]] },
    { npc: ["I'm sorry, I can't find your booking.", "Desculpe, não encontro sua reserva."], opts: [["Could you check again, please?", "Você poderia verificar de novo, por favor?"], ["I have the confirmation email right here.", "Tenho o e-mail de confirmação aqui."]] },
    { npc: ["Oh, here it is! It was under a different date.", "Ah, achei! Estava em outra data."], opts: [["No problem. What time is breakfast?", "Sem problema. Que horas é o café da manhã?"], ["Great. Is the Wi-Fi free?", "Ótimo. O Wi-Fi é grátis?"]] },
    { npc: ["Breakfast is from seven to ten, and the Wi-Fi is free.", "O café é das sete às dez, e o Wi-Fi é grátis."], opts: [["Perfect, thank you for your help.", "Perfeito, obrigado pela ajuda."]] }
  ] },
  { id: "doctor", lv: "B", t: "No médico", d: "Explique o que está sentindo.", turns: [
    { npc: ["Hello, what seems to be the problem?", "Olá, qual parece ser o problema?"], opts: [["I don't feel well. I've got a headache.", "Não estou bem. Estou com dor de cabeça."], ["I've had a sore throat since yesterday.", "Estou com dor de garganta desde ontem."]] },
    { npc: ["I see. Do you have a fever?", "Entendi. Você está com febre?"], opts: [["Yes, a little.", "Sim, um pouco."], ["No, I don't think so.", "Não, acho que não."]] },
    { npc: ["Have you taken any medicine?", "Você tomou algum remédio?"], opts: [["No, I haven't taken anything yet.", "Não, ainda não tomei nada."], ["I took some painkillers this morning.", "Tomei um analgésico hoje de manhã."]] },
    { npc: ["Okay. Get some rest and drink plenty of water.", "Certo. Descanse e beba bastante água."], opts: [["I will. Thank you, doctor.", "Pode deixar. Obrigado, doutor."]] }
  ] },
  { id: "interview", lv: "B", t: "Entrevista de emprego", d: "Responda perguntas comuns de entrevista.", turns: [
    { npc: ["Could you tell me a little about yourself?", "Você poderia falar um pouco sobre você?"], opts: [["Sure. I've worked as a developer for three years.", "Claro. Trabalho como desenvolvedor há três anos."], ["I'm a designer and I love solving problems.", "Sou designer e adoro resolver problemas."]] },
    { npc: ["What are your main strengths?", "Quais são seus pontos fortes?"], opts: [["I'm organized and I learn fast.", "Sou organizado e aprendo rápido."], ["I'm good at working in a team.", "Sou bom em trabalhar em equipe."]] },
    { npc: ["Why do you want to work here?", "Por que você quer trabalhar aqui?"], opts: [["I really like your products.", "Eu gosto muito dos produtos de vocês."], ["I want to grow and learn new skills.", "Quero crescer e aprender novas habilidades."]] },
    { npc: ["Great. Do you have any questions for us?", "Ótimo. Você tem perguntas para nós?"], opts: [["What does a typical day look like?", "Como é um dia típico?"], ["When can I expect to hear back?", "Quando terei um retorno?"]] }
  ] },
  { id: "meeting", lv: "C", t: "Reunião de projeto", d: "Defenda um prazo realista.", turns: [
    { npc: ["So, can we launch the new feature by Friday?", "Então, conseguimos lançar a funcionalidade até sexta?"], opts: [["To be honest, Friday isn't feasible.", "Pra ser sincero, sexta não é viável."], ["I'd like to push back on that a little.", "Eu gostaria de discordar um pouco disso."]] },
    { npc: ["Why not? What's the bottleneck?", "Por quê? Qual é o gargalo?"], opts: [["The approval process is taking too long.", "O processo de aprovação está demorando demais."], ["We're still waiting on the design team.", "Ainda estamos esperando o time de design."]] },
    { npc: ["Fair point. What would you suggest?", "Faz sentido. O que você sugere?"], opts: [["Let's prioritize the core features first.", "Vamos priorizar as funções principais primeiro."], ["We could launch a smaller version next Wednesday.", "Poderíamos lançar uma versão menor na quarta que vem."]] },
    { npc: ["Sounds reasonable. Can you follow up with the stakeholders?", "Parece razoável. Você pode dar retorno às partes interessadas?"], opts: [["Absolutely, I'll keep you posted.", "Com certeza, te mantenho informado."]] }
  ] },
  { id: "negotiation", lv: "C", t: "Negociação", d: "Negocie preço com um cliente.", turns: [
    { npc: ["The budget is a bit higher than we expected.", "O orçamento está um pouco acima do esperado."], opts: [["I understand. Which part concerns you the most?", "Entendo. Que parte te preocupa mais?"], ["I see where you're coming from.", "Entendo seu ponto de vista."]] },
    { npc: ["Mainly the design phase. It seems expensive.", "Principalmente a fase de design. Parece cara."], opts: [["That phase saves you money later on.", "Essa fase economiza dinheiro mais tarde."], ["We could reduce the scope to lower the cost.", "Poderíamos reduzir o escopo para baixar o custo."]] },
    { npc: ["If we sign today, is there any flexibility?", "Se fecharmos hoje, há alguma flexibilidade?"], opts: [["I could offer a ten percent discount.", "Eu poderia oferecer dez por cento de desconto."], ["Let me check with my team and get back to you.", "Deixa eu ver com o meu time e te dou retorno."]] },
    { npc: ["Deal. Let's move forward.", "Fechado. Vamos em frente."], opts: [["Great, I'll send the contract this afternoon.", "Ótimo, envio o contrato hoje à tarde."]] }
  ] },
  { id: "network", lv: "C", t: "Networking", d: "Puxe papo num evento.", turns: [
    { npc: ["Great talk, wasn't it?", "Ótima palestra, né?"], opts: [["Absolutely. The part about AI was fascinating.", "Com certeza. A parte sobre IA foi fascinante."], ["It was. I hadn't thought about it that way.", "Foi. Eu não tinha pensado por esse lado."]] },
    { npc: ["What brings you to the conference?", "O que te traz à conferência?"], opts: [["I'm looking for new ideas for my team.", "Estou buscando ideias novas para o meu time."], ["I'm here to meet people in the industry.", "Vim conhecer pessoas da área."]] },
    { npc: ["Nice. What do you work on?", "Legal. Com o que você trabalha?"], opts: [["I lead a small product team in São Paulo.", "Lidero um pequeno time de produto em São Paulo."], ["I work in marketing for a tech startup.", "Trabalho com marketing numa startup de tecnologia."]] },
    { npc: ["We should keep in touch. Are you on LinkedIn?", "Vamos manter contato. Você está no LinkedIn?"], opts: [["Sure, let's connect!", "Claro, vamos nos conectar!"]] }
  ] }
];

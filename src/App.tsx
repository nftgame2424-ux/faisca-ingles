import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Icon, type IconName } from "./components/Icon";
import { Toaster } from "./components/ui";
import { useAppState } from "./lib/state";
import Run, { Summary } from "./screens/Run";
import { Home, Onboarding, Train, UnitScreen } from "./screens/Learn";
import { BossBattle, HeroCreate, HeroScreen, Shop, World } from "./screens/Rpg";
import { LootOverlay } from "./components/Hero";
import { Blitz, Memory, Stories, StoryScreen } from "./screens/Games";
import { DialogueScreen, MicHelp, SoundScreen, SpeakHub, Twisters, TwisterScreen, Warmup } from "./screens/Speak";
import { ChatList, ChatRoom } from "./screens/Chat";
import { History } from "./screens/History";
import { Settings } from "./screens/Settings";

const TABS: { to: string; label: string; icon: IconName; match: string[] }[] = [
  { to: "/", label: "Hoje", icon: "home", match: ["/"] },
  { to: "/path", label: "Mundo", icon: "map", match: ["/path", "/unit", "/boss"] },
  { to: "/train", label: "Treinar", icon: "grid", match: ["/train", "/stories", "/story"] },
  { to: "/speak", label: "Falar", icon: "mic", match: ["/speak", "/sound", "/twister", "/chat", "/michelp"] },
  { to: "/hero", label: "Herói", icon: "sword", match: ["/hero", "/shop", "/history", "/settings"] }
];
const FULLSCREEN = ["/run", "/summary", "/blitz", "/memory", "/warmup", "/chat/room", "/onboard", "/dialogue", "/boss"];

function Shell() {
  const s = useAppState();
  const loc = useLocation();
  const full = FULLSCREEN.some((p) => loc.pathname.startsWith(p));
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  if (!s.onboarded && loc.pathname !== "/onboard") return <Navigate to="/onboard" replace />;
  const active = (t: (typeof TABS)[number]) => t.to === "/" ? loc.pathname === "/" : t.match.some((m) => loc.pathname.startsWith(m));
  return (
    <>
      <main className={`app${full ? " full" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboard" element={<Onboarding />} />
          <Route path="/path" element={<World />} />
          <Route path="/path/:lv" element={<World />} />
          <Route path="/boss/:id" element={<BossBattle />} />
          <Route path="/hero" element={<HeroScreen />} />
          <Route path="/hero/new" element={<HeroCreate />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/unit/:lv/:u" element={<UnitScreen />} />
          <Route path="/train" element={<Train />} />
          <Route path="/run" element={<Run />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/blitz" element={<Blitz />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/story/:lv" element={<StoryScreen />} />
          <Route path="/speak" element={<SpeakHub />} />
          <Route path="/sound/:id" element={<SoundScreen />} />
          <Route path="/twisters" element={<Twisters />} />
          <Route path="/twister/:i" element={<TwisterScreen />} />
          <Route path="/warmup" element={<Warmup />} />
          <Route path="/dialogue/:id" element={<DialogueScreen />} />
          <Route path="/michelp" element={<MicHelp />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/room" element={<ChatRoom />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!full && (
        <nav className="tabbar" aria-label="Principal">
          <div className="in">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} className={active(t) ? "on" : ""} end={t.to === "/"}>
                <Icon n={t.icon} />{t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
      {!loc.pathname.startsWith("/run") && <LootOverlay />}
      <Toaster />
    </>
  );
}

export default function App() {
  return <HashRouter><Shell /></HashRouter>;
}

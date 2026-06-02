import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { asset } from "./assets";
import { firstGuideLine, guideLines, portfolio, sculptures, type LinkItem, type Sculpture, type Vec3, type Work, type WorldTarget, worldTargets } from "./data";

const SceneRoot = lazy(() => import("./SceneRoot"));

type Modal =
  | { type: "work"; work: Work }
  | { type: "cinema" }
  | { type: "contact" }
  | { type: "podcasts" }
  | { type: "tutorials" }
  | { type: "sculpture"; sculpture: Sculpture }
  | { type: "guide"; line: typeof firstGuideLine; visit: number };

export type MobileInput = {
  active: boolean;
  move: number;
  turn: number;
};

const START_POSITION: Vec3 = [0, 1, 9];

function distance2D(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function createMobileInput(): MobileInput {
  return { active: false, move: 0, turn: 0 };
}

function useNearestTarget(playerPosition: Vec3) {
  return useMemo(() => {
    let closest: (WorldTarget & { distance: number }) | null = null;
    for (const target of worldTargets) {
      const distance = distance2D(playerPosition, target.position);
      if (distance <= target.radius && (!closest || distance < closest.distance)) {
        closest = { ...target, distance };
      }
    }

    return closest;
  }, [playerPosition]);
}

function AchievementHud({ exploredIds, targets }: { exploredIds: Set<string>; targets: WorldTarget[] }) {
  const [expanded, setExpanded] = useState(false);
  const explored = targets.filter((target) => exploredIds.has(target.id));
  const remaining = targets.filter((target) => !exploredIds.has(target.id));
  const percent = Math.min(100, Math.round((explored.length / Math.max(targets.length, 1)) * 100));

  return (
    <aside className={expanded ? "achievement-hud is-expanded" : "achievement-hud"} aria-label="探索进度">
      <button type="button" onClick={() => setExpanded((value) => !value)}>
        <span>探索</span>
        <strong>
          {explored.length}/{targets.length}
        </strong>
        <i>
          <b style={{ width: `${percent}%` }} />
        </i>
      </button>
      {expanded ? (
        <div className="achievement-details">
          <header className="achievement-details-header">
            <span>Exploration Log</span>
            <strong>{percent}%</strong>
          </header>
          <div className="achievement-section-grid">
            <section>
              <h3>已探索</h3>
              {explored.length ? (
                <ul>{explored.map((target) => <li key={target.id}>{target.label}</li>)}</ul>
              ) : (
                <p>还没有记录。</p>
              )}
            </section>
            <section>
              <h3>未探索</h3>
              <ul>{remaining.map((target) => <li key={target.id}>{target.label}</li>)}</ul>
            </section>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function InteractionHint({ target, nudge }: { target: WorldTarget | null; nudge: string }) {
  const desktopText =
    nudge ||
    (target ? (target.type === "guide" ? `按 1 或点击，与「${target.label}」对话` : `按 E 或点击，与「${target.label}」互动`) : null);
  const mobileText = nudge ? "再靠近一点" : target ? (target.type === "guide" ? "点右下角对话" : "点右下角互动") : null;

  return (
    <aside className={target || nudge ? "interaction-hint is-ready" : "interaction-hint"}>
      <span className="hint-dot" />
      <p>
        {desktopText ? (
          <>
            <span className="desktop-control-copy">{desktopText}</span>
            <span className="mobile-control-copy">{mobileText}</span>
          </>
        ) : (
          <>
            <span className="movement-hint desktop-control-copy">
              <span>键盘</span>
              <span className="movement-keys" aria-label="W A S D">
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd>
              </span>
              <span>控制行走；靠近展板、雕塑、帐篷、摊位、向导或石碑会出现互动提示</span>
            </span>
            <span className="movement-hint mobile-control-copy">
              <span>摇杆移动 · 右侧看 · 靠近互动</span>
            </span>
          </>
        )}
      </p>
    </aside>
  );
}

function LoadingOverlay() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 9)), 120);
    const hide = window.setTimeout(() => setVisible(false), 1800);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <motion.div className="loading-card" animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }} transition={{ y: { duration: 2.4, repeat: Infinity } }}>
        <span className="loading-kicker">正在铺设广场石砖</span>
        <strong>{Math.round(progress)}%</strong>
        <div className="loading-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>首屏只加载灰盒场景和海报，视频会在你打开弹窗时才进入页面。</p>
      </motion.div>
    </div>
  );
}

function useVideoCleanup() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const cleanup = () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    window.addEventListener("portfolio:pause-videos", cleanup);
    return () => {
      window.removeEventListener("portfolio:pause-videos", cleanup);
      cleanup();
    };
  }, []);

  return videoRef;
}

function VideoPlayer({ work, compact = false }: { work: Work; compact?: boolean }) {
  const ref = useVideoCleanup();
  const isPlaceholder = work.id.startsWith("placeholder_");

  if (!work.videoPath) {
    return (
      <div className="video-placeholder">
        {isPlaceholder ? (
          <div className="video-placeholder-blank" />
        ) : (
          <img alt={`${work.title} 海报`} src={work.posterPath} />
        )}
        <div>
          <strong>暂不可播放 / Not Available Online</strong>
          <span>这部作品仍在建造中。</span>
          <span>This work is still touring or has not been released online.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "video-frame is-compact" : "video-frame"}>
      <video ref={ref} controls onPlay={() => window.dispatchEvent(new Event("portfolio:video-play"))} playsInline poster={work.posterPath} preload="metadata" src={work.videoPath} />
    </div>
  );
}

function WorkModal({ work }: { work: Work }) {
  return (
    <div className="video-modal-grid work-modal-grid">
      <div className="work-media-column">
        <VideoPlayer work={work} />
      </div>
      <article className="work-copy work-copy-a24 work-copy-editorial">
        <header className="work-copy-header">
          <div className="work-year-line">
            <strong>{work.year}</strong>
          </div>
          <h2 className="work-title-stack">
            <span>{work.title}</span>
            <em>{work.titleEn}</em>
          </h2>
        </header>
        <dl className="work-meta-grid work-meta-rowline">
          <div>
            <dt>委托方 / Client</dt>
            <dd>{work.client}</dd>
            <dd className="meta-en">{work.clientEn}</dd>
          </div>
        </dl>
        <section className="work-description-pair">
          <h3>
            简介<span>Synopsis</span>
          </h3>
          <p className="copy-cn">{work.description}</p>
          <p className="copy-en">{work.descriptionEn}</p>
        </section>
      </article>
    </div>
  );
}

function SculptureModal({ sculpture }: { sculpture: Sculpture }) {
  return (
    <article className="sculpture-layout">
      <section className="sculpture-copy">
        <span className="eyebrow">{sculpture.artifact}</span>
        <h2 className="sculpture-title">
          <span>{sculpture.title}</span>
          <em>{sculpture.titleEn}</em>
        </h2>
        <div className="sculpture-body">{sculpture.body.map((line) => <p key={line}>{line}</p>)}</div>
        {sculpture.highlights?.length ? <ul className="sculpture-chip-list">{sculpture.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        {sculpture.note ? <p className="sculpture-note">{sculpture.note}</p> : null}
      </section>
    </article>
  );
}

function GuideModal({ line, visit, onFinish }: { line: typeof firstGuideLine; visit: number; onFinish: () => void }) {
  const [reaction, setReaction] = useState<string | null>(null);
  const choices = [
    { label: "先去看展板", reaction: "（Jarvis点点头，爪尖在空气里画了一个小箭头。）好呀，展板们已经把灯打开了。" },
    { label: "想听小电台", reaction: "（Jarvis耳朵一竖。）收到。小电台今天信号很好，会把故事调到温柔频道。" },
    { label: "再随便逛逛", reaction: "（Jarvis轻轻眨眼。）最好的路线通常不是路线。慢慢走，广场会自己介绍自己。" }
  ];

  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(onFinish, 1500);
    return () => window.clearTimeout(timer);
  }, [onFinish, reaction]);

  return (
    <article className="guide-dialog">
      <picture className="guide-portrait">
        <img alt="向导Jarvis立绘" src={asset("/assets/models/characters/booth-cat-profile.webp")} />
      </picture>
      <section className="guide-textbox">
        <div className="guide-nameplate">
          <strong>{line.title}</strong>
          <span>Guide Jarvis / 第 {visit} 次相遇</span>
        </div>
        <p>{reaction ?? line.text}</p>
        {reaction ? null : (
          <div className="guide-choice-layer" aria-label="向导Jarvis的选择">
            {choices.map((choice) => (
              <button key={choice.label} type="button" onClick={() => setReaction(choice.reaction)}>
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

function LinkCollection({ eyebrow, items, title, titleEn, type }: { eyebrow: string; items: LinkItem[]; title: string; titleEn: string; type: "podcast" | "tutorial" }) {
  return (
    <div className="link-collection-layout">
      <header>
        <span className="eyebrow">{eyebrow}</span>
        <h2>
          <span>{title}</span>
          <em>{titleEn}</em>
        </h2>
      </header>
      <div className="link-card-grid">
        {items.map((item) => (
          <button key={item.id} className="link-card" type="button" onClick={() => window.open(item.externalUrl, "_blank", "noopener,noreferrer")}>
            <img alt="" src={item.coverPath} />
            <span>{type === "podcast" ? item.show : item.platform}</span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CinemaModal() {
  const playable = portfolio.works.filter((work) => work.videoPath);
  const [selected, setSelected] = useState<Work>(() => playable[Math.floor(Math.random() * playable.length)] ?? portfolio.works[0]);

  return (
    <div className="cinema-layout cinema-layout-editorial">
      <section className="cinema-feature">
        <header className="modal-editorial-header">
          <span className="eyebrow">Circus Cinema</span>
          <h2>
            <span>马戏影院</span>
            <em>Circus Cinema</em>
          </h2>
        </header>
        <VideoPlayer work={selected} compact />
      </section>
      <aside className="schedule-board">
        <header className="schedule-heading">
          <span>Program</span>
          <h3>
            今日排片表<em>Today's Program</em>
          </h3>
        </header>
        <div className="schedule-list">
          {portfolio.works.map((work, index) => (
            <button key={work.id} className={selected.id === work.id ? "schedule-item is-active" : "schedule-item"} disabled={!work.videoPath} type="button" onClick={() => setSelected(work)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>
                {work.title}
                <small>{work.titleEn}</small>
              </strong>
              {work.videoPath ? null : <em>暂不可播放</em>}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ContactModal() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="contact-layout contact-layout-editorial">
      <article className="contact-copy">
        <header className="modal-editorial-header">
          <span className="eyebrow">Collab Shop</span>
          <h2>
            <span>合作小铺</span>
            <em>Collab Shop</em>
          </h2>
        </header>
        <div className="contact-copy-body">
          <p>简单写下项目方向和联系方式，点击发送后会唤起你的本地邮件客户端，收件人为{portfolio.contact.email}。</p>
          <p>Leave a short note about your project and contact details. Sending will open your local email client with {portfolio.contact.email} as the recipient.</p>
        </div>
      </article>
      <form
        className="contact-form"
        onSubmit={(event) => {
          event.preventDefault();
          const subject = encodeURIComponent(`合作小铺 / ${name || "来自个人主页的访客"}`);
          const body = encodeURIComponent([`称呼：${name || "未填写"}`, `联系方式：${contact || "未填写"}`, "", note || "想聊聊合作可能。"].join("\n"));
          window.location.href = `mailto:${portfolio.contact.email}?subject=${subject}&body=${body}`;
        }}
      >
        <div className="contact-form-heading">
          <span>Project Note</span>
          <strong>把想合作的事留在这里</strong>
        </div>
        <label>
          你的称呼 / Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="怎么称呼你？" />
        </label>
        <label>
          联系方式 / Contact
          <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="邮箱 / 微信 / 其他" />
        </label>
        <label>
          合作内容 / Project Note
          <textarea required value={note} onChange={(event) => setNote(event.target.value)} placeholder="简单说说项目、时间、预算或你最想一起完成的东西。" />
        </label>
        <button type="submit">发送邮件 / Send Email</button>
      </form>
    </div>
  );
}

function ModalLayer({ modal, onClose }: { modal: Modal | null; onClose: () => void }) {
  const close = () => {
    window.dispatchEvent(new Event("portfolio:pause-videos"));
    onClose();
  };

  return (
    <AnimatePresence>
      {modal ? (
        <motion.div className={`modal-backdrop modal-backdrop-${modal.type}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section className={`modal-panel modal-${modal.type}`} role="dialog" aria-modal="true" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.24, ease: "easeOut" }}>
            <button className="modal-close" type="button" onClick={close} aria-label="关闭弹窗">
              Close
            </button>
            {modal.type === "work" ? <WorkModal work={modal.work} /> : null}
            {modal.type === "cinema" ? <CinemaModal /> : null}
            {modal.type === "contact" ? <ContactModal /> : null}
            {modal.type === "podcasts" ? <LinkCollection eyebrow="Radio" items={portfolio.podcasts} title="小电台" titleEn="Tiny Radio" type="podcast" /> : null}
            {modal.type === "tutorials" ? <LinkCollection eyebrow="Notebook" items={portfolio.tutorials} title="制作手册" titleEn="Making Notes" type="tutorial" /> : null}
            {modal.type === "sculpture" ? <SculptureModal sculpture={modal.sculpture} /> : null}
            {modal.type === "guide" ? <GuideModal line={modal.line} visit={modal.visit} onFinish={close} /> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MobileControls({ canInteract, disabled, inputRef, interactLabel, onInteract }: { canInteract: boolean; disabled: boolean; inputRef: React.MutableRefObject<MobileInput>; interactLabel: string; onInteract: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const radius = 48;

  const reset = useCallback(() => {
    inputRef.current.active = false;
    inputRef.current.move = 0;
    inputRef.current.turn = 0;
    setKnob({ x: 0, y: 0 });
    pointerId.current = null;
  }, [inputRef]);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(any-pointer: coarse)");
    const widthQuery = window.matchMedia("(max-width: 920px)");
    const update = () => setEnabled(pointerQuery.matches && widthQuery.matches);
    update();
    pointerQuery.addEventListener("change", update);
    widthQuery.addEventListener("change", update);
    return () => {
      pointerQuery.removeEventListener("change", update);
      widthQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (disabled || !enabled) reset();
  }, [disabled, enabled, reset]);

  if (!enabled || disabled) return null;

  const applyPointer = (x: number, y: number) => {
    const dx = x - origin.current.x;
    const dy = y - origin.current.y;
    const distance = Math.hypot(dx, dy);
    const clamp = distance > radius ? radius / distance : 1;
    const knobX = dx * clamp;
    const knobY = dy * clamp;
    inputRef.current.active = true;
    inputRef.current.turn = Math.abs(knobX / radius) > 0.1 ? knobX / radius : 0;
    inputRef.current.move = Math.abs(knobY / radius) > 0.1 ? -knobY / radius : 0;
    setKnob({ x: knobX, y: knobY });
  };

  return (
    <div className="mobile-controls" aria-label="移动端控制">
      <div
        className="mobile-joystick"
        role="application"
        aria-label="拖动摇杆移动小猫"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const box = event.currentTarget.getBoundingClientRect();
          origin.current = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
          pointerId.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          applyPointer(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (pointerId.current !== event.pointerId) return;
          event.preventDefault();
          event.stopPropagation();
          applyPointer(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (pointerId.current === event.pointerId) reset();
        }}
        onPointerCancel={(event) => {
          if (pointerId.current === event.pointerId) reset();
        }}
      >
        <span className="mobile-joystick-ring" />
        <span className="mobile-joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      {canInteract ? (
        <button className="mobile-interact-button" type="button" onClick={onInteract} onPointerDown={(event) => event.stopPropagation()}>
          {interactLabel}
        </button>
      ) : null}
    </div>
  );
}

function MusicButton({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"locked" | "playing" | "muted" | "blocked">("locked");

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.38;
    }
    return audioRef.current;
  }, [src]);

  const play = useCallback(async () => {
    const audio = getAudio();
    try {
      audio.muted = false;
      await audio.play();
      setState("playing");
    } catch {
      setState("blocked");
    }
  }, [getAudio]);

  useEffect(() => {
    if (state !== "locked") return;
    const unlock = () => void play();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [play, state]);

  useEffect(() => {
    const mute = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.muted = true;
      setState("muted");
    };
    window.addEventListener("portfolio:video-play", mute);
    return () => window.removeEventListener("portfolio:video-play", mute);
  }, []);

  const toggle = () => {
    const audio = getAudio();
    if (state === "playing") {
      audio.muted = true;
      setState("muted");
      return;
    }
    void play();
  };

  const label = state === "muted" ? "恢复播放背景音乐" : "静音背景音乐";
  return (
    <button aria-label={label} className={state === "muted" ? "music-button is-muted" : "music-button"} title={label} type="button" onClick={toggle}>
      <span aria-hidden="true" className="speaker-icon">
        <span className="speaker-core" />
        <span className="speaker-wave wave-one" />
        <span className="speaker-wave wave-two" />
      </span>
    </button>
  );
}

export default function App() {
  const [playerPosition, setPlayerPosition] = useState<Vec3>(START_POSITION);
  const [modal, setModal] = useState<Modal | null>(null);
  const [nudge, setNudge] = useState("");
  const [guideVisits, setGuideVisits] = useState(0);
  const [exploredIds, setExploredIds] = useState<Set<string>>(() => new Set());
  const mobileInputRef = useRef<MobileInput>(createMobileInput());
  const nearestTarget = useNearestTarget(playerPosition);

  const markExplored = useCallback((id: string) => {
    setExploredIds((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  const openGuide = useCallback(() => {
    setGuideVisits((visits) => {
      const nextVisit = visits + 1;
      setModal({
        type: "guide",
        line: visits === 0 ? firstGuideLine : guideLines[(visits - 1) % guideLines.length],
        visit: nextVisit
      });
      return nextVisit;
    });
  }, []);

  const interactWith = useCallback(
    (target: WorldTarget) => {
      markExplored(target.id);
      if (target.type === "work") {
        const work = portfolio.works.find((item) => item.id === target.workId);
        if (work) setModal({ type: "work", work });
        return;
      }
      if (target.type === "cinema" || target.type === "contact" || target.type === "podcasts" || target.type === "tutorials") {
        setModal({ type: target.type });
        return;
      }
      if (target.type === "guide") {
        openGuide();
        return;
      }
      if (target.type === "sculpture") {
        const sculpture = sculptures.find((item) => item.code === target.sculptureCode);
        if (sculpture) setModal({ type: "sculpture", sculpture });
        return;
      }
      if (target.type === "social") {
        window.open(portfolio.socials[target.socialKey], "_blank", "noopener,noreferrer");
      }
    },
    [markExplored, openGuide]
  );

  const interactById = useCallback(
    (id: string) => {
      const target = worldTargets.find((item) => item.id === id);
      if (!target) return;
      if (nearestTarget?.id === id) {
        interactWith(target);
        setNudge("");
        return;
      }
      setNudge(`再靠近一点，就能和「${target.label}」互动。`);
      window.setTimeout(() => setNudge(""), 1800);
    },
    [interactWith, nearestTarget]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (modal) return;
      if (event.key === "1") {
        const guide = worldTargets.find((target) => target.type === "guide");
        if (guide && distance2D(playerPosition, guide.position) <= guide.radius) {
          interactWith(guide);
        } else {
          setNudge("再靠近一点，向导Jarvis才听得见你的脚步。");
          window.setTimeout(() => setNudge(""), 1800);
        }
      }
      if (event.key.toLowerCase() === "e" && nearestTarget) interactWith(nearestTarget);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [interactWith, modal, nearestTarget, playerPosition]);

  return (
    <main className="app-shell">
      <Suspense fallback={<div className="scene-fallback">正在召唤 3D 广场...</div>}>
        <SceneRoot
          activeTargetId={nearestTarget?.id ?? null}
          controlsDisabled={!!modal}
          isContactDialogOpen={modal?.type === "contact" || modal?.type === "guide"}
          labelsVisible={!modal}
          mobileInputRef={mobileInputRef}
          onInteractTarget={interactById}
          onPlayerMove={setPlayerPosition}
          playerPosition={playerPosition}
        />
      </Suspense>
      <InteractionHint nudge={nudge} target={nearestTarget} />
      <AchievementHud exploredIds={exploredIds} targets={worldTargets} />
      <MobileControls canInteract={!!nearestTarget} disabled={!!modal} inputRef={mobileInputRef} interactLabel={nearestTarget?.type === "guide" ? "对话" : "互动"} onInteract={() => nearestTarget && interactById(nearestTarget.id)} />
      <MusicButton src={asset("/assets/audio/time-savings-jar.m4a")} />
      <ModalLayer modal={modal} onClose={() => setModal(null)} />
      <LoadingOverlay />
    </main>
  );
}

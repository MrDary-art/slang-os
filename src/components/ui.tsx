import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowRight, X, Volume2, VolumeX } from 'lucide-react';

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  const animationRef = useRef<Animation | null>(null);
  const mountedRef = useRef(false);
  const closingRef = useRef(false);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    mountedRef.current = true;
    closingRef.current = false;
    if (el) {
      // Keyboard entry stays immediate; the native dialog owns focus and trapping.
      el.dataset.instant = previous?.matches(':focus-visible') ? 'true' : 'false';
      if (!el.open) el.showModal();
    }
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      mountedRef.current = false;
      animationRef.current?.cancel();
      el?.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);

  function requestClose(instant = false) {
    const el = ref.current;
    const reducedMotion = document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (instant || reducedMotion || !el?.animate) {
      closingRef.current = false;
      animationRef.current?.cancel();
      closeRef.current();
      return;
    }
    if (closingRef.current) return;
    closingRef.current = true;
    el.dataset.state = 'closing';
    const current = getComputedStyle(el);
    // Starting from the presentation value keeps a rapid open/close continuous.
    animationRef.current = el.animate([
      { opacity: current.opacity, transform: current.transform },
      { opacity: 0, transform: 'translateY(6px) scale(0.97)' },
    ], { duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' });
    void animationRef.current.finished.then(() => {
      if (mountedRef.current && closingRef.current) closeRef.current();
    }).catch(() => { /* Escape or unmount cancels the optional visual exit. */ });
  }

  return <dialog ref={ref} className={`modal motion-dialog ${wide ? 'modal-wide' : ''}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); requestClose(true); }} onClick={e => { if (e.target === e.currentTarget) requestClose(e.detail === 0); }}>
    <div className="modal-head"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Закрыть окно" onClick={e => requestClose(e.detail === 0)}><X size={22} /></button></div>
    <div className="modal-content">{children}</div>
  </dialog>;
}
export function Lex({ small = false, happy = false }: { small?: boolean; happy?: boolean }) {
  const gradientId = useId();
  return <svg className={`lex ${small ? 'lex-small' : ''}`} viewBox="0 0 100 100" role="img" aria-label="ЛЕКС — цифровой помощник">
    <defs><linearGradient id={gradientId} x1="19" y1="15" x2="76" y2="85" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF3D1" stopOpacity=".95" /><stop offset=".48" stopColor="#E9D9C4" stopOpacity=".7" /><stop offset="1" stopColor="#AA937A" stopOpacity=".8" /></linearGradient></defs>
    <path className="lex-glass-body" d="M49 15c22 0 35 10 35 30v10c0 17-11 27-28 28l-18 9 2-11C24 78 16 69 16 55V45c0-20 12-30 33-30Z" fill={`url(#${gradientId})`} stroke="#8C755D" strokeOpacity=".42" strokeWidth="1.25" />
    <path d="M26 39c2-10 11-16 24-16h11" fill="none" stroke="#FFF9ED" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
    {happy ? <g className="lex-face" fill="none" stroke="var(--lex-ink, #362616)" strokeWidth="3" strokeLinecap="round"><path d="m34 48 5-4 5 4m12 0 5-4 5 4M43 60q7 6 14 0" /></g> : <g className="lex-face" fill="var(--lex-ink, #362616)"><rect x="35" y="43" width="6" height="12" rx="3" /><rect x="58" y="43" width="6" height="12" rx="3" /><path d="M44 62h12" stroke="var(--lex-ink, #362616)" strokeWidth="2" strokeLinecap="round" /></g>}
  </svg>;
}
export function LexNote({ children, happy = false }: { children: ReactNode; happy?: boolean }) {
  return <div className="lex-note"><Lex small happy={happy} /><div><strong>ЛЕКС <span>на связи</span></strong><div>{children}</div></div></div>;
}
export function LinkButton({ to, children, secondary = false, className = '' }: { to: string; children: ReactNode; secondary?: boolean; className?: string }) {
  return <a className={`button ${secondary ? 'button-secondary' : ''} ${className}`} href={`#${to}`}>{children}<ArrowRight size={18} /></a>;
}
export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className="progress-wrap"><div className="progress-caption"><span>{label}</span><span>{value} / {max}</span></div><progress value={value} max={max} aria-label={label} /></div>;
}
export function Empty({ children }: { children: ReactNode }) { return <div className="empty-state"><p>{children}</p></div>; }
let audioContext: AudioContext | null = null;
export function playTone(enabled: boolean, success = true) {
  if (!enabled) return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(success ? 660 : 220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(success ? 880 : 165, audioContext.currentTime + .1);
    gain.gain.setValueAtTime(.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .16);
    oscillator.start(); oscillator.stop(audioContext.currentTime + .18);
  } catch { /* Sound is optional; unavailable audio never blocks the quest. */ }
}
export function SoundIcon({ enabled }: { enabled: boolean }) { return enabled ? <Volume2 size={19} /> : <VolumeX size={19} />; }

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowRight, X, Sparkles, Volume2, VolumeX } from 'lucide-react';

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { el?.close(); document.body.style.overflow = old; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); closeRef.current(); }} onClick={e => { if (e.target === e.currentTarget) closeRef.current(); }}>
    <div className="modal-head"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Закрыть окно" onClick={onClose}><X size={22} /></button></div>
    <div className="modal-content">{children}</div>
  </dialog>;
}
export function Lex({ small = false, happy = false }: { small?: boolean; happy?: boolean }) {
  return <svg className={`lex ${small ? 'lex-small' : ''}`} viewBox="0 0 100 100" role="img" aria-label="ЛЕКС — цифровой помощник">
    <path d="M50 9 85 29v42L50 91 15 71V29z" fill="#181e36" stroke="#9672ff" strokeWidth="2" />
    <path d="m50 9 0 19 21 12 14-11M15 29l14 11v24L15 71m35 20V72l21-12 14 11" stroke="#9672ff" fill="none" strokeWidth="1.2" opacity=".55" />
    <rect x="27" y="33" width="46" height="34" rx="10" fill="#32ddcc" />
    {happy ? <path d="m36 48 5-4 5 4m9 0 5-4 5 4M43 55q7 7 14 0" fill="none" stroke="#10192a" strokeWidth="3" strokeLinecap="round" /> : <><rect x="37" y="44" width="6" height="12" rx="3" fill="#10192a" /><rect x="57" y="44" width="6" height="12" rx="3" fill="#10192a" /></>}
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
export function Empty({ children }: { children: ReactNode }) { return <div className="empty-state"><Sparkles size={28} /><p>{children}</p></div>; }
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

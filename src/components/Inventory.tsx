import { BookOpen, FileSearch, CheckCircle2 } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { cases, chapters } from '../data/cases';
import { lexicon } from '../data/lexicon';
import { Empty, Modal } from './ui';

export function Inventory({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const clues = cases.flatMap(c => c.evidence).filter(e => state.discoveredClueIds.includes(e.id));
  return <Modal title="Материалы расследования" onClose={onClose} wide><section><h3><FileSearch size={19} /> Улики · {clues.length}</h3>{clues.length ? <div className="inventory-clues">{clues.map(clue => <details key={clue.id}><summary>{clue.title}</summary><p>{clue.text}</p></details>)}</div> : <Empty>Открывай материалы в сцене — найденные улики появятся здесь.</Empty>}</section><section><h3><BookOpen size={19} /> Открытые слова · {state.discoveredWordIds.length}</h3><div className="word-chips">{state.discoveredWordIds.map(id => <a key={id} href={`#/word/${id}`} onClick={onClose}>{lexicon.find(w => w.id === id)?.word}</a>)}</div>{!state.discoveredWordIds.length && <p className="muted">Реши первое задание, чтобы открыть лексикографическое досье.</p>}</section><section><h3><CheckCircle2 size={19} /> Восстановленные модули</h3>{chapters.map(c => <div className={`module-row ${state.unlockedModuleIds.includes(c.id) ? 'mint' : 'muted'}`} key={c.id}>{state.unlockedModuleIds.includes(c.id) ? <CheckCircle2 size={18} /> : <span className="module-empty" />} {c.name}<span>{state.unlockedModuleIds.includes(c.id) ? 'Восстановлен' : 'Ожидает восстановления'}</span></div>)}</section></Modal>;
}

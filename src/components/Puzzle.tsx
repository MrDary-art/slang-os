import { ArrowDown, ArrowUp, Plus, RotateCcw, X } from 'lucide-react';
import type { Case } from '../data/cases';
import type { GameAction, MissionProgress } from '../store/game';

function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { seed = (seed * 1664525 + 1013904223) >>> 0; const j = seed % (i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function Puzzle({ task, progress, dispatch }: { task: Case; progress: MissionProgress; dispatch: (a: GameAction) => void }) {
  function answer(ids: string[]) { dispatch({ type: 'answer', id: task.id, answer: ids }); }
  if (task.pairs?.length) return <div className="matching-puzzle">{task.pairs.map(pair => <label className={`matching-row ${progress.matches[pair.id] ? 'matched' : ''}`} key={pair.id}><span>{pair.left}</span><span className="match-line" aria-hidden="true" /><select value={progress.matches[pair.id] ?? ''} onChange={e => dispatch({ type: 'match', id: task.id, pair: pair.id, value: e.target.value })} aria-label={`Соответствие: ${pair.left}`}><option value="" disabled>Выбери соответствие</option>{shuffled(pair.alternatives, task.id + pair.id.length).map(text => <option key={text} value={text}>{text}</option>)}</select></label>)}</div>;
  if (task.fragments?.length) {
    function move(index: number, delta: number) { const ids = [...progress.answer]; [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]]; answer(ids); }
    return <div className="builder-puzzle"><p className="puzzle-instruction">Нажимай на фрагменты, чтобы собрать {task.type === 'order' ? 'последовательность' : 'сообщение'}. Порядок можно изменить стрелками.</p><div className="assembly" aria-label="Собранное сообщение">{!progress.answer.length && <p className="assembly-empty">Выбранные фрагменты появятся здесь</p>}{progress.answer.map((id, i) => <div className="assembly-row" key={id}><span className="assembly-number">{i + 1}</span><span>{task.fragments?.find(f => f.id === id)?.text}</span><div className="assembly-controls"><button className="icon-button" aria-label={`Поднять фрагмент ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button className="icon-button" aria-label={`Опустить фрагмент ${i + 1}`} disabled={i === progress.answer.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button><button className="icon-button" aria-label={`Убрать фрагмент ${i + 1}`} onClick={() => answer(progress.answer.filter(x => x !== id))}><X size={16} /></button></div></div>)}</div><div className="fragment-bank">{shuffled(task.fragments, task.id * 17).map(fragment => <button className="fragment" key={fragment.id} data-fragment={fragment.id} disabled={progress.answer.includes(fragment.id)} onClick={() => answer([...progress.answer, fragment.id])}><Plus size={16} />{fragment.text}</button>)}</div><button className="text-button" disabled={!progress.answer.length} onClick={() => answer([])}><RotateCcw size={15} /> Очистить сборку</button></div>;
  }
  return <fieldset className="choice-puzzle"><legend className="sr-only">Выбери интерпретацию</legend>{task.options?.map((option, i) => <label className={`choice ${progress.answer[0] === option.id ? 'choice-selected' : ''}`} key={option.id}><input type="radio" name={`case-${task.id}`} value={option.id} checked={progress.answer[0] === option.id} onChange={() => answer([option.id])} /><span className="choice-letter">{String.fromCharCode(65 + i)}</span><span>{option.text}</span></label>)}</fieldset>;
}

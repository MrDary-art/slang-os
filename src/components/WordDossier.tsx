import { useId, useState } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { lexicon, categoryLabels } from '../data/lexicon';
import { sources } from '../data/research';

export function WordDossier({ id, compact = false }: { id: string; compact?: boolean }) {
  const entry = lexicon.find(word => word.id === id);
  const [tab, setTab] = useState('meaning');
  const instance = useId();
  if (!entry) return <p>Эта запись не найдена. <a href="#/dictionary">Открыть архив</a></p>;
  return <article className={`word-dossier ${compact ? 'compact-dossier' : ''}`}><div className="dossier-title"><div><span className="category-label">{categoryLabels[entry.category]}</span><h2>{entry.word}</h2><span className="muted">{entry.partOfSpeech}</span></div><BookOpen size={28} /></div>
    <div className="tabs" role="tablist" aria-label={`Сведения о слове ${entry.word}`}>
      {[['meaning', 'Значение'], ['origin', 'Происхождение'], ['context', 'Контекст']].map(([key, name]) => <button key={key} role="tab" id={`tab-${instance}-${key}`} aria-selected={tab === key} aria-controls={`panel-${instance}`} tabIndex={tab === key ? 0 : -1} className={tab === key ? 'active' : ''} onClick={() => setTab(key)} onKeyDown={e => { const keys = ['meaning', 'origin', 'context']; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const next = keys[(keys.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setTab(next); document.getElementById(`tab-${instance}-${next}`)?.focus(); } }}>{name}</button>)}
    </div>
    <div role="tabpanel" id={`panel-${instance}`} aria-labelledby={`tab-${instance}-${tab}`} className="dossier-panel">
      {tab === 'meaning' && <><h3>Что означает</h3><p>{entry.definitionRu}</p><div className="english-definition" lang="en"><span>Definition in English</span><p>{entry.definitionEn}</p></div><p className="muted">{entry.tone}</p></>}
      {tab === 'origin' && <><div className="source-chain">{entry.sourceForm}</div><p>{entry.etymology}</p><p><strong>Словообразование.</strong> {entry.formation}</p><div className="notice"><strong>Статус сведений</strong><p>{entry.etymologyStatus}</p></div><ul className="source-links">{entry.sourceIds.map(sourceId => { const source = sources.find(s => s.id === sourceId); return source ? <li key={sourceId}><a href={source.url} target="_blank" rel="noreferrer">{source.title} <ArrowUpRight size={14} /></a></li> : null; })}</ul></>}
      {tab === 'context' && <><h3>Авторский пример</h3><blockquote>{entry.example}</blockquote><h3>Нейтральная формулировка</h3><p>{entry.neutral}</p><p><strong>Сфера употребления.</strong> {entry.context}</p><div className="notice notice-warning">{entry.caution}</div></>}
    </div>{compact && <a className="quiet-link" href={`#/word/${entry.id}`}>Полное досье слова <ArrowUpRight size={15} /></a>}
  </article>;
}

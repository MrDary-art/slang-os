import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Search, X } from 'lucide-react';
import { categoryLabels, lexicon, type LexiconCategory } from '../data/lexicon';
import { useGame } from '../store/GameContext';
import { WordDossier } from '../components/WordDossier';
import { Empty, LinkButton } from '../components/ui';

const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');
export function Dictionary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LexiconCategory | 'all'>('all');
  const { state } = useGame();
  const words = lexicon.filter(word => (category === 'all' || word.category === category) && normalize([word.word, word.english, word.sourceForm, word.definitionRu, word.definitionEn].join(' ')).includes(normalize(query.trim())));
  return <main id="main" className="page page-enter"><div className="page-heading"><div><div className="case-label"><BookOpen size={18} /> Лексикографическое досье</div><h1>Архив слов</h1><p>Не просто перевод. Значение, происхождение и ситуация, в которой слово работает.</p></div><span className="archive-count">{lexicon.length}<small>RU / EN</small></span></div><div className="archive-controls"><label className="search-field"><Search size={20} /><span className="sr-only">Поиск по слову, источнику и определению</span><input type="search" placeholder="Найти слово, английский источник или значение…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={18} /></button>}</label><div className="filter-list" aria-label="Категории слов"><button className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Все слова</button>{Object.entries(categoryLabels).map(([id, label]) => <button key={id} className={category === id ? 'active' : ''} aria-pressed={category === id} onClick={() => setCategory(id as LexiconCategory)}>{label}</button>)}</div></div><div className="archive-status" role="status">Найдено: {words.length} из {lexicon.length}<span>Все записи доступны без прохождения игры</span></div><div className="word-grid">{words.map(word => <article className={`word-card category-${word.category}`} key={word.id}><div className="word-card-top"><span className="category-label">{categoryLabels[word.category]}</span>{state.discoveredWordIds.includes(word.id) && <span className="tag tag-success">Открыто в игре</span>}</div><h2><a href={`#/word/${word.id}`}>{word.word}</a></h2><small>{word.partOfSpeech.split(';')[0]}</small><p>{word.definitionRu}</p><a className="quiet-link" href={`#/word/${word.id}`}>Исследовать <ArrowRight size={17} /></a></article>)}</div>{!words.length && <Empty>По этому запросу ничего не найдено. Попробуй часть слова, английский источник или другую категорию.</Empty>}</main>;
}
export function WordPage({ id }: { id: string }) {
  const index = lexicon.findIndex(word => word.id === id);
  if (index < 0) return <main id="main" className="page narrow"><h1>Слово не найдено</h1><LinkButton to="/dictionary">Вернуться в архив</LinkButton></main>;
  const previous = lexicon[(index + lexicon.length - 1) % lexicon.length];
  const next = lexicon[(index + 1) % lexicon.length];
  return <main id="main" className="page word-page page-enter"><a className="quiet-link" href="#/dictionary"><ArrowLeft size={17} /> Все слова</a><h1 className="sr-only">{lexicon[index].word}</h1><WordDossier key={id} id={id} /><div className="word-navigation"><a href={`#/word/${previous.id}`}><ArrowLeft size={17} />{previous.word}</a><span>{index + 1} / {lexicon.length}</span><a href={`#/word/${next.id}`}>{next.word}<ArrowRight size={17} /></a></div></main>;
}

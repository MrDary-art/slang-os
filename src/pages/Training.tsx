import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, ScanLine, X } from 'lucide-react';
import { trainingQuestions, type TrainingQuestion } from '../data/training';
import { lexicon } from '../data/lexicon';
import { LexNote, Progress } from '../components/ui';

interface Round { question: TrainingQuestion; options: { text: string; original: number }[] }
function rounds(): Round[] { return [...trainingQuestions].sort(() => Math.random() - .5).slice(0, 5).map(question => ({ question, options: question.options.map((text, original) => ({ text, original })).sort(() => Math.random() - .5) })); }
export function Training() {
  const [questions, setQuestions] = useState<Round[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  function start() { setQuestions(rounds()); setAnswers([]); setSelected(null); setRevealed(false); }
  if (!questions.length) return <main id="main" className="page narrow training-start page-enter"><div className="training-symbol"><ScanLine size={48} /></div><h1>Проверь свой<br />языковой декодер</h1><p className="lead">Пять ситуаций. Пять выражений. Сможешь понять смысл без подсказок?</p><LexNote>Здесь можно потренироваться вне истории. Результат не влияет на очки расследования.</LexNote><button className="button" onClick={start}>Начать испытание <ArrowRight size={18} /></button></main>;
  if (answers.length === 5) {
    const correct = questions.filter((r, i) => r.question.correct === answers[i]).length;
    const mistakes = questions.filter((r, i) => r.question.correct !== answers[i]);
    return <main id="main" className="page narrow page-enter"><h1>Декодирование завершено</h1><div className="training-result"><strong>{correct}<span> / 5</span></strong><p>Точность: {correct * 20}% в этой тренировке</p></div><LexNote happy>{correct === 5 ? 'Все смыслы на месте. Применим их в расследовании?' : 'Каждая ошибка — повод проверить контекст. В архиве можно спокойно разобрать слова ещё раз.'}</LexNote>{mistakes.length > 0 && <><h2>Стоит повторить</h2><div className="word-chips">{mistakes.map(r => <a key={r.question.id} href={`#/word/${r.question.wordId}`}>{lexicon.find(w => w.id === r.question.wordId)?.word}</a>)}</div></>}<div className="actions"><button className="button" onClick={start}><RotateCcw size={17} /> Попробовать ещё</button><a className="quiet-link" href="#/board">К расследованию <ArrowRight size={17} /></a></div></main>;
  }
  const round = questions[answers.length];
  return <main id="main" className="page narrow training-page page-enter"><div className="case-label"><ScanLine size={18} /> Экспресс-декодер</div><h1>Поймай смысл</h1><Progress value={answers.length} max={5} label="Ситуации" /><h2>{round.question.prompt}</h2><fieldset className="choice-puzzle"><legend className="sr-only">Выбери ответ</legend>{round.options.map((option, i) => <label className={`choice ${selected === option.original ? 'choice-selected' : ''}`} key={option.original}><input type="radio" name="training-answer" checked={selected === option.original} disabled={revealed} onChange={() => setSelected(option.original)} /><span className="choice-letter">{String.fromCharCode(65 + i)}</span><span>{option.text}</span></label>)}</fieldset>{revealed && <div className={`notice ${selected === round.question.correct ? 'notice-success' : 'notice-warning'}`} role="status"><strong>{selected === round.question.correct ? <><Check size={18} /> Верно</> : <><X size={18} /> Сверим с контекстом</>}</strong><p>{round.question.explanation}</p><p>Точный смысл: {round.question.options[round.question.correct]}.</p></div>}<button className="button" disabled={selected === null} onClick={() => { if (!revealed) setRevealed(true); else { setAnswers([...answers, selected!]); setSelected(null); setRevealed(false); } }}>{revealed ? answers.length === 4 ? 'Посмотреть результат' : 'Следующая ситуация' : 'Проверить ответ'}<ArrowRight size={18} /></button></main>;
}

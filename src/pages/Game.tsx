import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, FileSearch, LockKeyhole, Map, Send, Trophy } from 'lucide-react';
import { cases, chapters } from '../data/cases';
import { useGame } from '../store/GameContext';
import { checkAnswer, emptyProgress, missionUnlocked } from '../store/game';
import { Inventory } from '../components/Inventory';
import { LexNote, LinkButton, Modal, playTone, Progress } from '../components/ui';
import { Puzzle } from '../components/Puzzle';
import { WordDossier } from '../components/WordDossier';
import { go } from '../app/router';

export const demoIds = [1, 7, 15];
export function Game({ id }: { id: number }) {
  const { state, dispatch, demo } = useGame();
  const task = cases.find(c => c.id === id);
  const [inventory, setInventory] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sendConfirm, setSendConfirm] = useState(false);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [mobileDossier, setMobileDossier] = useState(false);
  useEffect(() => { if (task) dispatch({ type: 'open', id: task.id }); setFeedback(''); setSendConfirm(false); setDossierId(null); }, [task, dispatch]);
  if (!task || (!demo && !missionUnlocked(state, id)) || (demo && !demoIds.includes(id))) return <main id="main" className="page narrow"><LockKeyhole size={40} /><h1>Это дело пока закрыто</h1><p>Задания открываются по порядку. Все материалы для следующего шага уже есть в доступной главе.</p><LinkButton to={demo ? '/jury' : '/board'}>Вернуться к карте</LinkButton></main>;
  const chapter = chapters[task.chapter - 1];
  const progress = state.missionProgress[id] ?? emptyProgress();
  const found = task.evidence.filter(e => progress.evidence.includes(e.id)).length;
  const needsEvidence = task.type === 'inspect' && found < task.evidence.length;
  const hasAnswer = task.pairs?.length ? task.pairs.every(p => !!progress.matches[p.id]) : progress.answer.length > 0;
  function submit() {
    const correct = checkAnswer(task!, progress);
    if (correct && task!.type === 'report') { setSendConfirm(true); return; }
    dispatch({ type: 'submit', id }); playTone(state.settings.soundEnabled, correct);
    if (!correct) {
      const response = task!.responses?.[progress.answer[0]];
      setFeedback(response ? `${response.speaker}: «${response.text}» ${response.explanation}` : 'Пока смысл не сходится с материалами дела. Сверь контекст, состав и порядок фрагментов. Попробуй ещё — дальнейшие ошибки после второй не увеличивают штраф.');
    } else setFeedback('');
  }
  function next() {
    if (demo) { const nextId = demoIds[demoIds.indexOf(id) + 1]; go(nextId ? `/demo/${nextId}` : '/demo-end'); }
    else go(id === 15 ? '/ending' : id % 5 === 0 ? '/board' : `/case/${id + 1}`);
  }
  const taskPanel = <><h3>Твоя задача</h3><p>{task.prompt}</p><Progress value={demo ? demoIds.indexOf(id) + (progress.complete ? 1 : 0) : cases.filter(c => c.chapter === task.chapter && state.completedMissionIds.includes(c.id)).length} max={demo ? 3 : 5} label={demo ? 'Демонстрация' : `Модуль «${chapter.name}»`} /><h3>Материалы сцены</h3><p className="muted">{found} из {task.evidence.length} улик изучено</p><button className="text-button" onClick={() => setInventory(true)}><FileSearch size={17} /> Открыть инвентарь</button><a className="text-button" href="#/dictionary"><BookOpen size={17} /> Архив слов</a></>;
  return <main id="main" className={`game-page chapter-${task.chapter} page-enter`}>
    {demo && <div className="demo-banner">Демонстрация для жюри · {demoIds.indexOf(id) + 1} / 3 · Основное сохранение не меняется <a href="#/jury">Завершить обзор</a></div>}
    <div className="game-top"><a className="quiet-link" href={demo ? '#/jury' : '#/board'}><ArrowLeft size={17} />{demo ? 'К обзору' : 'Карта расследования'}</a><span className="mono">{demo ? 'DEMO' : `ГЛАВА ${task.chapter}`} / {chapter.name}</span><span className="game-score"><Trophy size={17} />{state.score} очков</span></div>
    <div className="game-layout"><aside className="case-rail"><span className="case-label">Материалы дела</span><h2>{chapter.title}</h2><nav aria-label="Задания главы">{(demo ? demoIds.map(n => cases[n - 1]) : cases.filter(c => c.chapter === task.chapter)).map(c => <a key={c.id} href={demo || missionUnlocked(state, c.id) ? `#/${demo ? 'demo' : 'case'}/${c.id}` : undefined} aria-disabled={!demo && !missionUnlocked(state, c.id)} aria-current={c.id === id ? 'step' : undefined} className={`rail-mission ${c.id === id ? 'active' : ''}`}><span>{state.completedMissionIds.includes(c.id) ? <Check size={14} /> : c.id.toString().padStart(2, '0')}</span><span>{c.title}</span>{!demo && !missionUnlocked(state, c.id) && <LockKeyhole size={13} />}</a>)}</nav><div className="rail-actions"><button onClick={() => setInventory(true)}><FileSearch size={18} /> Улики</button><a href={demo ? '#/jury' : '#/board'}><Map size={18} /> Карта</a></div><p className="fine-print">Сюжетное время: {15 - task.chapter * 5 + 5} минут до защиты.<br />Реального таймера нет.</p></aside>
    <section className="game-scene" aria-labelledby="scene-title"><div className="scene-heading"><span className="tag">{demo ? `Демо ${demoIds.indexOf(id) + 1}` : `Задание ${id} из 15`}</span><span className="muted">{progress.complete ? 'Дело раскрыто' : 'Расследование идёт'}</span></div><h1 id="scene-title">{task.title}</h1><p className="scene-intro">{task.intro}</p>
    {!progress.complete ? <><div className="chat-scene">{task.messages.map((message, i) => <div className={`chat-message ${message.speaker === 'ЛЕКС' ? 'chat-lex' : ''}`} key={i}><span className={`avatar ${message.speaker === 'Макс' ? 'avatar-max' : message.speaker === 'Даша' ? 'avatar-dasha' : message.speaker === 'ЛЕКС' ? 'avatar-lex' : ''}`}>{message.speaker === 'Алексей Петрович' ? 'АП' : message.speaker[0]}</span><div><strong>{message.speaker}<span>{message.speaker === 'Алексей Петрович' ? 'преподаватель' : message.speaker === 'ЛЕКС' ? 'помощник' : 'команда'}</span></strong><p>{message.text}</p></div></div>)}{task.decoder && <div className="decoder-error"><span className="mono">ДЕКОДЕР–404 / Ошибочная интерпретация</span><p>{task.decoder}</p></div>}</div>
    {task.evidence.length > 0 && <section className="evidence-section"><div className="section-heading"><h2><FileSearch size={18} /> Исследуй материалы</h2><span>{found} / {task.evidence.length}</span></div><div className="evidence-list">{task.evidence.map(e => <details key={e.id} open={progress.evidence.includes(e.id)}><summary onClick={event => { event.preventDefault(); dispatch({ type: 'evidence', id, clue: e.id }); }}><FileSearch size={17} /><span>{e.title}</span>{progress.evidence.includes(e.id) ? <Check size={17} /> : <PlusIndicator />}</summary>{progress.evidence.includes(e.id) && <p>{e.text}</p>}</details>)}</div></section>}
    <section className="puzzle-section"><h2>{task.prompt}</h2><Puzzle task={task} progress={progress} dispatch={dispatch} />{feedback && <div className="notice notice-error" role="alert">{feedback}</div>}<div className="puzzle-actions"><button className="button" onClick={submit} disabled={needsEvidence || !hasAnswer}>Проверить решение <ArrowRight size={17} /></button><button className="text-button hint-button" disabled={progress.hints >= 2} onClick={() => dispatch({ type: 'hint', id })}><CircleHelp size={17} /> Подсказка {progress.hints}/2 <small>−20</small></button></div>{needsEvidence && <p className="fine-print">Сначала открой все улики. Они помогут обосновать ответ.</p>}{progress.hints > 0 && <div className="hint-list" aria-live="polite">{Array.from({ length: progress.hints }, (_, i) => <LexNote key={i}>{task.hints?.[i] ?? task.hint}</LexNote>)}</div>}</section></> : <div className="mission-result" role="status"><div className="result-check"><Check size={30} /></div><h2>Смысл восстановлен</h2><div className="earned">+{progress.earned} очков</div><p>{task.explanation}</p><div className="word-chips">{task.words.map(word => <button key={word} onClick={() => setDossierId(word)}><BookOpen size={15} /> {wordLabel(word)}</button>)}</div>{task.words[0] && <WordDossier key={task.words[0]} id={task.words[0]} compact />}{id % 5 === 0 && !demo && <div className="module-restored"><Check size={22} /><strong>{chapter.restored}</strong><p>{chapter.lex}</p></div>}<div className="actions"><button className="button" onClick={next}>{demo && id === 15 ? 'Завершить демонстрацию' : id === 15 ? 'Восстановить декодер' : id % 5 === 0 && !demo ? 'К следующему модулю' : 'Следующее задание'}<ArrowRight size={18} /></button><a className="quiet-link" href="#/dictionary">Открыть архив</a></div></div>}
    </section><aside className="detective-panel">{taskPanel}<LexNote>Подсказки направляют внимание. Ошибки не закрывают дело — всегда можно попробовать снова.</LexNote></aside></div>
    <nav className="mobile-game-nav" aria-label="Панели расследования"><button onClick={() => document.getElementById('scene-title')?.scrollIntoView({ block: 'start' })}><Map size={18} /> Сцена</button><button onClick={() => setInventory(true)}><FileSearch size={18} /> Улики · {state.discoveredClueIds.length}</button><button onClick={() => setMobileDossier(true)}><BookOpen size={18} /> Досье</button></nav>
    {inventory && <Inventory onClose={() => setInventory(false)} />}{mobileDossier && <Modal title="Досье задания" onClose={() => setMobileDossier(false)}>{taskPanel}</Modal>}{dossierId && <Modal title="Лексикографическое досье" onClose={() => setDossierId(null)} wide><WordDossier key={dossierId} id={dossierId} /></Modal>}{sendConfirm && <Modal title="Подтвердить итоговый отчёт" onClose={() => setSendConfirm(false)}><p>Все выбранные факты подтверждены материалами расследования.</p><blockquote>{progress.answer.map(a => task.fragments?.find(f => f.id === a)?.text).join(' ')}</blockquote><button className="button" onClick={() => { dispatch({ type: 'submit', id }); playTone(state.settings.soundEnabled); setSendConfirm(false); }}><Send size={18} /> Отправить отчёт преподавателю</button></Modal>}
  </main>;
}
function PlusIndicator() { return <span aria-hidden="true" className="evidence-plus">+</span>; }
import { lexicon } from '../data/lexicon';
function wordLabel(id: string) { return lexicon.find(w => w.id === id)?.word ?? id; }

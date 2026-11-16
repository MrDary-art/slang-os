import { useState } from 'react';
import { ArrowUpRight, AudioLines, Check, Code2, Fingerprint, MessageSquare, MoveRight, Search, ShieldCheck, Timer, Unplug, X } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { Lex, LexNote, LinkButton, Modal } from '../components/ui';

export function Home() {
  const { state, dispatch } = useGame();
  const [decoded, setDecoded] = useState(false);
  const [explain, setExplain] = useState(false);
  const [newGame, setNewGame] = useState(false);
  return <main id="main" className="home page-enter">
    <div className="home-meta"><span><span className="status-dot" /> Дело открыто</span><span>Операция «Переводчик поколений»</span><span className="mono">CASE / 404–26</span></div>
    <section className="hero">
      <div className="hero-copy">
        <div className="case-label"><Fingerprint size={19} /><span>Интерактивное лингвистическое расследование</span></div>
        <h1><span className="hero-code">404<span className="code-dot">.</span></span><br />Смысл не найден</h1>
        <p className="hero-question">Слова знакомые.<br />Но понимаем ли мы друг друга?</p>
        <p className="hero-description">Перехвати переписку, собери улики и восстанови связь между поколениями. Дело не в возрасте. Дело в контексте.</p>
        <div className="actions hero-actions"><LinkButton to={state.started ? state.completed ? '/ending' : '/board' : '/briefing'}>{state.started ? 'Продолжить расследование' : 'Начать расследование'}</LinkButton><a className="quiet-link" href="#/dictionary">Изучить архив <ArrowUpRight size={18} /></a></div>
        {state.started && <button className="text-button new-game-link" onClick={() => setNewGame(true)}>Новая игра</button>}
        <div className="hero-footnote"><Timer size={15} /> 12–18 минут <span>·</span> Без регистрации <span>·</span> В своём темпе</div>
      </div>
      <div className="hero-visual" data-ui>
        <div className="signal-track"><span>STUDENT</span><div /><Unplug size={20} /><div /><span>TEACHER</span></div>
        <div className="decoder-window">
          <div className="window-toolbar"><div className="window-dots"><i /><i /><i /></div><span>ДЕКОДЕР–404</span><span className={decoded ? 'mint' : 'coral'}>{decoded ? '200 OK' : 'Сбой связи'}</span></div>
          <div className="decoder-content">
            <div className="message-meta"><span className="avatar avatar-max">М</span><div><strong>Макс</strong><small>командный чат · 14:45</small></div><MessageSquare size={17} /></div>
            <div className="hero-chat">Демка сегодня просто <span>имба</span> <span aria-hidden="true">🔥</span></div>
            <div className="translation-divider"><span /><MoveRight size={18} /><span /></div>
            <div className={`translation-box ${decoded ? 'translation-fixed' : ''}`}><div className="translation-label">{decoded ? <Check size={15} /> : <X size={15} />} {decoded ? 'Смысл восстановлен' : 'Буквальный перевод'}</div><p>{decoded ? 'Демонстрационная версия получилась очень хорошей.' : 'Проект находится в состоянии дисбаланса.'}</p></div>
            <button className="decode-action" onClick={() => { setDecoded(!decoded); if (!decoded) setExplain(true); }}><Search size={17} />{decoded ? 'Вернуть ошибочный перевод' : 'Что здесь произошло?'}<ArrowUpRight size={17} /></button>
          </div>
          <div className="decoder-footer"><AudioLines size={16} /><span className="mono">{decoded ? 'CONTEXT FOUND' : 'SEMANTIC ERROR'}</span><span className="signal-bars"><i /><i /><i /><i /><i /></span></div>
        </div>
        <div className="lex-hero"><Lex /><div><strong>ЛЕКС</strong><p>{decoded ? 'Вот теперь мы понимаем друг друга.' : 'Кажется, мы потеряли что-то между строк.'}</p></div></div>
        <div className="visual-caption"><span className="status-dot" /> Система ждёт твоего вмешательства</div>
      </div>
    </section>
    <div className="home-bottom"><div className="feature-item"><span className="feature-symbol"><Fingerprint size={22} /></span><div><strong>3 главы · 15 ситуаций</strong><span>Одно расследование</span></div></div><div className="feature-item"><span className="feature-symbol mint"><MessageSquare size={22} /></span><div><strong>20+ слов в архиве</strong><span>От «жизы» до «легаси»</span></div></div><div className="feature-item"><span className="feature-symbol amber"><Code2 size={22} /></span><div><strong>RU / EN + этимология</strong><span>Смысл, контекст, происхождение</span></div></div><a className="jury-link" href="#/jury">Для жюри<ArrowUpRight size={19} /><small>Обзор за 3 минуты</small></a></div>
    <div className="home-author"><span>Полякова Дарья · РТУ МИРЭА · ЭФБО-05-25</span><span><ShieldCheck size={14} /> Самостоятельная конкурсная работа · 2026</span></div>
    {explain && <Modal title="Почему переводчик ошибся?" onClose={() => setExplain(false)}><LexNote>Он узнал источник слова, но упустил ситуацию.</LexNote><p>«Имба» связывается с английским <em>imbalanced</em> — «несбалансированный». В игровой речи так называют чрезмерно сильный объект, а в этой переписке — впечатляющую демонстрационную версию.</p><p>Похвалу подтверждают реакция команды и результаты тестирования. Тебе предстоит искать такие подтверждения в самом расследовании.</p><a className="button" href="#/briefing" onClick={() => setExplain(false)}>Принять дело</a></Modal>}
    {newGame && <Modal title="Начать новую игру?" onClose={() => setNewGame(false)}><p>Очки и материалы текущего расследования будут удалены. Настройки сохранятся.</p><div className="actions"><a className="button" href="#/briefing" onClick={() => { dispatch({ type: 'reset' }); setNewGame(false); }}>Начать заново</a><button className="button button-secondary" onClick={() => setNewGame(false)}>Отмена</button></div></Modal>}
  </main>;
}

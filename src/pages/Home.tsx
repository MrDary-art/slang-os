import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, MoveRight, RotateCcw } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { Lex, LexNote, LinkButton, Modal } from '../components/ui';
import '../styles/home.css';

export function Home() {
  const { state, dispatch } = useGame();
  const [decoded, setDecoded] = useState(false);
  const [explain, setExplain] = useState(false);
  const [newGame, setNewGame] = useState(false);
  const continueTo = state.started ? state.completed ? '/ending' : '/board' : '/briefing';

  return <main id="main" className="home-redesign">
    <section className="home-introduction" aria-labelledby="home-title">
      <h1 id="home-title">Смысл не найден</h1>
      <p className="home-subtitle">Найди общий язык.</p>
      <p className="home-description">Переписка студентов, пятнадцать ситуаций и один сбой перевода. Восстанови смысл, который потерялся между словами.</p>
      <div className="home-actions">
        <LinkButton to={continueTo} className="home-primary">{state.started ? 'Продолжить расследование' : 'Начать расследование'}</LinkButton>
        <a className="home-archive-link" href="#/dictionary">Открыть словарь <ArrowUpRight size={17} /></a>
      </div>
      <div className="home-pace"><span>12–18 минут</span><span>В своём темпе</span>{state.started && <button onClick={() => setNewGame(true)}>Новая игра</button>}</div>
    </section>

    <section className="home-showcase" aria-labelledby="home-showcase-title">
      <div className="home-light-field" aria-hidden="true" />
      <div className={`home-interpretation ${decoded ? 'home-interpretation-restored' : ''}`} data-ui>
        <div className="home-interpretation-heading">
          <h2 id="home-showcase-title">Одно сообщение. Два прочтения.</h2>
          <span>{decoded ? <><Check size={15} /> Смысл восстановлен</> : 'Попробуй разобраться'}</span>
        </div>
        <div className="home-readings">
          <article className="home-reading home-reading-original">
            <p className="home-reading-caption"><span className="home-student-mark" aria-hidden="true">М</span> Макс <span>в командном чате</span></p>
            <p className="home-message">Демка сегодня просто <span>имба.</span></p>
            <p className="home-reading-note">Что он хотел сказать?</p>
          </article>
          <div className="home-reading-bridge" aria-hidden="true"><MoveRight size={26} strokeWidth={1.3} /></div>
          <article className="home-reading home-reading-translation">
            <p className="home-reading-caption">{decoded ? 'С учётом контекста' : 'Буквальный перевод'}</p>
            <div className="home-translation" aria-live="polite" aria-atomic="true">
              <p>{decoded ? 'Демонстрационная версия получилась очень хорошей.' : 'Проект находится в состоянии дисбаланса.'}</p>
            </div>
            <p className="home-reading-note">{decoded ? 'В этой переписке «имба» — похвала.' : 'Значение источника ещё не объясняет реплику.'}</p>
          </article>
        </div>
        <div className="home-context-action">
          <div className="home-assistant"><Lex small happy={decoded} /><p>{decoded ? 'Контекст меняет всё. Проверим ещё?' : 'За каждым словом — своя история.'}</p></div>
          <div className="home-context-buttons">
            {decoded && <button className="home-explanation-link" onClick={() => setExplain(true)}>Почему так?</button>}
            <button className="home-decode-button" onClick={() => setDecoded(value => !value)}>
              {decoded ? <><RotateCcw size={16} /> Вернуть перевод</> : <>Восстановить смысл <ArrowRight size={17} /></>}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section className="home-story" aria-labelledby="home-story-title">
      <div className="home-story-intro"><h2 id="home-story-title">Всё начинается<br />с любопытства.</h2><p>Исследуй контекст, происхождение и намерение собеседника.</p></div>
      <ol className="home-chapters">
        <li><h3>Контекст</h3><p>Найди улики в переписке и узнай, что имела в виду команда.</p></li>
        <li><h3>Происхождение</h3><p>Проследи, как слова приходят в язык и меняют значения.</p></li>
        <li><h3>Диалог</h3><p>Собери понятное сообщение и помоги собеседникам договориться.</p></li>
      </ol>
    </section>

    <footer className="home-colophon">
      <div><strong>Полякова Дарья</strong><span>РТУ МИРЭА · ЭФБО-05-25 · 2026</span></div>
      <a href="#/jury">Для жюри <span>Короткий маршрут по проекту</span><ArrowUpRight size={18} /></a>
    </footer>

    {explain && <Modal title="Почему переводчик ошибся?" onClose={() => setExplain(false)}>
      <LexNote>Он узнал источник слова, но упустил ситуацию.</LexNote>
      <p>«Имба» связывается с английским <em>imbalanced</em> — «несбалансированный». В игровой речи так называют чрезмерно сильный объект, а в этой переписке — впечатляющую демонстрационную версию.</p>
      <p>Похвалу подтверждают реакция команды и результаты тестирования. В расследовании ты найдёшь такие подтверждения самостоятельно.</p>
      <a className="button" href="#/briefing" onClick={() => setExplain(false)}>Принять дело <ArrowRight size={17} /></a>
    </Modal>}
    {newGame && <Modal title="Начать новую игру?" onClose={() => setNewGame(false)}>
      <p>Очки и материалы текущего расследования будут удалены. Настройки сохранятся.</p>
      <div className="actions"><a className="button" href="#/briefing" onClick={() => { dispatch({ type: 'reset' }); setNewGame(false); }}>Начать заново</a><button className="button button-secondary" onClick={() => setNewGame(false)}>Отмена</button></div>
    </Modal>}
  </main>;
}

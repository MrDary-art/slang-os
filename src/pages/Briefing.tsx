import { AlertTriangle, ArrowRight, Clock3, MessageSquare } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { go } from '../app/router';
import { LexNote } from '../components/ui';

export function Briefing() {
  const { dispatch } = useGame();
  function start() { dispatch({ type: 'start' }); go('/board'); }
  return <main id="main" className="briefing page-enter"><div className="briefing-code"><AlertTriangle size={22} /> ERROR 404: MEANING NOT FOUND</div><h1>Между словами<br />пропал смысл.</h1><p className="lead">За 15 минут до защиты экспериментальный переводчик искажает сообщения команды. Преподаватель сомневается, что проект готов.</p><div className="briefing-chat"><div><MessageSquare size={20} /><strong>Артём</strong><p>Баг фиксанули, всё запушили. Можно чекать демку.</p></div><div className="decoder-mistake"><AlertTriangle size={20} /><strong>ДЕКОДЕР–404</strong><p>Насекомое зафиксировано. Всё вытолкнули. Проверяйте.</p></div></div><LexNote>Привет. Я ЛЕКС. Переводчик узнаёт слова, но теряет смысл. Изучай сообщения, открывай улики и проверяй выводы. Восстановим три модуля: контекст, происхождение и диалог.</LexNote><p className="muted inline-note"><Clock3 size={17} /> 15 минут — время истории. Читай спокойно: реального таймера нет.</p><div className="actions"><button className="button" onClick={start}>Принять дело <ArrowRight size={18} /></button><button className="text-button" onClick={start}>Пропустить вступление</button></div><p className="fine-print">Все персонажи и переписки вымышленные. Они не изображают реальные сообщения студентов университета.</p></main>;
}

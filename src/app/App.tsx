import { useEffect, useState } from 'react';
import { Menu, Settings as SettingsIcon, X } from 'lucide-react';
import { useRoute } from './router';
import { GameProvider, useGame } from '../store/GameContext';
import { Settings } from '../components/Settings';
import { Home } from '../pages/Home';
import { Briefing } from '../pages/Briefing';
import { Board } from '../pages/Board';
import { Game } from '../pages/Game';
import { Dictionary, WordPage } from '../pages/Dictionary';
import { Research } from '../pages/Research';
import { DemoEnd, Jury } from '../pages/Jury';
import { Training } from '../pages/Training';
import { Ending } from '../pages/Ending';
import { LinkButton } from '../components/ui';

export function App() {
  const route = useRoute();
  const { state, storageNotice } = useGame();
  const [settings, setSettings] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => { document.documentElement.dataset.motion = state.settings.reducedMotion ? 'reduced' : 'auto'; }, [state.settings.reducedMotion]);
  useEffect(() => { setMenu(false); }, [route]);
  useEffect(() => {
    const keyboard = () => { document.documentElement.dataset.inputModality = 'keyboard'; };
    const pointer = () => { document.documentElement.dataset.inputModality = 'pointer'; };
    window.addEventListener('keydown', keyboard);
    window.addEventListener('pointerdown', pointer);
    return () => { window.removeEventListener('keydown', keyboard); window.removeEventListener('pointerdown', pointer); };
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); document.getElementById('menu-toggle')?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menu]);
  const demo = route.startsWith('/demo/');
  const links = [['/board', 'Расследование'], ['/dictionary', 'Архив слов'], ['/training', 'Тренировка'], ['/research', 'Исследование'], ['/jury', 'Для жюри']];
  let page;
  if (route === '/') page = <Home />;
  else if (route === '/briefing') page = <Briefing />;
  else if (route === '/board') page = <Board />;
  else if (/^\/case\/\d+$/.test(route)) page = <Game id={Number(route.split('/')[2])} />;
  else if (demo && /^\/demo\/\d+$/.test(route)) page = <GameProvider demo><Game id={Number(route.split('/')[2])} /></GameProvider>;
  else if (route === '/demo-end') page = <DemoEnd />;
  else if (route === '/dictionary') page = <Dictionary />;
  else if (route.startsWith('/word/')) page = <WordPage id={route.slice(6)} />;
  else if (route === '/research') page = <Research />;
  else if (route === '/jury') page = <Jury />;
  else if (route === '/training') page = <Training />;
  else if (route === '/ending') page = <Ending />;
  else page = <main id="main" className="page narrow"><h1>Маршрут не найден</h1><p>Эта страница потеряла связь с делом. Вернёмся к началу?</p><LinkButton to="/">На главную</LinkButton></main>;
  return <><a href="#main" className="skip-link" onClick={e => { e.preventDefault(); const main = document.querySelector<HTMLElement>('main'); if (main) { main.tabIndex = -1; main.focus(); } }}>Перейти к содержимому</a><header className="site-header no-print"><div className="header-inner"><a className="brand" href="#/" aria-label="СЛЕНГ.OS — главная"><span>сленг<span className="brand-os">.os</span></span></a><nav id="main-navigation" className={`main-nav ${menu ? 'nav-open' : ''}`} aria-label="Основная навигация">{links.map(([url, text]) => <a href={`#${url}`} className={route === url || url === '/board' && route.startsWith('/case/') ? 'active' : ''} aria-current={route === url ? 'page' : undefined} key={url}>{text}</a>)}</nav><div className="header-controls"><button className="icon-button settings-button" aria-label="Настройки" onClick={() => setSettings(true)}><SettingsIcon size={20} /></button><button id="menu-toggle" aria-controls="main-navigation" className="icon-button mobile-menu" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={23} /> : <Menu size={23} />}</button></div></div></header>{storageNotice && <div className="storage-notice no-print" role="status">{storageNotice}</div>}{page}{route !== '/' && <footer className="site-footer no-print"><a className="brand-footer" href="#/">СЛЕНГ.OS</a><span>Полякова Дарья · РТУ МИРЭА · 2026</span><span>Операция «Переводчик поколений»</span></footer>}{settings && <Settings onClose={() => setSettings(false)} />}</>;
}

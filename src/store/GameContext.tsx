import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { freshState, parseSave, reduceGame, SAVE_KEY, type GameAction, type GameState } from './game';

interface GameContextValue { state: GameState; dispatch: (action: GameAction) => void; demo: boolean; storageNotice: string }
const GameContext = createContext<GameContextValue | null>(null);
export function GameProvider({ children, demo = false }: { children: ReactNode; demo?: boolean }) {
  const [loaded] = useState(() => {
    if (demo) return { state: freshState(), recovered: false, unavailable: false };
    try { return { ...parseSave(localStorage.getItem(SAVE_KEY)), unavailable: false }; }
    catch { return { state: freshState(), recovered: false, unavailable: true }; }
  });
  const [state, setState] = useState(loaded.state);
  const reference = useRef(state);
  const [storageNotice, setNotice] = useState(loaded.unavailable ? 'Браузер запретил сохранение. Прогресс доступен до закрытия страницы.' : loaded.recovered ? 'Повреждённое или устаревшее сохранение заменено новым. Можно начать расследование.' : '');
  const dispatch = useCallback((action: GameAction) => {
    const next = reduceGame(reference.current, action, demo);
    if (next === reference.current) return;
    reference.current = next;
    if (!demo) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); }
      catch { setNotice('Не удалось сохранить прогресс в браузере. Не закрывайте страницу до завершения игры.'); }
    }
    setState(next);
  }, [demo]);
  return <GameContext.Provider value={{ state, dispatch, demo, storageNotice }}>{children}</GameContext.Provider>;
}
export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error('GameProvider is required');
  return value;
}

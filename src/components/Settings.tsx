import { useState } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { go } from '../app/router';
import { Modal, playTone, SoundIcon } from './ui';

export function Settings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGame();
  const [confirm, setConfirm] = useState(false);
  return <Modal title="Настройки" onClose={onClose}>
    <label className="setting-row"><span><strong><SoundIcon enabled={state.settings.soundEnabled} /> Звуки интерфейса</strong><small>Короткие авторские сигналы ответа</small></span><input type="checkbox" checked={state.settings.soundEnabled} onChange={e => { dispatch({ type: 'settings', value: { soundEnabled: e.target.checked } }); playTone(e.target.checked); }} /></label>
    <label className="setting-row"><span><strong>Уменьшить движение</strong><small>Системная настройка также учитывается</small></span><input type="checkbox" checked={state.settings.reducedMotion} onChange={e => dispatch({ type: 'settings', value: { reducedMotion: e.target.checked } })} /></label>
    <p className="privacy-note"><ShieldCheck size={20} /> Прогресс хранится только в этом браузере. Регистрация и передача персональных данных не нужны.</p>
    {confirm ? <div className="notice notice-warning"><strong>Удалить сюжетный прогресс?</strong><p>Очки, улики и решения будут удалены. Настройки сохранятся.</p><div className="actions"><button className="button button-danger" onClick={() => { dispatch({ type: 'reset' }); onClose(); go('/'); }}>Да, начать заново</button><button className="button button-secondary" onClick={() => setConfirm(false)}>Отмена</button></div></div> : <button className="text-button danger" onClick={() => setConfirm(true)}><RotateCcw size={17} /> Сбросить сюжетный прогресс</button>}
  </Modal>;
}

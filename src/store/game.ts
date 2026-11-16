import { cases, type Case } from '../data/cases';

export const SAVE_KEY = 'slangos_save_v1';
export type Ending = 'master' | 'translator' | 'researcher';
export interface MissionProgress {
  evidence: string[];
  answer: string[];
  matches: Record<string, string>;
  hints: number;
  errors: number;
  complete: boolean;
  earned: number;
}
export interface GameState {
  saveVersion: 1;
  started: boolean;
  currentChapter: number;
  currentMission: number;
  missionProgress: Record<number, MissionProgress>;
  completedMissionIds: number[];
  discoveredClueIds: string[];
  discoveredWordIds: string[];
  unlockedModuleIds: number[];
  score: number;
  hintsUsed: number;
  mistakes: number;
  completed: boolean;
  endingId: Ending | null;
  settings: { soundEnabled: boolean; reducedMotion: boolean };
}
export const emptyProgress = (): MissionProgress => ({ evidence: [], answer: [], matches: {}, hints: 0, errors: 0, complete: false, earned: 0 });
export function freshState(): GameState {
  return { saveVersion: 1, started: false, currentChapter: 1, currentMission: 1, missionProgress: {}, completedMissionIds: [], discoveredClueIds: [], discoveredWordIds: [], unlockedModuleIds: [], score: 0, hintsUsed: 0, mistakes: 0, completed: false, endingId: null, settings: { soundEnabled: false, reducedMotion: false } };
}
export function reward(hints: number, errors: number): number {
  return Math.max(40, 100 - Math.min(2, Math.max(0, hints)) * 20 - (errors > 0 ? 15 : 0) - (errors > 1 ? 10 : 0));
}
export const endingFor = (score: number): Ending => score >= 1250 ? 'master' : score >= 900 ? 'translator' : 'researcher';
export const endingNames: Record<Ending, string> = { master: 'Мастер взаимопонимания', translator: 'Цифровой переводчик', researcher: 'Исследователь языка' };
export const chapterUnlocked = (state: GameState, chapter: number) => Number.isInteger(chapter) && chapter >= 1 && chapter <= 3 && (chapter === 1 || state.unlockedModuleIds.includes(chapter - 1));
export const missionUnlocked = (state: GameState, id: number) => Number.isInteger(id) && id >= 1 && id <= cases.length && (id === 1 || state.completedMissionIds.includes(id - 1));
export function checkAnswer(task: Case, progress: MissionProgress): boolean {
  if (task.type === 'inspect' && !task.evidence.every(e => progress.evidence.includes(e.id))) return false;
  if (task.pairs?.length) return task.pairs.every(pair => progress.matches[pair.id] === pair.right);
  const alternatives = [task.correct ?? [], ...(task.accepted ?? [])];
  return alternatives.some(answer => answer.length > 0 && answer.length === progress.answer.length && answer.every((id, i) => id === progress.answer[i]));
}
function derive(state: GameState): GameState {
  const completed = cases.filter(c => state.missionProgress[c.id]?.complete);
  const progress = Object.values(state.missionProgress);
  const score = completed.reduce((sum, c) => sum + state.missionProgress[c.id].earned, 0);
  const done = completed.length === cases.length;
  return { ...state, currentChapter: Math.min(3, Math.ceil(state.currentMission / 5)), completedMissionIds: completed.map(c => c.id), discoveredClueIds: [...new Set(progress.flatMap(p => p.evidence))], discoveredWordIds: [...new Set(completed.flatMap(c => c.words))], unlockedModuleIds: [1, 2, 3].filter(ch => cases.filter(c => c.chapter === ch).every(c => state.missionProgress[c.id]?.complete)), score, hintsUsed: progress.reduce((n, p) => n + p.hints, 0), mistakes: progress.reduce((n, p) => n + p.errors, 0), completed: done, endingId: done ? endingFor(score) : null };
}
export type GameAction =
  | { type: 'start' }
  | { type: 'open'; id: number }
  | { type: 'evidence'; id: number; clue: string }
  | { type: 'answer'; id: number; answer: string[] }
  | { type: 'match'; id: number; pair: string; value: string }
  | { type: 'hint'; id: number }
  | { type: 'submit'; id: number }
  | { type: 'settings'; value: Partial<GameState['settings']> }
  | { type: 'reset' };
export function reduceGame(state: GameState, action: GameAction, demo = false): GameState {
  if (action.type === 'reset') return { ...freshState(), settings: state.settings };
  if (action.type === 'settings') return { ...state, settings: { ...state.settings, ...action.value } };
  if (action.type === 'start') return { ...state, started: true };
  const task = cases.find(c => c.id === action.id);
  if (!task || (!demo && !missionUnlocked(state, task.id))) return state;
  if (action.type === 'open') return { ...state, started: true, currentMission: task.id, currentChapter: task.chapter };
  const p = state.missionProgress[task.id] ?? emptyProgress();
  if (p.complete) return state;
  let next = { ...p };
  if (action.type === 'evidence' && task.evidence.some(e => e.id === action.clue)) next.evidence = [...new Set([...p.evidence, action.clue])];
  if (action.type === 'answer') {
    const valid = new Set([...(task.options ?? []), ...(task.fragments ?? [])].map(x => x.id));
    next.answer = [...new Set(action.answer.filter(id => valid.has(id)))];
  }
  if (action.type === 'match' && task.pairs?.some(pair => pair.id === action.pair && pair.alternatives.includes(action.value))) next.matches = { ...p.matches, [action.pair]: action.value };
  if (action.type === 'hint') next.hints = Math.min(2, p.hints + 1);
  if (action.type === 'submit') next = checkAnswer(task, p) ? { ...p, complete: true, earned: reward(p.hints, p.errors) } : { ...p, errors: p.errors + 1 };
  return derive({ ...state, missionProgress: { ...state.missionProgress, [task.id]: next } });
}

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function parseSave(raw: string | null): { state: GameState; recovered: boolean } {
  if (!raw) return { state: freshState(), recovered: false };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.saveVersion !== 1 || !isRecord(value.missionProgress) || !isRecord(value.settings) || typeof value.started !== 'boolean' || typeof value.settings.soundEnabled !== 'boolean' || typeof value.settings.reducedMotion !== 'boolean') throw new Error('schema');
    const state = freshState();
    state.started = value.started;
    state.settings = { soundEnabled: value.settings.soundEnabled, reducedMotion: value.settings.reducedMotion };
    for (const task of cases) {
      const p = value.missionProgress[task.id];
      if (p === undefined) continue;
      if (!isRecord(p) || !Array.isArray(p.evidence) || !Array.isArray(p.answer) || !isRecord(p.matches) || typeof p.complete !== 'boolean' || !Number.isInteger(p.hints) || !Number.isInteger(p.errors) || (p.hints as number) < 0 || (p.hints as number) > 2 || (p.errors as number) < 0 || (p.errors as number) > 100000) throw new Error('progress');
      const validIds = new Set([...(task.options ?? []), ...(task.fragments ?? [])].map(x => x.id));
      if (p.evidence.some(id => typeof id !== 'string' || !task.evidence.some(e => e.id === id)) || p.answer.some(id => typeof id !== 'string' || !validIds.has(id))) throw new Error('ids');
      if (Object.entries(p.matches).some(([id, answer]) => !task.pairs?.some(pair => pair.id === id && pair.alternatives.includes(answer as string)))) throw new Error('matches');
      const progress: MissionProgress = { evidence: [...new Set(p.evidence as string[])], answer: [...new Set(p.answer as string[])], matches: p.matches as Record<string, string>, hints: p.hints as number, errors: p.errors as number, complete: p.complete, earned: 0 };
      if ((progress.complete || progress.evidence.length || progress.answer.length || Object.keys(progress.matches).length || progress.hints || progress.errors) && !missionUnlocked(derive(state), task.id)) throw new Error('sequence');
      if (progress.complete && !checkAnswer(task, progress)) throw new Error('answer');
      progress.earned = progress.complete ? reward(progress.hints, progress.errors) : 0;
      state.missionProgress[task.id] = progress;
    }
    const result = derive(state);
    const current = value.currentMission;
    result.currentMission = typeof current === 'number' && cases.some(c => c.id === current) && missionUnlocked(result, current) ? current : Math.min(15, result.completedMissionIds.length + 1);
    result.currentChapter = Math.ceil(result.currentMission / 5);
    return { state: result, recovered: false };
  } catch { return { state: freshState(), recovered: true }; }
}

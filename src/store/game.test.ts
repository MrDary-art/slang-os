import { describe, expect, it } from 'vitest';
import { cases, type Case } from '../data/cases';
import {
  chapterUnlocked,
  checkAnswer,
  emptyProgress,
  endingFor,
  freshState,
  missionUnlocked,
  parseSave,
  reduceGame,
  reward,
  type GameState,
} from './game';

function prepareAnswer(state: GameState, task: Case, demo = false): GameState {
  let result = reduceGame(state, { type: 'open', id: task.id }, demo);
  for (const clue of task.evidence) {
    result = reduceGame(result, { type: 'evidence', id: task.id, clue: clue.id }, demo);
  }
  if (task.pairs) {
    for (const pair of task.pairs) {
      result = reduceGame(result, { type: 'match', id: task.id, pair: pair.id, value: pair.right }, demo);
    }
  } else {
    result = reduceGame(result, { type: 'answer', id: task.id, answer: task.correct ?? [] }, demo);
  }
  return result;
}

function playCampaign(hintsPerMission = 0, errorsPerMission = 0): GameState {
  let state = reduceGame(freshState(), { type: 'start' });
  for (const task of cases) {
    state = reduceGame(state, { type: 'open', id: task.id });
    for (let n = 0; n < hintsPerMission; n += 1) state = reduceGame(state, { type: 'hint', id: task.id });
    for (let n = 0; n < errorsPerMission; n += 1) state = reduceGame(state, { type: 'submit', id: task.id });
    state = prepareAnswer(state, task);
    state = reduceGame(state, { type: 'submit', id: task.id });
  }
  return state;
}

describe('scoring and endings', () => {
  it.each([
    [0, 0, 100], [1, 0, 80], [2, 0, 60], [0, 1, 85], [0, 2, 75],
    [0, 20, 75], [1, 1, 65], [1, 2, 55], [2, 1, 45], [2, 2, 40], [50, 50, 40],
  ])('awards %i hints / %i errors as %i points', (hints, errors, expected) => {
    expect(reward(hints, errors)).toBe(expected);
  });

  it.each([
    [1500, 'master'], [1250, 'master'], [1249, 'translator'], [900, 'translator'], [899, 'researcher'], [0, 'researcher'],
  ])('maps score %i to %s', (score, ending) => {
    expect(endingFor(score)).toBe(ending);
  });

  it('caps hint use at two and never charges further error penalties after the second mistake', () => {
    let state = freshState();
    for (let n = 0; n < 5; n += 1) state = reduceGame(state, { type: 'hint', id: 1 });
    for (let n = 0; n < 7; n += 1) state = reduceGame(state, { type: 'submit', id: 1 });
    expect(state.hintsUsed).toBe(2);
    expect(state.mistakes).toBe(7);
    state = prepareAnswer(state, cases[0]);
    state = reduceGame(state, { type: 'submit', id: 1 });
    expect(state.score).toBe(40);
    expect(state.missionProgress[1].earned).toBe(40);
  });
});

describe('campaign progression and puzzle validation', () => {
  it('starts with only the first mission and chapter accessible', () => {
    const state = freshState();
    expect(chapterUnlocked(state, 1)).toBe(true);
    expect(chapterUnlocked(state, 2)).toBe(false);
    expect(chapterUnlocked(state, 3)).toBe(false);
    expect(missionUnlocked(state, 1)).toBe(true);
    expect(missionUnlocked(state, 2)).toBe(false);
    expect(reduceGame(state, { type: 'open', id: 6 })).toBe(state);
    expect(reduceGame(state, { type: 'submit', id: 15 })).toBe(state);
  });

  it('requires all mandatory evidence before accepting an inspection answer', () => {
    const task = cases[0];
    let state = reduceGame(freshState(), { type: 'answer', id: 1, answer: task.correct ?? [] });
    expect(checkAnswer(task, state.missionProgress[1])).toBe(false);
    state = reduceGame(state, { type: 'submit', id: 1 });
    expect(state.completedMissionIds).toEqual([]);
    expect(state.mistakes).toBe(1);
    for (const clue of task.evidence) state = reduceGame(state, { type: 'evidence', id: 1, clue: clue.id });
    state = reduceGame(state, { type: 'submit', id: 1 });
    expect(state.completedMissionIds).toEqual([1]);
    expect(state.score).toBe(85);
  });

  it('records each clue once and awards no points for repeatedly opening it', () => {
    const clue = cases[0].evidence[0].id;
    let state = freshState();
    for (let n = 0; n < 4; n += 1) state = reduceGame(state, { type: 'evidence', id: 1, clue });
    state = reduceGame(state, { type: 'evidence', id: 1, clue: 'not-a-real-clue' });
    expect(state.discoveredClueIds).toEqual([clue]);
    expect(state.score).toBe(0);
  });

  it('requires every correct pair and rejects incomplete or reversed sequence answers', () => {
    const pairTask = cases.find(task => task.type === 'pairs')!;
    const pairs = emptyProgress();
    expect(checkAnswer(pairTask, pairs)).toBe(false);
    for (const pair of pairTask.pairs!) pairs.matches[pair.id] = pair.right;
    expect(checkAnswer(pairTask, pairs)).toBe(true);
    pairs.matches[pairTask.pairs![0].id] = 'unrelated';
    expect(checkAnswer(pairTask, pairs)).toBe(false);

    const orderTask = cases.find(task => task.type === 'order')!;
    expect(checkAnswer(orderTask, { ...emptyProgress(), answer: orderTask.correct!.slice(0, -1) })).toBe(false);
    expect(checkAnswer(orderTask, { ...emptyProgress(), answer: [...orderTask.correct!].reverse() })).toBe(false);
    expect(checkAnswer(orderTask, { ...emptyProgress(), answer: [...orderTask.correct!] })).toBe(true);
  });

  it('accepts equivalent orderings of independent translated sentences, but rejects omitted facts and distractors', () => {
    const task = cases.find(item => item.id === 14)!;
    for (const answer of task.accepted!) expect(checkAnswer(task, { ...emptyProgress(), answer })).toBe(true);
    expect(checkAnswer(task, { ...emptyProgress(), answer: ['temporary', 'remote'] })).toBe(false);
    expect(checkAnswer(task, { ...emptyProgress(), answer: ['forever', 'remote', 'demo'] })).toBe(false);
  });

  it('completes all fifteen canonical solutions, unlocks modules in order, and reaches the 1500 point ending', () => {
    let state = reduceGame(freshState(), { type: 'start' });
    for (const task of cases) {
      expect(missionUnlocked(state, task.id)).toBe(true);
      expect(chapterUnlocked(state, task.chapter)).toBe(true);
      state = prepareAnswer(state, task);
      expect(checkAnswer(task, state.missionProgress[task.id])).toBe(true);
      state = reduceGame(state, { type: 'submit', id: task.id });
      expect(state.score).toBe(task.id * 100);
      expect(state.completedMissionIds).toHaveLength(task.id);
      expect(state.unlockedModuleIds).toHaveLength(Math.floor(task.id / 5));
      for (const word of task.words) expect(state.discoveredWordIds).toContain(word);
      if (task.id === 4) expect(chapterUnlocked(state, 2)).toBe(false);
      if (task.id === 5) expect(chapterUnlocked(state, 2)).toBe(true);
      if (task.id === 9) expect(chapterUnlocked(state, 3)).toBe(false);
      if (task.id === 10) expect(chapterUnlocked(state, 3)).toBe(true);
    }
    expect(state.completed).toBe(true);
    expect(state.endingId).toBe('master');
    expect(state.score).toBe(1500);
    expect(state.mistakes).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.unlockedModuleIds).toEqual([1, 2, 3]);
  });

  it('never awards a completed mission again when it is reopened, submitted, or hinted', () => {
    let state = prepareAnswer(freshState(), cases[0]);
    state = reduceGame(state, { type: 'submit', id: 1 });
    const afterCompletion = structuredClone(state);
    for (let n = 0; n < 3; n += 1) {
      state = reduceGame(state, { type: 'open', id: 1 });
      state = reduceGame(state, { type: 'submit', id: 1 });
      state = reduceGame(state, { type: 'hint', id: 1 });
    }
    expect(state).toEqual(afterCompletion);
    expect(parseSave(JSON.stringify(state)).state.score).toBe(100);
  });

  it.each([
    [0, 0, 1500, 'master'], [1, 0, 1200, 'translator'], [2, 0, 900, 'translator'], [2, 3, 600, 'researcher'],
  ])('keeps the ending reachable with %i hints and %i mistakes per task', (hints, errors, score, ending) => {
    const state = playCampaign(hints, errors);
    expect(state.completed).toBe(true);
    expect(state.completedMissionIds).toHaveLength(15);
    expect(state.score).toBe(score);
    expect(state.endingId).toBe(ending);
    expect(state.hintsUsed).toBe(hints * 15);
    expect(state.mistakes).toBe(errors * 15);
  });

  it('rejects nonexistent mission and chapter ids, even after completing the campaign', () => {
    const state = playCampaign();
    for (const chapter of [0, 4, -1, 99]) expect(chapterUnlocked(state, chapter)).toBe(false);
    for (const mission of [0, 16, -1, 99]) expect(missionUnlocked(state, mission)).toBe(false);
    expect(reduceGame(state, { type: 'open', id: 99 })).toBe(state);
  });

  it('runs a nonsequential jury sample in independent state without mutating the campaign', () => {
    let campaign = prepareAnswer(freshState(), cases[0]);
    campaign = reduceGame(campaign, { type: 'submit', id: 1 });
    const original = structuredClone(campaign);
    let demo = freshState();
    for (const id of [1, 7, 15]) {
      demo = prepareAnswer(demo, cases.find(task => task.id === id)!, true);
      demo = reduceGame(demo, { type: 'submit', id }, true);
    }
    expect(demo.completedMissionIds).toEqual([1, 7, 15]);
    expect(demo.score).toBe(300);
    expect(campaign).toEqual(original);
    expect(campaign.completedMissionIds).toEqual([1]);
  });
});

describe('save recovery and round trips', () => {
  it('loads an absent save as a fresh game without a corruption warning', () => {
    expect(parseSave(null)).toEqual({ state: freshState(), recovered: false });
    expect(parseSave('')).toEqual({ state: freshState(), recovered: false });
  });

  it('restores in-progress evidence, answer selection, counters, current scene, and settings', () => {
    let state = reduceGame(freshState(), { type: 'start' });
    state = reduceGame(state, { type: 'settings', value: { soundEnabled: true, reducedMotion: true } });
    state = reduceGame(state, { type: 'evidence', id: 1, clue: cases[0].evidence[0].id });
    state = reduceGame(state, { type: 'answer', id: 1, answer: ['praise'] });
    state = reduceGame(state, { type: 'hint', id: 1 });
    state = reduceGame(state, { type: 'submit', id: 1 });
    const result = parseSave(JSON.stringify(state));
    expect(result.recovered).toBe(false);
    expect(result.state).toEqual(state);
    expect(result.state.completed).toBe(false);
    expect(result.state.score).toBe(0);
  });

  it('round-trips complete campaign state and recomputes derived totals instead of trusting saved scores', () => {
    const state = playCampaign(1, 1);
    expect(parseSave(JSON.stringify(state))).toEqual({ state, recovered: false });
    const forged = { ...state, score: 999999, hintsUsed: 0, mistakes: 0, unlockedModuleIds: [], endingId: 'master' };
    for (const progress of Object.values(forged.missionProgress)) progress.earned = 999999;
    const restored = parseSave(JSON.stringify(forged));
    expect(restored.recovered).toBe(false);
    expect(restored.state.score).toBe(975);
    expect(restored.state.endingId).toBe('translator');
    expect(restored.state.hintsUsed).toBe(15);
    expect(restored.state.mistakes).toBe(15);
    expect(restored.state.unlockedModuleIds).toEqual([1, 2, 3]);
  });

  it.each(['{not-json', 'null', '[]', '{}', '{"saveVersion":0}', '{"saveVersion":2}'])('recovers invalid or obsolete save %s', raw => {
    expect(parseSave(raw)).toEqual({ state: freshState(), recovered: true });
  });

  it('recovers malformed progress counters, evidence, answers, and false completion claims', () => {
    const invalidProgress = [
      { ...emptyProgress(), hints: 3 },
      { ...emptyProgress(), hints: -1 },
      { ...emptyProgress(), errors: -1 },
      { ...emptyProgress(), errors: 0.5 },
      { ...emptyProgress(), evidence: ['invented'] },
      { ...emptyProgress(), answer: ['invented'] },
      { ...emptyProgress(), matches: { invented: 'wrong' } },
      { ...emptyProgress(), complete: true },
    ];
    for (const progress of invalidProgress) {
      const state = { ...freshState(), missionProgress: { 1: progress } };
      expect(parseSave(JSON.stringify(state))).toEqual({ state: freshState(), recovered: true });
    }
  });

  it('recovers progress injected into a locked future mission, including matching selections', () => {
    const second = { ...freshState(), missionProgress: { 2: { ...emptyProgress(), answer: ['frustration'] } } };
    expect(parseSave(JSON.stringify(second)).recovered).toBe(true);
    const futurePair = cases.find(task => task.id === 10)!.pairs![0];
    const futureMatches = { ...freshState(), missionProgress: { 10: { ...emptyProgress(), matches: { [futurePair.id]: futurePair.right } } } };
    expect(parseSave(JSON.stringify(futureMatches))).toEqual({ state: freshState(), recovered: true });
  });

  it('restores partial pair choices after legitimately reaching the matching task', () => {
    let state = freshState();
    for (const task of cases.slice(0, 3)) {
      state = prepareAnswer(state, task);
      state = reduceGame(state, { type: 'submit', id: task.id });
    }
    state = reduceGame(state, { type: 'open', id: 4 });
    const pair = cases[3].pairs![0];
    state = reduceGame(state, { type: 'match', id: 4, pair: pair.id, value: pair.right });
    expect(parseSave(JSON.stringify(state))).toEqual({ state, recovered: false });
  });

  it('resets campaign data while preserving the selected accessibility and sound settings', () => {
    let state = playCampaign();
    state = reduceGame(state, { type: 'settings', value: { soundEnabled: true, reducedMotion: true } });
    expect(reduceGame(state, { type: 'reset' })).toEqual({ ...freshState(), settings: { soundEnabled: true, reducedMotion: true } });
  });
});

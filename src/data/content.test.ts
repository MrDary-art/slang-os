import { describe, expect, it } from 'vitest';
import { cases, chapters } from './cases';
import { lexicon } from './lexicon';
import { sources } from './research';

describe('authored quest and lexicographic data integrity', () => {
  it('provides fifteen ordered missions in three chapters of five tasks each', () => {
    expect(cases.map(task => task.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(chapters.map(chapter => chapter.id)).toEqual([1, 2, 3]);
    for (const chapter of chapters) {
      const tasks = cases.filter(task => task.chapter === chapter.id);
      expect(tasks).toHaveLength(5);
      expect(tasks.map(task => task.id)).toEqual(Array.from({ length: 5 }, (_, i) => (chapter.id - 1) * 5 + i + 1));
      expect(chapter.description.length).toBeGreaterThan(30);
      expect(chapter.restored).toContain('RESTORED');
      expect(chapter.lex.length).toBeGreaterThan(30);
    }
  });

  it('provides working data for diverse exploration, dialogue, matching, construction, ordering, and report mechanics', () => {
    const types = new Set(cases.map(task => task.type));
    for (const type of ['inspect', 'choice', 'pairs', 'build', 'order', 'report']) expect(types.has(type as typeof cases[number]['type'])).toBe(true);
    for (const task of cases) {
      expect(task.messages.length).toBeGreaterThan(0);
      expect(task.prompt.length).toBeGreaterThan(20);
      expect(task.intro.length).toBeGreaterThan(30);
      expect(task.explanation.length).toBeGreaterThan(100);
      expect(task.hints).toHaveLength(2);
      expect(new Set(task.hints).size).toBe(2);
      for (const hint of task.hints) expect(hint.length).toBeGreaterThan(20);
      if (task.type === 'inspect') expect(task.evidence.length).toBeGreaterThan(0);
      if (task.type === 'pairs' || task.type === 'classify') {
        expect(task.pairs!.length).toBeGreaterThan(0);
        expect(new Set(task.pairs!.map(pair => pair.id)).size).toBe(task.pairs!.length);
        for (const pair of task.pairs!) {
          expect(pair.alternatives).toContain(pair.right);
          expect(pair.alternatives.length).toBeGreaterThan(1);
          expect(new Set(pair.alternatives).size).toBe(pair.alternatives.length);
        }
      } else {
        const choices = [...(task.options ?? []), ...(task.fragments ?? [])];
        expect(choices.length).toBeGreaterThan(1);
        const ids = choices.map(choice => choice.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(task.correct!.length).toBeGreaterThan(0);
        for (const id of task.correct!) expect(ids).toContain(id);
        for (const answer of task.accepted ?? []) {
          expect(new Set(answer).size).toBe(answer.length);
          for (const id of answer) expect(ids).toContain(id);
        }
      }
    }
  });

  it('gives every evidence item a globally unique id and substantive readable content', () => {
    const evidence = cases.flatMap(task => task.evidence);
    expect(evidence.length).toBeGreaterThanOrEqual(15);
    expect(new Set(evidence.map(clue => clue.id)).size).toBe(evidence.length);
    for (const clue of evidence) {
      expect(clue.title.length).toBeGreaterThan(3);
      expect(clue.text.length).toBeGreaterThan(30);
    }
  });

  it('connects all quest word references to populated bilingual lexical entries', () => {
    const ids = new Set(lexicon.map(entry => entry.id));
    expect(ids.size).toBe(lexicon.length);
    expect(lexicon.length).toBeGreaterThanOrEqual(20);
    for (const task of cases) {
      expect(task.words.length).toBeGreaterThan(0);
      for (const id of task.words) expect(ids.has(id), `Task ${task.id} references missing word ${id}`).toBe(true);
    }
    for (const entry of lexicon) {
      for (const field of ['word', 'definitionRu', 'definitionEn', 'partOfSpeech', 'etymology', 'formation', 'example', 'neutral', 'tone', 'context', 'caution', 'etymologyStatus'] as const) {
        expect(entry[field].trim().length, `${entry.id}.${field}`).toBeGreaterThan(2);
      }
      if (!entry.sourceIds.length) expect(entry.etymologyStatus).toMatch(/гипотеза|не установлен|авторск/i);
      for (const sourceId of entry.sourceIds) expect(sources.some(source => source.id === sourceId)).toBe(true);
    }
  });

  it('includes every required baseline term rather than substituting optional vocabulary', () => {
    const words = new Set(lexicon.map(entry => entry.word.toLocaleLowerCase('ru')));
    for (const word of ['имба', 'тильт', 'рофл', 'кринж', 'вайб', 'жиза', 'чиллить', 'баг', 'фиксануть', 'запушить', 'костыль', 'легаси', 'пруф', 'дедлайн', 'релиз', 'зафорсить', 'флексить', 'коммит', 'скам', 'душнила']) {
      expect(words.has(word), `Required baseline term missing: ${word}`).toBe(true);
    }
  });

  it('resolves bibliography ids to distinct external sources with explicit scope notes', () => {
    expect(new Set(sources.map(source => source.id)).size).toBe(sources.length);
    for (const source of sources) {
      expect(new URL(source.url).protocol).toBe('https:');
      expect(source.title.length).toBeGreaterThan(5);
      expect(source.note.length).toBeGreaterThan(25);
    }
  });
});

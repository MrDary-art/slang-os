import { test, expect, type Page } from '@playwright/test';
import { cases, type Case } from '../src/data/cases';
import { lexicon } from '../src/data/lexicon';
import type { GameState } from '../src/store/game';

const SAVE_KEY = 'slangos_save_v1';

async function saved(page: Page): Promise<GameState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}') as GameState, SAVE_KEY);
}

async function solve(page: Page, task: Case) {
  await expect(page.getByRole('heading', { name: task.title, exact: true })).toBeVisible();
  for (const clue of task.evidence) {
    await page.locator('summary').filter({ hasText: clue.title }).click();
  }
  if (task.pairs?.length) {
    for (const pair of task.pairs) {
      await page.getByRole('combobox', { name: `Соответствие: ${pair.left}`, exact: true }).selectOption(pair.right);
    }
  } else if (task.fragments?.length) {
    for (const id of task.correct ?? []) {
      const fragment = page.locator(`button[data-fragment="${id}"]`);
      if (await fragment.isEnabled()) await fragment.click();
    }
  } else {
    const answer = task.options?.find(option => option.id === task.correct?.[0]);
    if (!answer) throw new Error(`Missing prepared answer for case ${task.id}`);
    await page.getByRole('radio', { name: answer.text }).check();
  }
  await page.getByRole('button', { name: 'Проверить решение', exact: false }).click();
  if (task.type === 'report') {
    const dialog = page.getByRole('dialog', { name: 'Подтвердить итоговый отчёт' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Отправить отчёт преподавателю' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Смысл восстановлен', exact: true })).toBeVisible();
}

test('all fifteen tasks lead from the briefing to the ending with a persistent, unique reward', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('#/briefing');
  await page.getByRole('button', { name: 'Принять дело' }).click();
  await expect(page.getByText('Сначала восстанови модуль 1', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Открыть главу' }).click();

  for (const task of cases) {
    if (task.id === 5 && task.correct?.[0]) {
      await page.locator(`button[data-fragment="${task.correct[0]}"]`).click();
      await page.reload();
      expect((await saved(page)).missionProgress[task.id].answer).toEqual([task.correct[0]]);
    }
    await solve(page, task);
    const state = await saved(page);
    expect(state.completedMissionIds).toHaveLength(task.id);
    expect(state.score).toBe(task.id * 100);
    if (task.id === 1) {
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Смысл восстановлен', exact: true })).toBeVisible();
      expect((await saved(page)).score).toBe(100);
    }
    if (task.id === 15) {
      await page.getByRole('button', { name: 'Восстановить декодер' }).click();
    } else if (task.id % 5 === 0) {
      await page.getByRole('button', { name: 'К следующему модулю' }).click();
      await page.getByRole('link', { name: 'Открыть главу' }).click();
    } else {
      await page.getByRole('button', { name: 'Следующее задание' }).click();
    }
  }
  await expect(page).toHaveURL(/#\/ending$/);
  await expect(page.getByRole('heading', { name: 'Мастер взаимопонимания', exact: true })).toBeVisible();
  const result = await saved(page);
  expect(result.completed).toBe(true);
  expect(result.score).toBe(1500);
  expect(result.unlockedModuleIds).toEqual([1, 2, 3]);
  expect(result.endingId).toBe('master');
  await page.goto('#/case/1');
  await expect(page.getByRole('heading', { name: 'Смысл восстановлен', exact: true })).toBeVisible();
  expect((await saved(page)).score).toBe(1500);
  expect(errors).toEqual([]);
});

test('jury demo uses three working puzzle types without touching campaign storage', async ({ page }) => {
  await page.goto('#/case/1');
  await solve(page, cases[0]);
  const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  await page.goto('#/demo/1');
  for (const [index, id] of [1, 7, 15].entries()) {
    await solve(page, cases[id - 1]);
    await page.getByRole('button', { name: index === 2 ? 'Завершить демонстрацию' : 'Следующее задание' }).click();
  }
  await expect(page).toHaveURL(/#\/demo-end$/);
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
});

test('hints, recoverable mistakes, evidence and partially built answers survive a reload', async ({ page }) => {
  const task = cases[0];
  await page.goto('#/case/1');
  for (const clue of task.evidence) await page.locator('summary').filter({ hasText: clue.title }).click();
  const wrong = task.options!.find(option => option.id !== task.correct![0])!;
  await page.getByRole('radio', { name: wrong.text }).check();
  await page.getByRole('button', { name: 'Проверить решение' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: /Подсказка 0\/2/ }).click();
  await page.reload();
  await expect(page.getByRole('radio', { name: wrong.text })).toBeChecked();
  expect((await saved(page)).missionProgress[1].evidence).toHaveLength(3);
  await page.getByRole('button', { name: /Подсказка 1\/2/ }).click();
  await expect(page.getByRole('button', { name: /Подсказка 2\/2/ })).toBeDisabled();
  const correct = task.options!.find(option => option.id === task.correct![0])!;
  await page.getByRole('radio', { name: correct.text }).check();
  await page.getByRole('button', { name: 'Проверить решение' }).click();
  await expect(page.getByRole('heading', { name: 'Смысл восстановлен', exact: true })).toBeVisible();
  expect((await saved(page)).score).toBe(45);
});

test('the archive searches both languages, opens a complete card and filters categories', async ({ page }) => {
  await page.goto('#/dictionary');
  const search = page.getByLabel('Поиск по слову, источнику и определению');
  await search.fill('imbalance');
  await expect(page.getByRole('heading', { name: 'Имба', exact: true })).toBeVisible();
  await search.fill('костыль');
  await expect(page.getByRole('heading', { name: 'Костыль', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Исследовать/ }).click();
  await expect(page).toHaveURL(/#\/word\/workaround$/);
  await expect(page.getByText(lexicon.find(word => word.word === 'Костыль')!.definitionEn, { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Происхождение', exact: true }).click();
  await expect(page.getByText('Статус сведений', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Контекст', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Нейтральная формулировка', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Все слова', exact: true }).click();
  await search.fill('несуществующееслово');
  await expect(page.getByText(/По этому запросу ничего не найдено/)).toBeVisible();
  await search.fill('');
  await page.getByRole('button', { name: 'IT-жаргон', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Баг', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Жиза', exact: true })).toHaveCount(0);
});

test('five training questions produce a result without changing campaign progress', async ({ page }) => {
  await page.goto('#/case/1');
  const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  await page.goto('#/training');
  await page.getByRole('button', { name: 'Начать испытание', exact: true }).click();
  for (let index = 0; index < 5; index++) {
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    await page.getByRole('button', { name: index === 4 ? 'Посмотреть результат' : 'Следующая ситуация', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Декодирование завершено', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
});

test('a damaged save can be recovered and settings are keyboard accessible', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken json'), SAVE_KEY);
  await page.goto('');
  await expect(page.getByText(/Повреждённое или устаревшее сохранение/)).toBeVisible();
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Настройки' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Настройки', exact: true })).toBeFocused();
});

test('settings persist and campaign reset requires confirmation without clearing unrelated browser data', async ({ page }) => {
  await page.goto('#/case/1');
  await solve(page, cases[0]);
  await page.evaluate(() => localStorage.setItem('unrelated-site-note', 'keep'));
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await page.getByRole('checkbox', { name: /Уменьшить движение/ }).check();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Настройки', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Уменьшить движение/ })).toBeChecked();
  await page.getByRole('button', { name: 'Сбросить сюжетный прогресс' }).click();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  expect((await saved(page)).score).toBe(100);
  await page.getByRole('button', { name: 'Сбросить сюжетный прогресс' }).click();
  await page.getByRole('button', { name: 'Да, начать заново', exact: true }).click();
  await expect(page).toHaveURL(/#\/$/);
  expect((await saved(page)).completedMissionIds).toEqual([]);
  expect((await saved(page)).settings.reducedMotion).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-site-note'))).toBe('keep');
  await page.goto('#/route-that-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Маршрут не найден', exact: true })).toBeVisible();
});

test('key screens have no horizontal overflow at all required widths', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', '#/board', '#/case/1', '#/dictionary', '#/research', '#/jury']) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      expect(overflow, `Overflow at width ${width} on ${route || 'home'}`).toBe(false);
      if ([320, 375, 1440].includes(width) && ['', '#/case/1', '#/research'].includes(route)) {
        const name = route === '' ? 'home' : route === '#/case/1' ? 'game' : 'research';
        await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
      }
    }
  }
});

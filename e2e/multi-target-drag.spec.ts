import { expect, test } from '@playwright/test';

import { closeFabMenu, spotOnPiece, waitAppReady } from './helpers';

test('aims at every piece inside a box drawn with Alt held, without long-pressing', async ({ page }) => {
  await waitAppReady(page);
  await closeFabMenu(page);
  // The panels that open at first lie over the pieces; a drag over them would land on a panel.
  const closers = page.locator('ui-panel button').filter({ hasText: /^\s*close\s*$/ });
  while ((await closers.count()) > 0) {
    const before = await page.locator('ui-panel').count();
    await closers.first().dispatchEvent('click');
    await expect(page.locator('ui-panel')).toHaveCount(before - 1, { timeout: 5000 });
  }
  // Where the table draws each piece, which the box is drawn around.
  const spots = [];
  for (const name of ['モンスターA', 'モンスターB']) {
    spots.push(await spotOnPiece(page.locator('game-character').filter({ hasText: name }).first()));
  }
  const centre = {
    x: (spots[0].x + spots[1].x) / 2,
    y: (spots[0].y + spots[1].y) / 2,
  };
  const reach = Math.max(Math.abs(spots[0].x - spots[1].x), Math.abs(spots[0].y - spots[1].y)) / 2;
  // A corner of the box on bare table: a press on another piece would aim at it alone.
  const start = await page.evaluate(
    ({ centre, reach }) => {
      for (let margin = 40; margin <= 240; margin += 20) {
        for (const [dx, dy] of [
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
        ]) {
          const at = { x: centre.x + dx * (reach + margin), y: centre.y + dy * (reach + margin) };
          const hit = document.elementFromPoint(at.x, at.y);
          if (hit && !hit.closest('game-character, ui-panel')) return at;
        }
      }
      return null;
    },
    { centre, reach }
  );
  expect(start, 'a bare spot of the table beside the pieces').not.toBeNull();
  const end = { x: 2 * centre.x - start!.x, y: 2 * centre.y - start!.y };
  await expect(page.locator('[data-testid="target-ring"]')).toHaveCount(0);

  await page.keyboard.down('Alt');
  await page.mouse.move(start!.x, start!.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up('Alt');

  // Both pieces inside are aimed at, the pieces about them as well where the box takes them in.
  for (const name of ['モンスターA', 'モンスターB']) {
    const piece = page.locator('game-character').filter({ hasText: name }).first();
    await expect(piece.locator('[data-testid="target-ring"]')).toHaveCount(1, { timeout: 5000 });
  }
});

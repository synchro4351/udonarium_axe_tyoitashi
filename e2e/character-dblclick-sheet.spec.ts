import { expect, test } from '@playwright/test';

import { spotOnPiece, waitAppReady } from './helpers';
import { settle } from './see-through-helpers';

test('opens a character sheet on a double click of the piece, as 詳細を表示 does', async ({ page }) => {
  await waitAppReady(page);
  const piece = page.locator('game-character').filter({ hasText: 'キャラクターB' }).first();
  await expect(piece).toBeAttached();
  await settle(piece);
  await expect(page.locator('game-character-sheet')).toHaveCount(0);

  // The table draws the piece, so it is pressed where the table shows it rather than on an element.
  const spot = await spotOnPiece(piece);
  await page.mouse.dblclick(spot.x, spot.y);

  const sheet = page.locator('game-character-sheet');
  await expect(sheet).toBeVisible({ timeout: 10000 });
  await expect(page.locator('ui-panel').filter({ has: sheet })).toContainText('キャラクターB');
});

import { expect, test } from '@playwright/test';

import { closeFabMenu, openPanel, waitAppReady } from './helpers';

test('takes a panel on the table into a window already taken out, as a tab beside the one there', async ({ page }) => {
  await waitAppReady(page);
  await openPanel(page, 'インベントリ');
  await closeFabMenu(page);
  const inventoryPanel = page.locator('ui-panel').filter({ has: page.locator('game-object-inventory') });
  await expect(page.locator('game-object-inventory [data-testid="inventory-item"]').first()).toBeVisible({
    timeout: 10000,
  });

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    inventoryPanel.locator('[data-testid="panel-controls"] button[title="別のウィンドウで開く"]').click(),
  ]);
  await expect(popup.locator('game-object-inventory [data-testid="inventory-item"]').first()).toBeVisible({
    timeout: 10000,
  });

  await openPanel(page, 'テーブル設定');
  await closeFabMenu(page);
  const tableSetting = page.locator('ui-panel').filter({ has: page.locator('game-table-setting') });
  await tableSetting
    .locator('[data-testid="panel-controls"] button[title="開いている別のウィンドウにタブとして入れる"]')
    .click();

  await expect(popup.locator('game-table-setting')).toBeAttached({ timeout: 10000 });
  await expect(page.locator('ui-panel').filter({ has: page.locator('game-table-setting') })).toHaveCount(0);

  // Shut, the window sends both panels home to the table.
  await popup.close();
  await expect(page.locator('ui-panel').filter({ has: page.locator('game-object-inventory') })).toHaveCount(1, {
    timeout: 10000,
  });
  await expect(page.locator('ui-panel').filter({ has: page.locator('game-table-setting') })).toHaveCount(1);
});

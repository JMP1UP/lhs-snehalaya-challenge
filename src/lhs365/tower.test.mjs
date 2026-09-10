import { test } from 'node:test';
import assert from 'node:assert/strict';
import { towerProgress, landmarks, formatHeight } from './tower.mjs';
test('tower estimate counts every page and reaches the doorway at 40,000 pages', () => {
  assert.equal(towerProgress(0).millimetres, 0);
  assert.equal(towerProgress(1000).millimetres, 50);
  assert.equal(towerProgress(40000).percent, 100);
  assert.equal(towerProgress(40000).remaining, 0);
  assert.equal(towerProgress(40001).remaining, 0);
  assert.equal(towerProgress(40001).percent, 100);
});
test('landmarks preserve height while changing the target', () => {
  assert.equal(towerProgress(1000, landmarks[1]).target, 100000);
  assert.equal(towerProgress(1000, landmarks[2]).target, 1920000);
  assert.equal(towerProgress(1000, landmarks[2]).millimetres, 50);
});
test('small contributions remain visible and invalid totals are rejected', () => {
  assert.equal(formatHeight(towerProgress(1).millimetres), '0.05 mm');
  assert.equal(formatHeight(50), '5 cm');
  assert.equal(formatHeight(2000), '2 m');
  for (const pages of [-1, 1.5, NaN, Infinity, '100']) assert.throws(() => towerProgress(pages));
});

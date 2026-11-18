'use strict';

const assert = require('assert');
const { GoalEngine } = require('../lib/index');

const engine = new GoalEngine();
const campaign = engine.createCampaign({
  platform: 'tiktok',
  targetMetric: 'views',
  startCount: 1000,
  targetCount: 10000
});

assert.strictEqual(campaign.getProgressPercentage(), 0);

let milestoneHit = false;
campaign.on('milestone', data => {
  milestoneHit = true;
});

const summary = campaign.updateProgress(5500);
assert.strictEqual(summary.progressPercent, 50);
assert.strictEqual(milestoneHit, true);

const finalSummary = campaign.updateProgress(10000);
assert.strictEqual(finalSummary.isCompleted, true);
assert.strictEqual(finalSummary.progressPercent, 100);

console.log('Omudia Goal test passed with 100% assertions valid.');


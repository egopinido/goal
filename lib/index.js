'use strict';

/**
 * Omudia Goal Engine
 * Manages campaign targets, progression metrics, milestone tracking, and ETA calculation.
 */
class GoalCampaign {
  constructor(options = {}) {
    this.id = options.id || ('goal_' + Math.random().toString(36).substr(2, 9));
    this.platform = options.platform || 'instagram';
    this.targetMetric = options.targetMetric || 'followers';
    this.startCount = Number(options.startCount || 0);
    this.currentCount = this.startCount;
    this.targetCount = Number(options.targetCount || 1000);
    this.createdAt = new Date(options.createdAt || Date.now());
    this.updatedAt = new Date();
    this.milestones = options.milestones || [25, 50, 75, 100]; // percentages
    this.reachedMilestones = new Set();
    this.listeners = [];
  }

  /**
   * Update the latest counter value and evaluate milestones.
   */
  updateProgress(currentVal) {
    this.currentCount = Number(currentVal);
    this.updatedAt = new Date();

    const percentage = this.getProgressPercentage();
    const newlyReached = [];

    this.milestones.forEach(m => {
      if (percentage >= m && !this.reachedMilestones.has(m)) {
        this.reachedMilestones.add(m);
        newlyReached.push(m);
      }
    });

    if (newlyReached.length > 0) {
      this.emit('milestone', {
        campaignId: this.id,
        platform: this.platform,
        progress: percentage,
        milestones: newlyReached
      });
    }

    if (percentage >= 100) {
      this.emit('completed', {
        campaignId: this.id,
        platform: this.platform,
        finalCount: this.currentCount,
        durationMs: this.updatedAt - this.createdAt
      });
    }

    return this.getSummary();
  }

  getProgressPercentage() {
    const totalNeeded = this.targetCount - this.startCount;
    if (totalNeeded <= 0) return 100;
    const gained = this.currentCount - this.startCount;
    const pct = (gained / totalNeeded) * 100;
    return Math.min(100, Math.max(0, Math.round(pct * 100) / 100));
  }

  estimateETA() {
    const totalNeeded = this.targetCount - this.startCount;
    const gained = this.currentCount - this.startCount;
    if (gained <= 0) return null;

    const elapsedMs = this.updatedAt - this.createdAt;
    if (elapsedMs <= 0) return null;

    const ratePerMs = gained / elapsedMs;
    const remaining = Math.max(0, this.targetCount - this.currentCount);
    const remainingMs = remaining / ratePerMs;

    return {
      estimatedCompletionDate: new Date(Date.now() + remainingMs),
      remainingMilliseconds: Math.round(remainingMs),
      unitsPerHour: Math.round(ratePerMs * 3600000)
    };
  }

  getSummary() {
    return {
      id: this.id,
      platform: this.platform,
      metric: this.targetMetric,
      start: this.startCount,
      current: this.currentCount,
      target: this.targetCount,
      progressPercent: this.getProgressPercentage(),
      isCompleted: this.getProgressPercentage() >= 100,
      milestonesReached: Array.from(this.reachedMilestones)
    };
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event, payload) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(payload));
  }
}

class GoalEngine {
  constructor() {
    this.campaigns = new Map();
  }

  createCampaign(options) {
    const campaign = new GoalCampaign(options);
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  getCampaign(id) {
    return this.campaigns.get(id);
  }

  listCampaigns() {
    return Array.from(this.campaigns.values()).map(c => c.getSummary());
  }
}

module.exports = { GoalEngine, GoalCampaign };

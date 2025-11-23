import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingPlanMetadata, ReadingPlanEnrollment, DayProgress, ReadingPlanStats, ReminderSettings } from '../types';

const READING_PLAN_ENROLLMENTS_KEY = '@bible_app_reading_plan_enrollments';
const DAY_PROGRESS_KEY = '@bible_app_day_progress';
const REMINDER_SETTINGS_KEY = '@bible_app_reminder_settings';

// Simple UUID generator
const generateUUID = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

class ReadingPlanService {
  /**
   * Load all reading plan templates from local JSON data
   */
  async loadReadingPlans(): Promise<ReadingPlanMetadata[]> {
    try {
      // Import the reading plans JSON
      const readingPlansData = require('../data/readingPlans.json');
      return readingPlansData.plans || [];
    } catch (error) {
      console.error('Error loading reading plans:', error);
      return [];
    }
  }

  /**
   * Get a specific reading plan by ID
   */
  async getReadingPlan(planId: string): Promise<ReadingPlanMetadata | null> {
    const plans = await this.loadReadingPlans();
    return plans.find(p => p.id === planId) || null;
  }

  /**
   * Enroll user in a reading plan
   */
  async enrollInPlan(planId: string, planName: string, startDate?: string): Promise<ReadingPlanEnrollment> {
    const enrollmentId = `enrollment-${generateUUID()}`;
    const today = startDate || new Date().toISOString().split('T')[0];

    const enrollment: ReadingPlanEnrollment = {
      id: enrollmentId,
      planId,
      planName,
      startDate: today,
      currentDay: 1,
      status: 'active',
      completedDays: [],
      streak: 0,
      lastReadingDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save enrollment to storage
    const enrollments = await this.getUserEnrollments();
    enrollments.push(enrollment);
    await AsyncStorage.setItem(READING_PLAN_ENROLLMENTS_KEY, JSON.stringify(enrollments));

    return enrollment;
  }

  /**
   * Get all user's reading plan enrollments
   */
  async getUserEnrollments(): Promise<ReadingPlanEnrollment[]> {
    try {
      const data = await AsyncStorage.getItem(READING_PLAN_ENROLLMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading enrollments:', error);
      return [];
    }
  }

  /**
   * Get a specific enrollment by ID
   */
  async getEnrollment(enrollmentId: string): Promise<ReadingPlanEnrollment | null> {
    const enrollments = await this.getUserEnrollments();
    return enrollments.find(e => e.id === enrollmentId) || null;
  }

  /**
   * Get active enrollments only
   */
  async getActiveEnrollments(): Promise<ReadingPlanEnrollment[]> {
    const enrollments = await this.getUserEnrollments();
    return enrollments.filter(e => e.status === 'active');
  }

  /**
   * Update enrollment status (pause, complete, abandon)
   */
  async updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'paused' | 'completed' | 'abandoned'): Promise<ReadingPlanEnrollment | null> {
    const enrollments = await this.getUserEnrollments();
    const index = enrollments.findIndex(e => e.id === enrollmentId);

    if (index === -1) return null;

    enrollments[index].status = status;
    enrollments[index].updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(READING_PLAN_ENROLLMENTS_KEY, JSON.stringify(enrollments));
    return enrollments[index];
  }

  /**
   * Mark a day as completed in a reading plan
   */
  async completeDay(enrollmentId: string, day: number): Promise<ReadingPlanEnrollment | null> {
    const enrollments = await this.getUserEnrollments();
    const index = enrollments.findIndex(e => e.id === enrollmentId);

    if (index === -1) return null;

    const enrollment = enrollments[index];

    // Mark day as completed
    if (!enrollment.completedDays.includes(day)) {
      enrollment.completedDays.push(day);
      enrollment.completedDays.sort((a, b) => a - b);
    }

    // Update current day and streak
    const today = new Date().toISOString().split('T')[0];
    const lastReadDate = enrollment.lastReadingDate.split('T')[0];

    if (lastReadDate === today) {
      // Same day, maintain streak
      enrollment.streak = enrollment.streak;
    } else if (new Date(today).getTime() - new Date(lastReadDate).getTime() === 86400000) {
      // Next day, increment streak
      enrollment.streak += 1;
    } else {
      // Gap in days, reset streak
      enrollment.streak = 1;
    }

    enrollment.lastReadingDate = new Date().toISOString();
    enrollment.currentDay = Math.max(day + 1, enrollment.currentDay);
    enrollment.updatedAt = new Date().toISOString();

    // Save updated enrollment
    await AsyncStorage.setItem(READING_PLAN_ENROLLMENTS_KEY, JSON.stringify(enrollments));

    // Create day progress record
    await this.recordDayProgress(enrollmentId, day);

    return enrollment;
  }

  /**
   * Record progress for a specific day
   */
  async recordDayProgress(enrollmentId: string, day: number, notes?: string): Promise<DayProgress> {
    const dayProgressId = `progress-${enrollmentId}-${day}`;
    const dayProgress: DayProgress = {
      id: dayProgressId,
      enrollmentId,
      day,
      passages: [],
      isCompleted: true,
      completedAt: new Date().toISOString(),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const allProgress = await AsyncStorage.getItem(DAY_PROGRESS_KEY);
      const progressArray = allProgress ? JSON.parse(allProgress) : [];
      
      // Update or add progress
      const existingIndex = progressArray.findIndex((p: DayProgress) => p.id === dayProgressId);
      if (existingIndex >= 0) {
        progressArray[existingIndex] = dayProgress;
      } else {
        progressArray.push(dayProgress);
      }

      await AsyncStorage.setItem(DAY_PROGRESS_KEY, JSON.stringify(progressArray));
    } catch (error) {
      console.error('Error recording day progress:', error);
    }

    return dayProgress;
  }

  /**
   * Get progress for a specific day
   */
  async getDayProgress(enrollmentId: string, day: number): Promise<DayProgress | null> {
    try {
      const allProgress = await AsyncStorage.getItem(DAY_PROGRESS_KEY);
      if (!allProgress) return null;

      const progressArray = JSON.parse(allProgress);
      const dayProgressId = `progress-${enrollmentId}-${day}`;
      return progressArray.find((p: DayProgress) => p.id === dayProgressId) || null;
    } catch (error) {
      console.error('Error getting day progress:', error);
      return null;
    }
  }

  /**
   * Get all progress for an enrollment
   */
  async getEnrollmentProgress(enrollmentId: string): Promise<DayProgress[]> {
    try {
      const allProgress = await AsyncStorage.getItem(DAY_PROGRESS_KEY);
      if (!allProgress) return [];

      const progressArray = JSON.parse(allProgress);
      return progressArray.filter((p: DayProgress) => p.enrollmentId === enrollmentId);
    } catch (error) {
      console.error('Error getting enrollment progress:', error);
      return [];
    }
  }

  /**
   * Calculate reading plan stats
   */
  async calculateStats(enrollmentId: string, planDuration: number): Promise<ReadingPlanStats> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const daysCompleted = enrollment.completedDays.length;
    const daysRemaining = Math.max(0, planDuration - enrollment.currentDay);
    const completionPercentage = Math.round((daysCompleted / planDuration) * 100);

    const startDate = new Date(enrollment.startDate);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysLate = Math.max(0, daysElapsed - enrollment.currentDay);

    // Calculate estimated completion date
    const remainingDays = planDuration - enrollment.currentDay + 1;
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays);

    const lastReadDate = enrollment.lastReadingDate.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const isUpToDate = lastReadDate === todayStr;

    return {
      planId: enrollment.planId,
      enrollmentId,
      daysCompleted,
      daysRemaining,
      completionPercentage,
      currentStreak: enrollment.streak,
      longestStreak: enrollment.streak, // TODO: track longest streak separately
      estimatedCompletionDate: estimatedCompletion.toISOString().split('T')[0],
      isUpToDate,
      daysLate,
      lastReadingDate: enrollment.lastReadingDate,
    };
  }

  /**
   * Save reminder settings for a plan
   */
  async saveReminderSettings(settings: ReminderSettings): Promise<void> {
    try {
      const allSettings = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      const settingsArray = allSettings ? JSON.parse(allSettings) : [];

      const existingIndex = settingsArray.findIndex((s: ReminderSettings) => s.enrollmentId === settings.enrollmentId);
      if (existingIndex >= 0) {
        settingsArray[existingIndex] = settings;
      } else {
        settingsArray.push(settings);
      }

      await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settingsArray));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  }

  /**
   * Get reminder settings for an enrollment
   */
  async getReminderSettings(enrollmentId: string): Promise<ReminderSettings | null> {
    try {
      const allSettings = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      if (!allSettings) return null;

      const settingsArray = JSON.parse(allSettings);
      return settingsArray.find((s: ReminderSettings) => s.enrollmentId === enrollmentId) || null;
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      return null;
    }
  }

  /**
   * Delete an enrollment
   */
  async deleteEnrollment(enrollmentId: string): Promise<void> {
    const enrollments = await this.getUserEnrollments();
    const filtered = enrollments.filter(e => e.id !== enrollmentId);
    await AsyncStorage.setItem(READING_PLAN_ENROLLMENTS_KEY, JSON.stringify(filtered));
  }
}

export default new ReadingPlanService();

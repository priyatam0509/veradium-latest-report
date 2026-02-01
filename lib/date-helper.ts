/**
 * Date Helper Functions for Athena API
 * Based on FRONTEND_API_GUIDE.md
 */

export class DateHelper {
  /**
   * Format date for API (with time)
   * @param date - Date to format
   * @param isEndDate - If true, sets time to 23:59:59.99999
   * @returns Formatted date string
   */
  static formatDate(date: Date, isEndDate = false): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    if (isEndDate) {
      return `${year}-${month}-${day} 23:59:59.99999`
    }
    return `${year}-${month}-${day} 00:00:00.00000`
  }

  /**
   * Get date range for last N days
   * @param days - Number of days to go back
   * @returns Object with start and end date strings
   */
  static getLastNDays(days: number): { start: string; end: string } {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    return {
      start: this.formatDate(start),
      end: this.formatDate(end, true)
    }
  }

  /**
   * Get this month's date range
   * @returns Object with start and end date strings
   */
  static getThisMonth(): { start: string; end: string } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start: this.formatDate(start),
      end: this.formatDate(end, true)
    }
  }

  /**
   * Get yesterday's date range
   * @returns Object with start and end date strings
   */
  static getYesterday(): { start: string; end: string } {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    return {
      start: this.formatDate(yesterday),
      end: this.formatDate(yesterday, true)
    }
  }

  /**
   * Get today's date range
   * @returns Object with start and end date strings
   */
  static getToday(): { start: string; end: string } {
    const today = new Date()
    
    return {
      start: this.formatDate(today),
      end: this.formatDate(today, true)
    }
  }

  /**
   * Get this week's date range (Monday to Sunday)
   * @returns Object with start and end date strings
   */
  static getThisWeek(): { start: string; end: string } {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return {
      start: this.formatDate(monday),
      end: this.formatDate(sunday, true)
    }
  }

  /**
   * Get this year's date range
   * @returns Object with start and end date strings
   */
  static getThisYear(): { start: string; end: string } {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)
    
    return {
      start: this.formatDate(start),
      end: this.formatDate(end, true)
    }
  }

  /**
   * Format Date object to Date object for API with specific time
   * @param date - Date to format
   * @param isEndDate - If true, sets time to end of day
   * @returns Date string in YYYY-MM-DD HH:MM:SS.SSSSS format
   */
  static formatDateFromDate(date: Date | undefined, isEndDate = false): string {
    if (!date) {
      return isEndDate ? this.formatDate(new Date(), true) : this.formatDate(new Date())
    }
    return this.formatDate(date, isEndDate)
  }
}

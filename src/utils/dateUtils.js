// Format a date as YYYY-MM-DD
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date as YYYY-MM-DD
export const getTodayString = () => {
  return formatDate(new Date());
};

// Parse YYYY-MM-DD string to Date object
export const parseDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Get all dates from startDate to endDate (inclusive)
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = parseDate(startDate);
  const end = parseDate(endDate);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// Calculate current streak from completions
export const calculateStreak = (completions, startDate) => {
  const today = getTodayString();
  const start = parseDate(startDate);
  const todayDate = parseDate(today);

  // Get all dates from start to today
  const allDates = getDateRange(startDate, today);

  // Calculate streak from the end (most recent)
  // Start from yesterday if today is not complete (today doesn't break the streak)
  let streak = 0;
  let startIndex = allDates.length - 1;

  // If today is not completed, start counting from yesterday
  if (!completions[today]?.completed && allDates[startIndex] === today) {
    startIndex--;
  }

  // Count backwards from the start index
  for (let i = startIndex; i >= 0; i--) {
    const date = allDates[i];
    if (completions[date]?.completed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// Get the start of current month
export const getMonthStart = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Get the end of current month
export const getMonthEnd = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Get month and year for display
export const getMonthYear = (date = new Date()) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Get days in a month arranged by weeks for calendar display
export const getCalendarDays = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const weeks = [];
  let week = new Array(firstDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month, day));

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Add remaining days to last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return weeks;
};

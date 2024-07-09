const { DateTime } = require('luxon');

const getAllDatesInRange = (startDate, endDate, intervalType) => {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate) 
  
    const dates = [];
    let currentDate = start;
    if (start.equals(end)) {
      dates.push(start.toISODate());
    }
  
    while (currentDate <= end) {
      dates.push(currentDate.toISO());
  
      // Update currentDate based on the specified interval
      switch (intervalType) {
        case 'daily':
          currentDate = currentDate.plus({ days: 1 });
          break;
        case 'weekly':
          currentDate = currentDate.plus({ weeks: 1 });
          break;
        case 'monthly':
          currentDate = currentDate.plus({ months: 1 });
          break;
        // Add more cases as needed for other intervals
        default:
          throw new Error('Invalid interval type');
      }
    }
    return dates;
};
  
const filterSchedule = (schedule) => {
    if(schedule.length === 0){
        return schedule;
    }
    const currentDate = new Date();
    const allDateRange = [];
      schedule.forEach((el) => {
        const { start, end } = el;
        const range = getAllDatesInRange(start, end, 'daily');
        range.forEach((dt) => allDateRange.push(dt));
      });

      const sortedSchedule = allDateRange.filter(
        (dateStr) => new Date(dateStr) > currentDate
      );
      sortedSchedule.sort((a, b) => new Date(a) - new Date(b));

      return sortedSchedule;
}

// Random Int for Keys
const getRandomInt = () => {
  return Math.floor(Math.random() * 500000000000);
};

module.exports = {
    getAllDatesInRange,
    filterSchedule,
    getRandomInt
};
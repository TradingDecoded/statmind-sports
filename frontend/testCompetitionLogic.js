// Test the competition date calculation logic

const now = new Date();
const currentDay = now.getDay();

console.log('Current Date:', now.toISOString());
console.log('Current Day:', currentDay, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]);

const nextWeekStart = new Date(now);

let daysUntilTuesday;
if (currentDay === 2) {
  // Today IS Tuesday - always go to NEXT Tuesday (7 days)
  daysUntilTuesday = 7;
} else if (currentDay < 2) {
  // Before Tuesday this week
  daysUntilTuesday = 2 - currentDay;
} else {
  // After Tuesday this week
  daysUntilTuesday = 7 - currentDay + 2;
}

nextWeekStart.setDate(now.getDate() + daysUntilTuesday);
nextWeekStart.setHours(2, 0, 0, 0);

console.log('\nNext Competition Start:');
console.log('  Date:', nextWeekStart.toISOString());
console.log('  Days from now:', daysUntilTuesday);
console.log('  Day:', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextWeekStart.getDay()]);

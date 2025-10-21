const now = new Date();
   const currentYear = now.getFullYear();
   const currentMonth = now.getMonth(); // 0-11

   // Determine season
   let calculatedSeason = currentMonth >= 8 ? currentYear : currentYear;

   // NFL 2025 Season Start: September 4, 2025
   // Calculate week based on days since season start
   const seasonStartDate = new Date(2025, 8, 4); // Sept 4, 2025 (month is 0-indexed)
   const daysSinceStart = Math.floor((now - seasonStartDate) / (1000 * 60 * 60 * 24));
   const weeksSinceStart = Math.floor(daysSinceStart / 7);
   let calculatedWeek = weeksSinceStart + 1; // Week 1 starts on day 0

   // Ensure week is in valid range (1-18 for regular season)
   if (calculatedWeek < 1) calculatedWeek = 1;
   if (calculatedWeek > 18) calculatedWeek = 18;

   console.log(`📅 Current date: ${now.toISOString()}`);
   console.log(`📅 Season start: ${seasonStartDate.toISOString()}`);
   console.log(`📅 Days since start: ${daysSinceStart}`);
   console.log(`📅 Weeks since start: ${weeksSinceStart}`);
   console.log(`📅 Calculated week: ${calculatedWeek}`);
   console.log(`�� Calculated season: ${calculatedSeason}`);

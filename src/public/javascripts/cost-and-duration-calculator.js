function calculateCostAndDurationFromTimestamps(fromTimestamp, toTimestamp, numberOfGuards, armed) {
  const hours = Math.ceil((toTimestamp - fromTimestamp)/(1000 * 60 * 60));
  if (hours < 0) {
    return {'cost':0, 'duration': 0};
  }
  const guardCost = armed ? 30 : 25;
  const cost = hours * guardCost * numberOfGuards;

  return {'cost':cost, 'duration': hours};
}

function calculateCostAndDuration(fromDate, fromTime, toDate, toTime, numberOfGuards, armed) {
  if (fromDate === '' || fromTime === '' || toDate === '' || toTime === '') return;
  const fromTimestamp = new Date(`${fromDate} ${fromTime}`).getTime();
  const toTimestamp = new Date(`${toDate} ${toTime}`).getTime();
  return calculateCostAndDurationFromTimestamps(fromTimestamp, toTimestamp, numberOfGuards, armed);
}

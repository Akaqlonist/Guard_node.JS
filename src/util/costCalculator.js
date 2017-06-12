function calculateCost(booking) {
  const hours = Math.ceil((booking.toTimestamp - booking.fromTimestamp)/(1000 * 60 * 60));
  if (hours < 0) {
    return;
  }
  const guardCost = booking.armed ? 30 : 25;
  const cost = hours * guardCost * booking.numberOfGuards;

  return cost*100;
}

export default calculateCost;
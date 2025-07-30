export function isWithinWorkingHours(dateTime) {
  const date = new Date(dateTime);
  const hour = date.getUTCHours(); // UTC time
  return hour >= 13 && hour < 22; // 9AM–6PM EST == 13–22 UTC
}

export function findDoctorByTreatment(treatment, doctors) {
  return doctors.find(doc => doc.treatments.includes(treatment));
}

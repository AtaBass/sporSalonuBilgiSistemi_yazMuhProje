export function previewPaymentStatus(amount, paidAmount, dueDate) {
  const amt = Number(amount);
  const paid = Number(paidAmount) || 0;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (amt <= 0) return paid > 0 ? 'ODENDI' : 'BEKLIYOR';
  if (paid >= amt) return 'ODENDI';
  if (paid > 0 && paid < amt) return 'KISMI_ODENDI';
  if (paid === 0 && due < today) return 'GECIKTI';
  return 'BEKLIYOR';
}

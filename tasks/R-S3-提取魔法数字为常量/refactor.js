const DISCOUNT_RATES = { electronics: 0.1, clothing: 0.05, food: 0.03 };
function calculateDiscount(item) {
  const rate = DISCOUNT_RATES[item.category] || 0;
  return item.price * rate;
}
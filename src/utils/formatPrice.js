// src/utils/formatPrice.js

export const formatPrice = (price, currency = 'EUR', locale = 'fr-FR') => {
  const numericPrice = typeof price === 'number' ? price : 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(numericPrice);
};
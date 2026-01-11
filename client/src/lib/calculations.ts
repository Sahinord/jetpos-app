/**
 * Accounting and Inventory Calculation Utilities
 */

export interface ProductPriceData {
  purchasePrice: number;
  salePrice: number;
  vatRate: number;
}

/**
 * Calculates profit in TL and Percentage
 */
export const calculateProfit = (purchasePrice: number, salePrice: number) => {
  const profitAmount = salePrice - purchasePrice;
  const profitPercentage = purchasePrice > 0 ? (profitAmount / purchasePrice) * 100 : 0;

  return {
    amount: parseFloat(profitAmount.toFixed(2)),
    percentage: parseFloat(profitPercentage.toFixed(2))
  };
};

/**
 * Suggests a sale price based on target profit margin and VAT
 */
export const suggestSalePrice = (purchasePrice: number, targetProfitMargin: number = 30, vatRate: number = 20) => {
  const baseWithProfit = purchasePrice * (1 + targetProfitMargin / 100);
  const totalWithVat = baseWithProfit * (1 + vatRate / 100);
  return parseFloat(totalWithVat.toFixed(2));
};

/**
 * VAT Calculations
 * @param price Price to calculate from
 * @param vatRate VAT percentage (e.g. 20)
 * @param included Whether the input price is VAT included
 */
export const calculateVatValues = (price: number, vatRate: number, included: boolean = true) => {
  if (included) {
    const excluded = price / (1 + vatRate / 100);
    const vatAmount = price - excluded;
    return {
      included: price,
      excluded: parseFloat(excluded.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2))
    };
  } else {
    const vatAmount = price * (vatRate / 100);
    const included = price + vatAmount;
    return {
      included: parseFloat(included.toFixed(2)),
      excluded: price,
      vatAmount: parseFloat(vatAmount.toFixed(2))
    };
  }
};

/**
 * Summary Stats Calculations
 */
export const calculateStockMetrics = (products: any[]) => {
  const result = products.reduce((acc, product) => {
    const qty = product.stock_quantity || 0;
    const cost = (product.purchase_price || 0) * qty;
    const value = (product.sale_price || 0) * qty;

    acc.totalItems += 1;
    acc.totalStock += qty;
    acc.totalCost += cost;
    acc.totalValue += value;
    acc.potentialProfit += (value - cost);

    return acc;
  }, {
    totalItems: 0,
    totalStock: 0,
    totalCost: 0,
    totalValue: 0,
    potentialProfit: 0
  });

  // Clean up floating point precision issues
  return {
    totalItems: result.totalItems,
    totalStock: parseFloat(result.totalStock.toFixed(3)),
    totalCost: parseFloat(result.totalCost.toFixed(2)),
    totalValue: parseFloat(result.totalValue.toFixed(2)),
    potentialProfit: parseFloat(result.potentialProfit.toFixed(2))
  };
};

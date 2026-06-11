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
export const calculateProfit = (
  purchasePrice: number,
  salePrice: number,
  commissionRate: number = 0,
  shippingCost: number = 0
) => {
  const commissionAmount = (salePrice * commissionRate) / 100;
  const netRevenue = salePrice - commissionAmount - shippingCost;
  const profitAmount = netRevenue - purchasePrice;
  const profitPercentage = purchasePrice > 0 ? (profitAmount / purchasePrice) * 100 : 0;

  return {
    amount: parseFloat(profitAmount.toFixed(2)),
    percentage: parseFloat(profitPercentage.toFixed(2))
  };
};

/**
 * Suggests a sale price based on target profit margin and VAT
 */
export const suggestSalePrice = (
  purchasePrice: number,
  targetProfitMargin: number = 30,
  vatRate: number = 20,
  posCommissionRate: number = 0,
  withholdingRate: number = 0,
  platformCommissionRate: number = 0,
  shippingCost: number = 0
) => {
  // 1. Base price with profit and fixed costs (shipping)
  const baseWithProfitAndShipping = (purchasePrice * (1 + targetProfitMargin / 100)) + shippingCost;

  // 2. Price with VAT
  const withVat = baseWithProfitAndShipping * (1 + vatRate / 100);

  // 3. Gross up for deductions (POS Commission + Withholding + Platform Commission)
  const totalDeductionRate = (posCommissionRate + withholdingRate + platformCommissionRate) / 100;

  const finalPrice = totalDeductionRate < 1
    ? withVat / (1 - totalDeductionRate)
    : withVat;

  return parseFloat(finalPrice.toFixed(2));
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
export const calculateStockMetrics = (
  products: any[],
  activeWarehouseId?: string,
  isStockSyncEnabled: boolean = false,
  isPriceSyncEnabled: boolean = false
) => {
  const result = products.reduce((acc, product) => {
    const wsData = (activeWarehouseId && product.warehouse_stock)
      ? product.warehouse_stock.find((ws: any) => ws.warehouse_id === activeWarehouseId)
      : null;

    const qty = (isStockSyncEnabled || !activeWarehouseId)
      ? (Number(product.stock_quantity) || 0)
      : (Number(wsData?.quantity) || 0);

    const purchasePrice = (!isPriceSyncEnabled && wsData && wsData.purchase_price !== undefined && wsData.purchase_price !== null)
      ? (Number(wsData.purchase_price) || 0)
      : (Number(product.purchase_price) || 0);

    const salePrice = Number(((!isPriceSyncEnabled && wsData && wsData.sale_price) ? wsData.sale_price : product.sale_price) || product.external_price || 0);

    const cost = purchasePrice * qty;
    const value = salePrice * qty;

    const isWeightBased = product.unit?.toUpperCase() === 'KG';

    acc.totalItems += 1;
    if (isWeightBased) {
      acc.totalStockKg += qty;
    } else {
      acc.totalStock += qty;
    }
    acc.totalCost += cost;
    acc.totalValue += value;
    acc.potentialProfit += (value - cost);

    return acc;
  }, {
    totalItems: 0,
    totalStock: 0,
    totalStockKg: 0,
    totalCost: 0,
    totalValue: 0,
    potentialProfit: 0
  });

  // Clean up floating point precision issues
  return {
    totalItems: result.totalItems,
    totalStock: parseFloat(result.totalStock.toFixed(3)),
    totalStockKg: parseFloat(result.totalStockKg.toFixed(3)),
    totalCost: parseFloat(result.totalCost.toFixed(2)),
    totalValue: parseFloat(result.totalValue.toFixed(2)),
    potentialProfit: parseFloat(result.potentialProfit.toFixed(2))
  };
};

/**
 * Smart Stock Predictions and Velocity Analysis
 */
export const calculateStockPredictions = (products: any[], saleItems: any[], threshold: number = 10) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Calculate Daily Velocity per Product (Units Sold per Day)
  const productVelocity: any = {};
  saleItems.forEach((item: any) => {
    const pId = item.product_id;
    if (!productVelocity[pId]) productVelocity[pId] = 0;
    productVelocity[pId] += Number(item.quantity) || 0;
  });

  // 2. Map Predictions (Projected Daily Consumption)
  return products.map(product => {
    const weeklySales = productVelocity[product.id] || 0;
    const dailyVelocity = weeklySales / 7;
    const stock = Number(product.stock_quantity) || 0;

    // Days remaining projection
    const daysRemaining = dailyVelocity > 0 ? (stock / dailyVelocity) : 999;

    // Risk Scoring Logic (High/Medium/Low)
    let riskLevel: 'high' | 'medium' | 'low' | 'none' = 'none';

    if (stock <= 0) {
      riskLevel = 'high';
    } else if (dailyVelocity > 0 && daysRemaining <= 3) {
      riskLevel = 'high';
    } else if (dailyVelocity > 0 && daysRemaining <= 7) {
      riskLevel = 'medium';
    } else if (stock < (product.min_stock || threshold)) {
      riskLevel = 'low';
    }

    return {
      ...product,
      dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
      daysRemaining: daysRemaining === 999 ? '∞' : Math.floor(daysRemaining),
      riskScore: dailyVelocity > 0 ? (10 / daysRemaining) : 0, // Higher score = higher risk
      riskLevel
    };
  }).filter(p => p.riskLevel !== 'none')
    .sort((a, b) => {
      // Sort by risk priority
      const priority: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
      return priority[b.riskLevel] - priority[a.riskLevel];
    });
};



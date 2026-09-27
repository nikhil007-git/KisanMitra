/**
 * KisanMitra AI Decision Service — powered by Gemini (FREE)
 *
 * Handles:
 * 1. "Sell Now / Wait / Monitor" recommendation with reasoning
 * 2. 30/60-day price prediction with confidence scoring
 * 3. Risk-weighted market analysis using price history + weather + seasonal data
 */
const { getModel } = require('../config/gemini');

/**
 * Generate a structured Sell/Wait/Monitor decision
 */
const generateDecision = async ({
  commodity,
  currentModalPrice,
  priceHistory = [],
  mandiName,
  distanceKm,
  transportCostTotal,
  netProfitEstimate,
  quantityQtl,
  weatherAlerts = [],
  season,
  mspPrice,
}) => {
  const model = getModel();

  const recentPrices = priceHistory.slice(-14);
  const priceStr = recentPrices.length
    ? recentPrices
        .map(
          (p) =>
            `${new Date(p.priceDate).toLocaleDateString('en-IN')} → ₹${p.modalPrice}/qtl (Arrivals: ${
              p.arrivalTonnes || 'N/A'
            } MT)`
        )
        .join('\n')
    : 'No historical price data available.';

  const avgPrice = recentPrices.length
    ? Math.round(recentPrices.reduce((a, b) => a + b.modalPrice, 0) / recentPrices.length)
    : currentModalPrice;

  const weatherStr = weatherAlerts.length
    ? weatherAlerts.map((w) => `- [${w.severity}] ${w.alertType}: ${w.description}`).join('\n')
    : 'No active weather alerts.';

  const prompt = `You are KisanMitra's AI Agricultural Market Analyst — an expert in Indian agricultural commodity markets, APMC mandis, seasonal price cycles, and farmer economics.

Analyze the following data and provide a structured selling decision for an Indian farmer.

## COMMODITY
- Name: ${commodity}
- Current Modal Price: ₹${currentModalPrice}/quintal
- 14-day Average Price: ₹${avgPrice}/quintal
- MSP: ${mspPrice ? `₹${mspPrice}/quintal` : 'Not applicable'}
- Season: ${season || 'Unknown'}

## MANDI DETAILS
- Mandi: ${mandiName}
- Distance from Farm: ${distanceKm} km
- Transport Cost: ₹${transportCostTotal}
- Net Profit Estimate: ₹${netProfitEstimate}
- Quantity: ${quantityQtl} quintals

## 14-DAY PRICE HISTORY
${priceStr}

## WEATHER ALERTS
${weatherStr}

Respond ONLY with a valid JSON object (no markdown, no explanation outside JSON):
{
  "recommendation": "SELL_NOW" | "WAIT" | "MONITOR",
  "confidence": 0.0-1.0,
  "predictedPrice30Day": number,
  "predictedPrice60Day": number,
  "trendDirection": "STRONGLY_RISING" | "RISING" | "STABLE" | "FALLING" | "STRONGLY_FALLING",
  "trendStrength": "HIGH" | "MEDIUM" | "LOW",
  "reasoning": ["bullet1", "bullet2", "bullet3", "bullet4"],
  "risks": ["risk1", "risk2", "risk3"],
  "factors": {
    "weatherRisk": 0-10,
    "priceVolatility": 0-10,
    "arrivalPressure": 0-10,
    "seasonalDemand": 0-10,
    "storageRisk": 0-10
  },
  "bestTimeToSell": "string describing ideal sell window"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned invalid response for decision analysis.');

  const decision = JSON.parse(jsonMatch[0]);
  return {
    ...decision,
    analyzedAt: new Date().toISOString(),
    model: 'gemini-2.0-flash',
    currentModalPrice,
    commodity,
    mandiName,
  };
};

/**
 * Predict commodity prices for 30/60 day horizon
 */
const predictPrices = async ({ commodity, mandiName, priceHistory = [], season, horizon = 30 }) => {
  const model = getModel();

  const priceStr = priceHistory
    .slice(-30)
    .map(
      (p) =>
        `${new Date(p.priceDate).toLocaleDateString('en-IN')}: ₹${p.modalPrice} (arr: ${
          p.arrivalTonnes || '?'
        } MT)`
    )
    .join('\n');

  const prompt = `You are an expert agricultural commodity price analyst for Indian markets.

Predict ${commodity} prices at ${mandiName} mandi for the next ${horizon} days.

Season: ${season || 'Unknown'}
Historical prices (last 30 days):
${priceStr || 'No data available.'}

Respond ONLY with valid JSON:
{
  "predictedMinPrice": number,
  "predictedMaxPrice": number,
  "predictedModalPrice": number,
  "confidence": 0.0-1.0,
  "trendDirection": "STRONGLY_RISING" | "RISING" | "STABLE" | "FALLING" | "STRONGLY_FALLING",
  "trendStrength": "HIGH" | "MEDIUM" | "LOW",
  "keyInsights": ["insight1", "insight2", "insight3"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned invalid response for price prediction.');
  return JSON.parse(jsonMatch[0]);
};

/**
 * Mock decision for when GEMINI_API_KEY is not set (dev/demo mode)
 */
const mockDecision = ({ currentModalPrice, commodity, mandiName = 'Local Mandi' }) => ({
  recommendation: 'MONITOR',
  confidence: 0.72,
  predictedPrice30Day: Math.round(currentModalPrice * 1.05),
  predictedPrice60Day: Math.round(currentModalPrice * 1.08),
  trendDirection: 'RISING',
  trendStrength: 'MEDIUM',
  reasoning: [
    `Current ${commodity} prices at ₹${currentModalPrice}/qtl are near seasonal average.`,
    'Mandi arrivals are declining — historically a positive price signal.',
    'No major weather disruptions expected this week.',
    'MSP provides a safety floor; downside risk is limited.',
  ],
  risks: [
    'Bumper harvest in neighboring districts could push arrivals higher and suppress prices.',
    'Storage costs reduce net returns if holding period exceeds 3 weeks.',
  ],
  factors: { weatherRisk: 3, priceVolatility: 5, arrivalPressure: 4, seasonalDemand: 7, storageRisk: 4 },
  bestTimeToSell: `Monitor for 7-10 days; sell if prices rise above ₹${Math.round(currentModalPrice * 1.07)}/qtl`,
  analyzedAt: new Date().toISOString(),
  model: 'mock-development',
  currentModalPrice,
  commodity,
  mandiName,
  note: 'Mock response. Set GEMINI_API_KEY in .env to enable real AI analysis.',
});

module.exports = { generateDecision, predictPrices, mockDecision };

// KisanMitra AI — Mock Database (no PostgreSQL required)
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const users = [
  {
    id: 'user-1',
    name: 'Rajinder Singh',
    phone: '+919876543210',
    email: 'rajinder@kisanmitra.in',
    passwordHash: bcrypt.hashSync('password123', 10),
    language: 'en',
    state: 'Punjab',
    district: 'Amritsar',
    village: 'Sultanwind',
    farmSizeAcres: 10.7,
    latitude: 31.6340,
    longitude: 74.8723,
    createdAt: new Date('2024-01-15'),
  },
];

const mandis = [
  { id: 'm-1', name: 'Amritsar Grain Market',    state: 'Punjab', district: 'Amritsar',   city: 'Amritsar',   latitude: 31.6340, longitude: 74.8723, isActive: true, fee: 1.5, openHours: '8AM–6PM',  rating: 4.2 },
  { id: 'm-2', name: 'Ludhiana Sabzi Mandi',     state: 'Punjab', district: 'Ludhiana',   city: 'Ludhiana',   latitude: 30.9010, longitude: 75.8573, isActive: true, fee: 1.2, openHours: '6AM–8PM',  rating: 4.5 },
  { id: 'm-3', name: 'Jalandhar Grain Market',   state: 'Punjab', district: 'Jalandhar',  city: 'Jalandhar',  latitude: 31.3260, longitude: 75.5762, isActive: true, fee: 1.8, openHours: '7AM–5PM',  rating: 3.9 },
  { id: 'm-4', name: 'Patiala Main Mandi',       state: 'Punjab', district: 'Patiala',    city: 'Patiala',    latitude: 30.3398, longitude: 76.3869, isActive: true, fee: 1.0, openHours: '7AM–7PM',  rating: 4.7 },
  { id: 'm-5', name: 'Chandigarh Grain Market',  state: 'Punjab', district: 'Chandigarh', city: 'Chandigarh', latitude: 30.7333, longitude: 76.7794, isActive: true, fee: 0.8, openHours: '6AM–9PM',  rating: 4.8 },
  { id: 'm-6', name: 'Bathinda Kisan Mandi',     state: 'Punjab', district: 'Bathinda',   city: 'Bathinda',   latitude: 30.2070, longitude: 74.9455, isActive: true, fee: 1.3, openHours: '7AM–6PM',  rating: 4.1 },
];

function generatePriceHistory(mandiId, commodity, basePrice, msp, days = 30) {
  const prices = [];
  let price = basePrice - Math.round(days * 4);
  const today = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const variation = Math.round((Math.sin(i / 3) * 20) + ((i % 5) - 2) * 5);
    price = Math.max(msp - 50, price + variation);
    prices.push({
      id: uuidv4(),
      mandiId,
      commodity,
      variety: commodity === 'Wheat' ? 'HD-3086' : commodity === 'Rice' ? 'PUSA-1509' : null,
      priceDate: date,
      minPrice: price - 35,
      maxPrice: price + 45,
      modalPrice: price,
      arrivalTonnes: Math.round(80 + (i * 3)),
      source: 'agmarknet',
    });
  }
  return prices;
}

let marketPrices = [];
const commodityBase = {
  Wheat:   { m1:2340, m2:2380, m3:2295, m4:2410, m5:2430, m6:2320, msp: 2275 },
  Rice:    { m1:2150, m2:2210, m3:2080, m4:2240, m5:2270, m6:2120, msp: 2300 },
  Mustard: { m1:5820, m2:5890, m3:5760, m4:5950, m5:5980, m6:5800, msp: 5650 },
  Cotton:  { m1:6200, m2:6350, m3:6150, m4:6420, m5:6480, m6:6180, msp: 6620 },
  Maize:   { m1:1950, m2:2010, m3:1920, m4:2050, m5:2080, m6:1940, msp: 1962 },
};
mandis.forEach((m, mi) => {
  Object.entries(commodityBase).forEach(([crop, prices]) => {
    const key = `m${mi+1}`;
    const base = prices[key] || prices.m1;
    marketPrices = marketPrices.concat(generatePriceHistory(m.id, crop, base, prices.msp));
  });
});

let crops = [
  {
    id: 'crop-1', userId: 'user-1', name: 'Wheat', season: 'Rabi', area: 5.5, areaUnit: 'Acre',
    soilType: 'Loamy', waterAvailability: 'Medium', sowingDate: new Date('2025-11-15'),
    expectedHarvestDate: new Date('2026-03-20'), variety: 'HD-3086',
    currentStage: 'Flowering', stageNumber: 4, totalStages: 6, stageProgress: 68,
    healthStatus: 'Good', mandiId: 'm-2', notes: 'Top-dressed with urea on Dec 10',
    isActive: true, latitude: 31.6340, longitude: 74.8723, createdAt: new Date('2025-11-15'),
  },
  {
    id: 'crop-2', userId: 'user-1', name: 'Mustard', season: 'Rabi', area: 2.0, areaUnit: 'Acre',
    soilType: 'Sandy Loam', waterAvailability: 'Low', sowingDate: new Date('2025-10-22'),
    expectedHarvestDate: new Date('2026-02-28'), variety: 'RH-749',
    currentStage: 'Seedling', stageNumber: 2, totalStages: 6, stageProgress: 28,
    healthStatus: 'Good', mandiId: 'm-1', notes: '',
    isActive: true, latitude: 31.6340, longitude: 74.8723, createdAt: new Date('2025-10-22'),
  },
  {
    id: 'crop-3', userId: 'user-1', name: 'Rice', season: 'Kharif', area: 3.2, areaUnit: 'Acre',
    soilType: 'Clay', waterAvailability: 'High', sowingDate: new Date('2025-06-20'),
    expectedHarvestDate: new Date('2025-10-15'), variety: 'PUSA Basmati-1509',
    currentStage: 'Harvested', stageNumber: 6, totalStages: 6, stageProgress: 100,
    healthStatus: 'Harvested', mandiId: 'm-4', notes: 'Sold at Patiala Mandi on Oct 18',
    isActive: false, latitude: 31.6340, longitude: 74.8723, createdAt: new Date('2025-06-20'),
  },
];

let decisions = [
  {
    id: 'dec-1', userId: 'user-1', cropId: 'crop-1',
    commodity: 'Wheat', mandiId: 'm-2', quantityQtl: 55,
    currentModalPrice: 2380, transportCostTotal: 1732, netProfitEstimate: 129088,
    recommendation: 'SELL_NOW', confidence: 0.82,
    reasoning: ['Price at 52-week high above MSP','Weather risk in 3 days','Storage costs increasing'],
    trendDirection: 'STABLE', createdAt: new Date(),
  },
];

const weatherData = {
  current: {
    location: 'Amritsar, Punjab',
    temp: 18, feelsLike: 16, humidity: 72, windSpeed: 12, visibility: 8, uvIndex: 3,
    condition: 'Partly Cloudy', icon: '⛅',
    timestamp: new Date().toISOString(),
  },
  forecast: [
    { day: 'Today', date: new Date().toISOString(), high: 20, low: 12, condition: 'Partly Cloudy', emoji: '⛅', rainChance: 10, humidity: 72, wind: 12 },
    { day: 'Tue',   date: new Date(Date.now() + 86400000).toISOString(), high: 18, low: 11, condition: 'Cloudy', emoji: '🌥️', rainChance: 25, humidity: 78, wind: 15 },
    { day: 'Wed',   date: new Date(Date.now() + 172800000).toISOString(), high: 15, low: 9,  condition: 'Heavy Rain', emoji: '🌧️', rainChance: 85, humidity: 90, wind: 22 },
    { day: 'Thu',   date: new Date(Date.now() + 259200000).toISOString(), high: 14, low: 8,  condition: 'Rainy', emoji: '🌧️', rainChance: 90, humidity: 92, wind: 18 },
    { day: 'Fri',   date: new Date(Date.now() + 345600000).toISOString(), high: 17, low: 10, condition: 'Cloudy', emoji: '🌥️', rainChance: 35, humidity: 80, wind: 14 },
    { day: 'Sat',   date: new Date(Date.now() + 432000000).toISOString(), high: 20, low: 12, condition: 'Sunny', emoji: '☀️', rainChance: 5, humidity: 65, wind: 10 },
    { day: 'Sun',   date: new Date(Date.now() + 518400000).toISOString(), high: 22, low: 13, condition: 'Sunny', emoji: '☀️', rainChance: 0, humidity: 60, wind: 8 },
  ],
  alerts: [
    { id: 'wa-1', severity: 'HIGH',   alertType: 'Heavy Rain',    description: 'Heavy rainfall (85mm+) expected Wed–Thu. Move stored grain to covered area.', crop: 'All Crops', date: new Date().toISOString() },
    { id: 'wa-2', severity: 'MEDIUM', alertType: 'Yellow Rust',   description: 'High humidity (72%) creates conditions for yellow rust. Apply preventive fungicide.', crop: 'Wheat', date: new Date().toISOString() },
    { id: 'wa-3', severity: 'LOW',    alertType: 'Frost Risk',    description: 'Night temperatures may reach 5°C next week. Apply light irrigation for frost protection.', crop: 'Mustard', date: new Date().toISOString() },
  ],
};

const govtSchemes = [
  { id: 's-1', name: 'PM-KISAN', benefit: '₹6,000/year', description: 'Direct income support in 3 instalments of ₹2,000 each', category: 'Income Support', url: 'https://pmkisan.gov.in', eligible: true },
  { id: 's-2', name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)', benefit: 'Crop Insurance', description: 'Subsidized crop insurance against natural calamities, pests, and diseases', category: 'Insurance', url: 'https://pmfby.gov.in', eligible: true },
  { id: 's-3', name: 'Kisan Credit Card (KCC)', benefit: 'Low Interest Credit', description: 'Short-term credit at 4–7% interest up to ₹3 lakh for agricultural needs', category: 'Credit', url: 'https://www.nabard.org/kcc', eligible: true },
  { id: 's-4', name: 'eNAM (National Agriculture Market)', benefit: 'Better Price Discovery', description: 'Online transparent trading platform for agricultural commodities', category: 'Market', url: 'https://www.enam.gov.in', eligible: true },
  { id: 's-5', name: 'Soil Health Card Scheme', benefit: 'Free Soil Testing', description: 'Free soil testing and fertilizer recommendations every 2 years', category: 'Advisory', url: 'https://soilhealth.dac.gov.in', eligible: false },
  { id: 's-6', name: 'PM Kusum Yojana', benefit: '90% Subsidy on Solar Pumps', description: 'Solar-powered irrigation pumps at 90% government subsidy', category: 'Infrastructure', url: 'https://mnre.gov.in/kusum', eligible: false },
];

const cropRecommendations = [
  { name: 'Potato', emoji: '🥔', suitability: 92, season: 'Rabi', durationDays: 90, expectedMinPrice: 1200, expectedMaxPrice: 1600, waterNeed: 'Medium', soilTypes: ['Loamy', 'Sandy Loam'], benefits: ['High market demand', 'Good price stability', 'Easy storage'] },
  { name: 'Tomato', emoji: '🍅', suitability: 88, season: 'All Season', durationDays: 80, expectedMinPrice: 800, expectedMaxPrice: 2500, waterNeed: 'Medium', soilTypes: ['Loamy', 'Clay Loam'], benefits: ['Very high return', 'Year-round demand', 'Export potential'] },
  { name: 'Sunflower', emoji: '🌻', suitability: 85, season: 'Rabi', durationDays: 95, expectedMinPrice: 5000, expectedMaxPrice: 6000, waterNeed: 'Low', soilTypes: ['Sandy Loam', 'Loamy'], benefits: ['Drought tolerant', 'Good oilseed price', 'MSP support'] },
  { name: 'Maize', emoji: '🌽', suitability: 80, season: 'Kharif', durationDays: 110, expectedMinPrice: 1900, expectedMaxPrice: 2200, waterNeed: 'Medium', soilTypes: ['Loamy', 'Clay'], benefits: ['Feed & food demand', 'Industrial use', 'MSP support'] },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

module.exports = {
  users, mandis, crops, decisions, marketPrices, weatherData, govtSchemes, cropRecommendations,
  haversineDistance,
  findUser: (id) => users.find(u => u.id === id),
  findUserByPhone: (phone) => users.find(u => u.phone === phone),
  addUser: (user) => { users.push(user); return user; },
  findCrops: (userId) => crops.filter(c => c.userId === userId),
  findCrop: (id, userId) => crops.find(c => c.id === id && c.userId === userId),
  addCrop: (crop) => { crops.push(crop); return crop; },
  updateCrop: (id, userId, data) => {
    const idx = crops.findIndex(c => c.id === id && c.userId === userId);
    if (idx === -1) return null;
    crops[idx] = { ...crops[idx], ...data, updatedAt: new Date() };
    return crops[idx];
  },
  deleteCrop: (id, userId) => {
    const idx = crops.findIndex(c => c.id === id && c.userId === userId);
    if (idx === -1) return false;
    crops.splice(idx, 1);
    return true;
  },
  findMandis: () => mandis.filter(m => m.isActive),
  findMandi: (id) => mandis.find(m => m.id === id),
  findMarketPrices: (filters) => {
    let results = [...marketPrices];
    if (filters.mandiId) results = results.filter(p => p.mandiId === filters.mandiId);
    if (filters.commodity) results = results.filter(p => p.commodity.toLowerCase() === filters.commodity.toLowerCase());
    results.sort((a, b) => new Date(b.priceDate) - new Date(a.priceDate));
    return results.slice(0, filters.limit || 30);
  },
  addDecision: (dec) => { decisions.push(dec); return dec; },
  findDecisions: (userId) => decisions.filter(d => d.userId === userId).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)),
};

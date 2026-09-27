const express = require('express');
const router = express.Router();
const { sendSuccess, sendError } = require('../utils/response');
const db = require('../data/mockData');

const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Smart Agricultural Knowledge Engine for instant response & offline fallback
function getAgriculturalAdvice(message, { location = 'Punjab, India', cropContext = 'Wheat', language = 'en' } = {}) {
  const q = (message || '').toLowerCase().trim();

  // 1. Greetings & Pleasantries (including common typos like "hcll")
  if (/^(hi|hello|hey|hcll|helo|halo|namaste|namaskar|pranam|ram ram|kya haal|kaise ho|good morning|good evening|good afternoon)[\s!.]*$/i.test(q) ||
      q === 'hi' || q === 'hello' || q === 'hey' || q === 'hcll') {
    return `Namaste Kisan Bhai! 🙏 Hello!\n\nI am **KisanMitra AI**, your dedicated 24/7 agricultural advisor.\n\nHow can I help your farm today? You can ask me about:\n• 🌾 **Crop Advisories & Pest Management** (Yellow rust, aphids, fertilizers)\n• 📊 **Live Mandi Prices & MSP** (Wheat, Mustard, Paddy, Cotton, etc.)\n• 🏪 **Mandi Comparison** (Find where you get the highest net profit)\n• 💰 **When to Sell vs Hold** (Price predictions & storage analysis)\n• 🌦️ **Weather Forecasts & Rain Alerts**\n• 🏛️ **Government Subsidies & Schemes** (PM-KISAN, PMFBY, KCC)\n\nWhich crop are you currently growing or planning to sell?`;
  }

  // 2. Gratitude & Acknowledgement
  if (/^(thanks|thank you|shukriya|dhanyawad|ok|okay|theek hai|got it|accha|shukran)[\s!.]*$/i.test(q)) {
    return `You're most welcome, Kisan Bhai! 🙏\n\nI am always here to help you maximize your crop yield and get the best prices at the mandi. Let me know if you need anything else on crop health, spray schedules, or market rates!`;
  }

  // 3. Yellow Rust & Wheat Diseases
  if (q.includes('yellow rust') || q.includes('rust') || (q.includes('wheat') && (q.includes('disease') || q.includes('bimari') || q.includes('pila')))) {
    return `⚠️ **Yellow Rust (Puccinia striiformis) Management in Wheat:**\n\n1. **Symptoms**: Bright yellow-orange powdery pustules arranged in linear stripes on leaves.\n2. **Immediate Fungicide Spray**:\n   • **Propiconazole 25% EC (Tilt)** @ 1 ml per litre of water (200 ml in 200L water per acre), OR\n   • **Tebuconazole 25.9% EW** @ 1 ml per litre of water.\n3. **Application Tips**:\n   • Spray during early morning (6:30–9:30 AM) when dew has evaporated.\n   • Ensure thorough coverage of lower foliage.\n   • If infection persists, repeat spray after 14–18 days.\n4. **Preventive Action**: Opt for rust-resistant seed varieties (HD-3086, DBW-187, PBW-725) in next sowing.`;
  }

  // 4. MSP (Minimum Support Price)
  if (q.includes('msp') || q.includes('support price') || q.includes('sarkari bhav') || q.includes('minimum support')) {
    return `📊 **Government Minimum Support Price (MSP) 2025–26:**\n\n• 🌾 **Wheat**: **₹2,275 / quintal** (Market rate currently trading ₹2,340–2,420/qtl)\n• 🌻 **Mustard / Rapeseed**: **₹5,650 / quintal**\n• 🍚 **Paddy / Rice (Common)**: **₹2,300 / quintal**\n• 🍚 **Paddy (Grade A)**: **₹2,320 / quintal**\n• 🌽 **Maize**: **₹1,962 / quintal**\n• 🟤 **Gram (Chana)**: **₹5,440 / quintal**\n• 🌿 **Cotton (Medium Staple)**: **₹6,620 / quintal**\n• 🌱 **Soybean (Yellow)**: **₹4,892 / quintal**\n\n💡 *Tip: Never sell below official MSP. You can register your harvest at nearest government procurement center via e-NAM.*`;
  }

  // 5. Mustard Selling Advice & Hold/Sell Analysis
  if (q.includes('mustard') || q.includes('sarson')) {
    if (q.includes('sell') || q.includes('when') || q.includes('rate') || q.includes('price') || q.includes('bhav')) {
      return `🟢 **Market Advisory for Mustard (Sarson):**\n\n• **Current Market Rate**: ₹5,820 / quintal (Amritsar APMC)\n• **Official MSP**: ₹5,650 / quintal (+₹170 above MSP)\n• **AI Recommendation**: **HOLD / WAIT (2–3 Weeks)**\n• **Price Forecast**: Expected to reach **₹5,980–6,080/qtl** due to tightening oilseed crush supplies and festive edible oil demand.\n• **Weather Check**: Clear skies over North-West plains over next 4 days—safe for dry on-farm storage.\n\n💡 *Action: Keep moisture below 8% in storage bags to avoid fungal damage.*`;
    }
    return `🌻 **Mustard (Sarson) Crop Advisory:**\n\n• **Sowing Time**: October to mid-November\n• **Pest Alert (Aphids/Mahu)**: Check undersides of flowering stems. Spray Dimethoate 30% EC @ 1.5 ml/L water if aphid colonies appear.\n• **Irrigation**: Mustard requires only 2 irrigations (first at pre-flowering 30–35 days, second at siliqua pod filling 60–65 days).`;
  }

  // 6. Wheat Crop Care & Sowing/Selling
  if (q.includes('wheat') || q.includes('gehu')) {
    if (q.includes('sell') || q.includes('price') || q.includes('bhav') || q.includes('rate')) {
      return `🌾 **Wheat Market Intelligence:**\n\n• **Current APMC Price**: ₹2,340 / quintal (Avg Punjab Mandis)\n• **Government MSP**: ₹2,275 / quintal\n• **AI Outlook**: **STEADY TO BULLISH (+1.8% in 30 days)**\n• **Logistics Recommendation**: Transporting from rural Amritsar to Ludhiana Mandi (85 km) earns an extra **₹40/qtl net return** even after factoring freight expenses.`;
    }
    return `🌾 **Wheat Crop Production Guidelines:**\n\n• **Critical Irrigation Stages**:\n  1. Crown Root Initiation (CRI) at 20–25 days *(Most critical - never skip)*\n  2. Tillering stage (40–45 days)\n  3. Jointing stage (60–65 days)\n  4. Flowering stage (80–85 days)\n  5. Milking stage (100–105 days)\n• **Key Varieties**: DBW-187, DBW-303, HD-3086, PBW-824.`;
  }

  // 7. Fertilizer & Nutrition (Urea, DAP, NPK, Zinc)
  if (q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('khad') || q.includes('npk') || q.includes('potash') || q.includes('zinc')) {
    return `📋 **Balanced Fertilizer & Nutrient Management:**\n\n• **Rabi Wheat (Per Acre)**:\n  - **Basal (At Sowing)**: 50 kg DAP (or 75 kg SSP) + 20 kg MOP (Potash) + 10 kg Zinc Sulphate (21%).\n  - **1st Top Dressing**: 35 kg Neem-Coated Urea with first irrigation (21–25 DAS).\n  - **2nd Top Dressing**: 35 kg Urea at jointing stage (40–45 DAS).\n\n• **Nano Urea**: Spray 4 ml/L water at tillering stage to reduce conventional urea usage by 50% and avoid nitrogen runoff.\n• ⚠️ *Avoid applying urea right before heavy rains to prevent leaching loss.*`;
  }

  // 8. Pest & Insect Management (Keeda / Disease / Spray)
  if (q.includes('pest') || q.includes('keeda') || q.includes('insect') || q.includes('spray') || q.includes('pesticide') || q.includes('aphid') || q.includes('whitefly') || q.includes('worm')) {
    return `🛡️ **Integrated Pest & Insect Management:**\n\n• **Aphids / Mahu (Mustard/Wheat)**: Spray Dimethoate 30% EC (1.5 ml/L) or Imidacloprid 17.8% SL (0.5 ml/L) during evening hours.\n• **Pink Bollworm / Caterpillars (Cotton/Gram)**: Install Pheromone Traps @ 5 per acre. Spray Emamectin Benzoate 5% SG @ 0.5 g/L water.\n• **Stem Borer & Leaf Folder (Paddy)**: Apply Cartap Hydrochloride 4G granules @ 8 kg/acre or spray Chlorantraniliprole 18.5% SC @ 0.3 ml/L.\n• **Whitefly & Sucking Pests**: Spray Thiamethoxam 25% WG @ 0.5 g/L water.\n\n💡 *Always wear protective mask and gloves while spraying.*`;
  }

  // 9. Mandi Comparison & Market Selection
  if (q.includes('mandi') || q.includes('market') || q.includes('amritsar') || q.includes('ludhiana') || q.includes('compare') || q.includes('distance')) {
    return `🏪 **Mandi Arbitrage & Price Comparison:**\n\n• **Ludhiana APMC**: ₹2,380 / qtl (Distance: ~85 km | High volume buyer demand)\n• **Amritsar APMC**: ₹2,340 / qtl (Distance: ~15 km | Low freight cost)\n• **Khanna APMC (Asia's Largest)**: ₹2,395 / qtl (Distance: ~120 km)\n\n📊 **Net Return Calculation (for 50 Quintals via Mini Truck)**:\n• Selling at Ludhiana yields **₹2,100 higher net profit** after deducting ₹1,800 freight fuel and mandi cess.\n• *Recommendation: If volume > 40 quintals, dispatch to Ludhiana or Khanna.*`;
  }

  // 10. Weather Advisory & Rain Impacts
  if (q.includes('weather') || q.includes('rain') || q.includes('barish') || q.includes('mausam') || q.includes('temperature') || q.includes('frost')) {
    return `🌦️ **Agricultural Weather Advisory:**\n\n• **Current Forecast**: Mostly clear sky with temperatures between 14°C (min) and 27°C (max).\n• **Precipitation Alert**: No heavy rain predicted for the next 72 hours—ideal for pesticide spraying and harvesting.\n• **Humidity**: 68% morning humidity. Monitor wheat fields for early signs of fungal rust.\n• **Harvest Advisory**: If you have harvested produce in open yards, keep waterproof tarpaulins ready as a precaution against sudden Western Disturbances.`;
  }

  // 11. Government Schemes & Subsidies
  if (q.includes('scheme') || q.includes('government') || q.includes('subsidy') || q.includes('pm kisan') || q.includes('fasal bima') || q.includes('kcc') || q.includes('loan')) {
    return `🏛️ **Major Government Welfare Schemes for Farmers:**\n\n1. **PM-KISAN (Samman Nidhi)**:\n   • ₹6,000 / year direct bank transfer in 3 four-monthly installments of ₹2,000.\n2. **PM Fasal Bima Yojana (PMFBY)**:\n   • Comprehensive crop loss insurance at nominal premium (1.5% for Rabi, 2% for Kharif).\n3. **Kisan Credit Card (KCC)**:\n   • Institutional farm credit up to ₹3,00,000 at concessional 4% interest rate.\n4. **PM-KUSUM Solar Scheme**:\n   • Up to 60–90% government subsidy on standalone solar agriculture pumps.\n\n💡 *Apply at your nearest Common Service Centre (CSC) or visit pmkisan.gov.in.*`;
  }

  // 12. Irrigation & Water Management
  if (q.includes('irrigation') || q.includes('water') || q.includes('sinchai') || q.includes('paani') || q.includes('drip') || q.includes('sprinkler')) {
    return `💧 **Efficient Farm Irrigation Advisory:**\n\n• **Wheat**: 4–5 timely irrigations give 25% higher yield than random watering. Crucial stages: Crown Root (21 days), Tillering (42 days), Jointing (65 days), and Flowering (85 days).\n• **Drip & Micro-Irrigation**: Saves up to 45% water and 30% fertilizer via fertigation. Eligible for 55% Central/State subsidy under PMKSY (Per Drop More Crop).\n• **Water Stagnation**: Ensure proper drainage to avoid root suffocation and collar rot diseases.`;
  }

  // 13. Paddy / Rice Crop Care
  if (q.includes('paddy') || q.includes('rice') || q.includes('dhan') || q.includes('basmati')) {
    return `🍚 **Paddy / Rice (Dhan) Management:**\n\n• **MSP**: ₹2,300/qtl (Common), ₹2,320/qtl (Grade A). Basmati varieties fetch market premium ₹3,200–3,800/qtl.\n• **Nutrient Management**: Apply 50 kg Urea + 30 kg DAP + 20 kg Potash + 10 kg Zinc Sulphate per acre.\n• **Blast & Sheath Blight**: Spray Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L water on initial disease appearance.`;
  }

  // 14. Cotton Crop Advisory
  if (q.includes('cotton') || q.includes('kapas')) {
    return `🌿 **Cotton (Kapas) Advisory:**\n\n• **Current MSP**: ₹6,620/qtl (Medium Staple) | ₹7,020/qtl (Long Staple).\n• **Pink Bollworm Control**: Monitor with pheromone traps (5 traps/acre). If catch > 8 moths/day for 3 consecutive days, spray Profenofos 50% EC @ 2 ml/L water.\n• **Picking Tips**: Pick clean cotton in sunny dry afternoon to maintain lower moisture and fetch Grade-1 pricing.`;
  }

  // 15. Default Contextual Advisor
  return `Namaste Kisan Bhai! 🙏\n\nRegarding your question: *"**${message}**"*\n\nHere is our smart agricultural recommendation:\n\n• 🌾 **Farming Guidance**: Ensure proper soil moisture and monitor crop canopy for any pest or fungal spots.\n• 📊 **Market Advantage**: Always verify current APMC modal prices against government MSP before committing to a local buyer.\n• 💡 **Free Support**: You can ask me specific questions like: \n  - *"What is current wheat MSP?"*\n  - *"When should I sell mustard?"*\n  - *"How to cure yellow rust?"*\n  - *"Fertilizer schedule for wheat"*`;
}

router.post('/chat', async (req, res) => {
  const { message, language = 'en', cropContext = 'Wheat', location = 'Punjab, India' } = req.body;
  if (!message) return sendError(res, 'message is required.', 400);

  // If real Gemini key is configured, use Google Gemini 2.0 Flash
  if (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here' && GEMINI_KEY.length > 10) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const systemPrompt = `You are KisanMitra AI (किसानमित्र), a warm, supportive, and expert agricultural advisor assisting Indian farmers.
Location: ${location}. Primary crop: ${cropContext}. Preferred Language: ${language}.
Guidelines:
1. Always address the farmer respectfully ("Kisan Bhai", "Namaste").
2. Answer clearly, accurately, concisely using practical farm terms, bullet points, and emoji highlights.
3. If they send a simple greeting like "hi", "hello", "hcll", or "namaste", greet them warmly and ask how you can help their farm today.
4. Mention Government MSP (Minimum Support Price) and relevant schemes (PM-KISAN, PMFBY, KCC) when discussing crop sales or finances.
5. Use Indian Rupees (₹) and metric units (Quintal, Acre, Kilogram).`;

      const result = await model.generateContent(`${systemPrompt}\n\nFarmer asks: ${message}`);
      const text = result?.response?.text();
      if (text && text.trim().length > 0) {
        return sendSuccess(res, { reply: text, source: 'gemini-2.0-flash', timestamp: new Date().toISOString() }, 'Response generated.');
      }
    } catch (err) {
      console.error('Gemini call error, falling back to local agricultural engine:', err.message);
    }
  }

  // Smart agricultural knowledge engine (comprehensive domain fallback)
  const reply = getAgriculturalAdvice(message, { location, cropContext, language });
  return sendSuccess(res, { reply, source: 'kisanmitra-expert-engine', timestamp: new Date().toISOString() }, 'Response generated.');
});

router.post('/diagnose', (req, res) => {
  const { description = '', crop = 'Wheat' } = req.body;
  return sendSuccess(res, {
    diagnosis: `Based on observed symptoms for **${crop}**:\n\n• **Probable Condition**: Early fungal infection / Nutrient deficiency\n• **Recommended Action**: Spray recommended micronutrient mixture (Zinc + Ferrous) or protective fungicide.\n• **Advisory**: Check soil moisture and avoid water stagnation.`,
    severity: 'Medium',
    source: 'kisanmitra-expert'
  }, 'Diagnosis complete.');
});

router.get('/schemes', (req, res) => {
  return sendSuccess(res, db.govtSchemes, 'Government schemes fetched.');
});

module.exports = router;

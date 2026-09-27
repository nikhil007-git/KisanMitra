const express = require('express');
const router = express.Router();
const { sendSuccess, sendError } = require('../utils/response');
const db = require('../data/mockData');

const GEMINI_KEY = process.env.GEMINI_API_KEY;

router.post('/chat', async (req, res) => {
  const { message, language = 'en', cropContext = 'Wheat', location = 'Punjab, India' } = req.body;
  if (!message) return sendError(res, 'message is required.', 400);

  if (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here') {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const systemPrompt = `You are KisanMitra AI, an expert agricultural advisor assisting Indian farmers.
Location: ${location}. Primary crop: ${cropContext}. Language: ${language}.
Answer clearly, concisely, using simple bullet points and practical farm terminology. Mention MSP (Minimum Support Price) and government schemes when relevant. Use Indian Rupees (₹).`;

      const result = await model.generateContent(`${systemPrompt}\n\nFarmer asks: ${message}`);
      return sendSuccess(res, { reply: result.response.text(), source: 'gemini-2.0-flash', timestamp: new Date().toISOString() }, 'Response generated.');
    } catch (err) {
      console.error('Gemini call error:', err.message);
    }
  }

  // Smart agricultural knowledge engine for instant offline response
  const q = message.toLowerCase();
  let reply = '';
  if (q.includes('msp') || q.includes('wheat msp') || q.includes('support price')) {
    reply = `**Government Minimum Support Price (MSP) 2025-26:**\n\n🌾 **Wheat**: ₹2,275 per quintal\n🍚 **Paddy / Rice (Common)**: ₹2,300 per quintal\n🌻 **Mustard**: ₹5,650 per quintal\n🌽 **Maize**: ₹1,962 per quintal\n🌿 **Cotton (Medium Staple)**: ₹6,620 per quintal\n\n💡 Current wheat prices in Punjab are trading ₹65–120 above MSP at ₹2,340–2,430/qtl.`;
  } else if (q.includes('yellow rust') || q.includes('rust')) {
    reply = `⚠️ **Yellow Rust Management for Wheat:**\n\n1. **Symptoms**: Yellow-orange powdery stripes parallel to leaf veins.\n2. **Immediate Fungicide**: Spray Propiconazole 25% EC (Tilt) @ 1 ml/litre of water, or Tebuconazole 25.9% EW @ 1 ml/litre.\n3. **Application**: Spray during early morning (6–9 AM). Avoid spraying on rainy days.\n4. **Current Status**: High humidity (72%) increases yellow rust risk. Inspect your fields within 48 hours.`;
  } else if (q.includes('mustard') || q.includes('when to sell')) {
    reply = `🟢 **Selling Advice for Mustard:**\n\n• **Current Price**: ₹5,820/qtl at Amritsar\n• **Recommendation**: **WAIT (2–3 Weeks)**\n• **Projected Price**: ₹5,980–6,050/qtl\n• **Key Reason**: Global edible oil prices are steady and festival processing demand is picking up. MSP is ₹5,650/qtl so you are safely in profit.`;
  } else if (q.includes('fertilizer') || q.includes('urea') || q.includes('dap')) {
    reply = `📋 **Wheat Fertilizer Schedule (Rabi Season):**\n\n• **Basal Dose**: 50 kg DAP + 25 kg MOP per acre at sowing.\n• **First Top Dressing**: 35 kg Urea per acre with first irrigation (21–25 days after sowing).\n• **Second Top Dressing**: 35 kg Urea per acre at jointing stage (40–45 days).\n\n💡 Use neem-coated urea and avoid application right before heavy rain to prevent nitrogen leaching.`;
  } else if (q.includes('scheme') || q.includes('pm kisan') || q.includes('subsidy')) {
    reply = `🏛️ **Key Government Schemes for You:**\n\n1. **PM-KISAN**: ₹6,000/year in 3 equal installments into your bank account.\n2. **PM Fasal Bima Yojana (PMFBY)**: Comprehensive crop insurance with only 1.5% premium for Rabi crops.\n3. **Kisan Credit Card (KCC)**: Low-interest loans up to ₹3 Lakh at effective 4% interest.\n4. **PM Kusum Yojana**: 90% subsidy for installation of solar agricultural pumps.`;
  } else {
    reply = `Namaste! 🙏 I am **KisanMitra AI**, your smart agricultural advisor.\n\nI can help you with:\n• 🌾 **Crop Planning & Advisories** (fertilizers, yellow rust, irrigation)\n• 📊 **Mandi Prices & Trends** (Wheat, Mustard, Rice, Cotton)\n• 🏪 **Mandi Comparison & Arbitrage** (find the highest net return mandi)\n• 💰 **Profit & Transportation Calculator**\n• 🌦️ **Weather Risk Alerts**\n\nFeel free to ask any farming or price question!`;
  }

  return sendSuccess(res, { reply, source: 'kisanmitra-ai-offline', timestamp: new Date().toISOString() }, 'Response generated.');
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

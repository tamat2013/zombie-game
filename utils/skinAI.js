// utils/skinAI.js

/**
 * This function uses Claude API to analyze custom skin powers
 * and determine if they're balanced and what they should cost
 */
export async function analyzeSkinPower(powerDescription) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `אתה מנתח כוחות במשחק זומבים מולטיפלייר. המשחק עובד כך:
- יש זומבי אחד (איטי יותר) שצריך לנשוך שחקנים
- יש רופאים שיכולים לרפא שחקנים נגועים
- יש שורדים שצריכים לשרוד 10 דקות

השחקן מתאר כוח מיוחד לסקין שלו:
"${powerDescription}"

אנא נתח את הכוח הזה והחזר תשובה ב-JSON בדיוק בפורמט הזה (בלי markdown):
{
  "isBalanced": true/false,
  "reason": "הסבר קצר למה זה מאוזן או לא",
  "suggestedPrice": מספר בין 200 ל-5000,
  "finalPowerDescription": "תיאור מדויק של מה הכוח יעשה",
  "cooldown": מספר שניות (או null אם חד-פעמי),
  "usesPerGame": מספר (או null אם אינסופי עם קולדאון)
}

כללי איזון:
- כוחות שנותנים מהירות גבוהה (>x2) או ארוכה (>5 שניות) = לא מאוזן
- כוחות שמאפשרים "אלמוות" או "חיסון מוחלט" = לא מאוזן
- כוחות שמזיקים לשחקנים אחרים ישירות = לא מאוזן
- כוחות שדומים לכוחות קיימים צריכים להיות במחיר דומה:
  * הסוואה 3 שניות, קולדאון 60 = 800
  * טלפורט 2 מטרים, קולדאון 45 = 1000
  * מהירות +15% למשך 4 שניות = 1200
  * שריון מנשיכה אחת (פעם במשחק) = 2200
  * נשיכה מחזירה לשורד (זומבי בלבד, פעם במשחק) = 4500

החזר רק JSON, ללא טקסט נוסף.`
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response
    const textContent = data.content.find(item => item.type === 'text');
    if (!textContent) {
      throw new Error('No text content in response');
    }

    let jsonText = textContent.text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Parse JSON
    const analysis = JSON.parse(jsonText);
    
    // Validate response
    if (typeof analysis.isBalanced !== 'boolean') {
      throw new Error('Invalid AI response format');
    }

    return {
      success: true,
      isBalanced: analysis.isBalanced,
      reason: analysis.reason,
      price: analysis.suggestedPrice,
      powerDescription: analysis.finalPowerDescription,
      cooldown: analysis.cooldown,
      usesPerGame: analysis.usesPerGame
    };

  } catch (error) {
    console.error('Error analyzing skin power:', error);
    
    // Fallback to simple rules if AI fails
    return fallbackAnalysis(powerDescription);
  }
}

/**
 * Fallback analysis using simple rules if AI fails
 */
function fallbackAnalysis(description) {
  const lower = description.toLowerCase();
  
  // Check for obviously OP powers
  const opKeywords = [
    'אלמוות', 'immortal', 'invincible', 'חיסון מוחלט', 
    'לנצח', 'forever', 'כל', 'all', 'אינסוף', 'infinite'
  ];
  
  const isOP = opKeywords.some(keyword => lower.includes(keyword));
  
  if (isOP) {
    return {
      success: true,
      isBalanced: false,
      reason: 'הכוח חזק מדי ויכול לשבור את האיזון במשחק',
      price: 0,
      powerDescription: description,
      cooldown: null,
      usesPerGame: null
    };
  }

  // Simple price calculation
  let price = 1000; // Base price
  
  if (lower.includes('מהירות') || lower.includes('speed')) price += 500;
  if (lower.includes('טלפורט') || lower.includes('teleport')) price += 800;
  if (lower.includes('הסוואה') || lower.includes('invisible')) price += 300;
  if (lower.includes('שריון') || lower.includes('armor')) price += 1000;
  
  price = Math.min(5000, Math.max(200, price));

  return {
    success: true,
    isBalanced: true,
    reason: 'הכוח נראה מאוזן יחסית',
    price: price,
    powerDescription: description,
    cooldown: 45,
    usesPerGame: null
  };
}

/**
 * Save custom skin to Firebase
 */
export async function saveCustomSkin(userId, skinData, database) {
  const { ref, update, push } = await import('firebase/database');
  
  const skinId = `custom_${Date.now()}`;
  const updates = {};
  
  updates[`users/${userId}/customSkins/${skinId}`] = {
    name: skinData.name,
    emoji: skinData.emoji,
    color: skinData.color,
    power: {
      description: skinData.powerDescription,
      cooldown: skinData.cooldown,
      usesPerGame: skinData.usesPerGame
    },
    price: skinData.price,
    createdAt: Date.now()
  };

  await update(ref(database), updates);
  
  return skinId;
}

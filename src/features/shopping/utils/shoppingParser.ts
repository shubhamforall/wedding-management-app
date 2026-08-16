import type { ShoppingItemInput } from '../types';

export interface ExtractedShoppingData {
  primary: ShoppingItemInput;
  detectedItems: Array<{
    item: string;
    actual_cost: number;
    category: string;
    notes?: string;
  }>;
  rawText: string;
  confidence: number;
  metadata: {
    vendor?: string;
    invoiceNo?: string;
    date?: string;
    totalAmount?: number;
  };
}

interface CategoryKeywordMap {
  [categoryKeyword: string]: string[];
}

const DEFAULT_CATEGORY_KEYWORDS: CategoryKeywordMap = {
  'Jewellery': [
    'chuda',
    'chura',
    'payal',
    'anklet',
    'maang tikka',
    'nath',
    'nose ring',
    'mangalsutra',
    'necklace',
    'bangle',
    'bangles',
    'earring',
    'earrings',
    'ring',
    'rings',
    'gold',
    'diamond',
    'silver',
    'kundan',
    'polki',
    'jewel',
    'jewellery',
    'jewelry',
    'carat',
    'karat',
    'pendant',
    'chain',
  ],
  'Groom Outfits': [
    'sherwani',
    'kurta',
    'pagri',
    'safa',
    'turban',
    'mojari',
    'jutti',
    'achkan',
    'bandhgala',
    'blazer',
    'tuxedo',
    'suit',
    'groom',
    'dhoti',
    'stole',
  ],
  'Bride Outfits': [
    'lehenga',
    'lehanga',
    'saree',
    'sari',
    'choli',
    'bridal',
    'gown',
    'anarkali',
    'blouse',
    'chunri',
    'veil',
    'bride',
    'sharara',
    'gharara',
    'petticoat',
    'dupatta',
  ],
  'Gifts': [
    'return gift',
    'gift',
    'hamper',
    'box',
    'dry fruit',
    'sweet',
    'mithai',
    'silver coin',
    'shagun',
    'envelope',
    'souvenir',
    'trousseau',
    'packing',
  ],
  'Pooja Items': [
    'pooja',
    'puja',
    'samagri',
    'diya',
    'roli',
    'chandan',
    'kalash',
    'coconut',
    'havan',
    'agarbatti',
    'camphor',
    'supari',
    'janeu',
    'sindoor',
    'gangajal',
  ],
  'Accessories & Footwear': [
    'shoes',
    'sandals',
    'heels',
    'footwear',
    'clutch',
    'purse',
    'handbag',
    'potli',
    'belt',
    'perfume',
    'fragrance',
    'watch',
    'sunglasses',
  ],
  'Decor & Miscellaneous': [
    'decor',
    'flower',
    'garland',
    'varmala',
    'jai mala',
    'ribbon',
    'lights',
    'props',
    'signage',
    'stationery',
  ],
};

/**
 * Normalizes Indian currency number strings (e.g. "1,25,000.00", "4500/-", "₹ 15,400") to clean number.
 */
export function parseCurrencyAmount(str: string): number {
  if (!str) return 0;
  const cleaned = str
    .replace(/[₹$€£]/g, '')
    .replace(/rs\.?|inr/gi, '')
    .replace(/\/-$/, '')
    .replace(/,/g, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100;
}

/**
 * Match a text phrase against known categories or available wedding categories using scoring.
 */
export function matchBestCategory(
  text: string,
  availableCategories: string[] = []
): string {
  const lower = text.toLowerCase();
  const categoryScores = new Map<string, number>();

  for (const [groupName, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }

    if (score > 0) {
      const targetCategory = availableCategories.find(
        (c) =>
          c.toLowerCase() === groupName.toLowerCase() ||
          c.toLowerCase().includes(groupName.toLowerCase()) ||
          groupName.toLowerCase().includes(c.toLowerCase()) ||
          keywords.some((kw) => c.toLowerCase().includes(kw))
      );

      const resolvedCat = targetCategory || groupName;
      const current = categoryScores.get(resolvedCat) || 0;
      categoryScores.set(resolvedCat, current + score);
    }
  }

  let bestCategory = '';
  let highestScore = 0;
  for (const [cat, score] of categoryScores.entries()) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  if (bestCategory) {
    const directAvailable = availableCategories.find((c) => c.toLowerCase() === bestCategory.toLowerCase());
    if (directAvailable) return directAvailable;
    const partial = availableCategories.find((c) => c.toLowerCase().includes(bestCategory.toLowerCase()) || bestCategory.toLowerCase().includes(c.toLowerCase()));
    if (partial) return partial;
    return availableCategories[0] || bestCategory;
  }

  for (const cat of availableCategories) {
    if (lower.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  return availableCategories[0] || '';
}

/**
 * Match responsible person from available family members.
 */
export function matchResponsiblePerson(
  text: string,
  familyMembers: string[] = []
): string {
  const lower = text.toLowerCase();
  for (const member of familyMembers) {
    if (member && lower.includes(member.toLowerCase())) {
      return member;
    }
  }
  return '';
}

/**
 * Extract metadata like vendor/shop name, invoice number, and date.
 */
export function extractMetadata(lines: string[]) {
  let vendor = '';
  let invoiceNo = '';
  let date = '';

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (
      line.length > 2 &&
      !/^(tax\s*invoice|tax\s*inv|bill|receipt|cash\s*memo|estimate|quotation|retail\s*invoice|invoice|date|order|gstin|gst)/i.test(line) &&
      !/^[0-9\W]+$/.test(line)
    ) {
      vendor = line.replace(/^[#\*\-•]\s*/, '').slice(0, 60);
      break;
    }
  }

  const fullText = lines.join('\n');

  const invMatch = fullText.match(/(?:tax\s*invoice|retail\s*invoice|invoice|bill|receipt|cash\s*memo|memo)\s*(?:no\.?|#|number|num)?\s*[:\-]?\s*([A-Za-z0-9\-_/]{3,30})/i);
  if (invMatch && invMatch[1]) {
    invoiceNo = invMatch[1].trim();
  }

  const dateMatch = fullText.match(/(?:date|dated)?\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{2,4})/i);
  if (dateMatch && dateMatch[1]) {
    date = dateMatch[1].trim();
  }

  return { vendor, invoiceNo, date };
}

/**
 * Extract line items with item name and amount from bill text lines.
 */
export function extractLineItems(
  lines: string[],
  availableCategories: string[] = []
): Array<{ item: string; actual_cost: number; category: string; notes?: string }> {
  const items: Array<{ item: string; actual_cost: number; category: string; notes?: string }> = [];

  const skipKeywords = /^(total|grand\s*total|sub\s*total|subtotal|net\s*amount|gst|cgst|sgst|igst|tax|vat|discount|round\s*off|balance|paid|change|amount\s*in\s*words|customer|date|invoice|bill|cash|card|upi)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 4) continue;

    if (skipKeywords.test(trimmed)) {
      continue;
    }

    // Match trailing price at end of line
    const priceMatch = trimmed.match(
      /(?:[:=\-–]|\.{2,}|\s+)\s*(?:(?:rs\.?|inr|₹)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|\d+)(?:\/-)?\s*$/i
    );

    if (priceMatch && priceMatch.index !== undefined) {
      const costStr = priceMatch[1];
      const cost = parseCurrencyAmount(costStr);
      const rawItem = trimmed
        .slice(0, priceMatch.index)
        .trim()
        .replace(/^[-*•0-9\.\)\s]+/, '')
        .trim();

      if (
        rawItem.length >= 3 &&
        cost > 0 &&
        !skipKeywords.test(rawItem) &&
        !/^(item|description|qty|quantity|rate|s\.?no|particulars|sr|amount|price|subtotal|total)$/i.test(rawItem)
      ) {
        items.push({
          item: rawItem.charAt(0).toUpperCase() + rawItem.slice(1),
          actual_cost: cost,
          category: matchBestCategory(rawItem, availableCategories),
        });
      }
    }
  }

  return items;
}

/**
 * Main parsing function that converts raw OCR or document text into structured ShoppingItem data.
 */
export function parseShoppingDocumentText(
  rawText: string,
  options?: {
    availableCategories?: string[];
    availableFamilyMembers?: string[];
  }
): ExtractedShoppingData {
  const availableCategories = options?.availableCategories || [];
  const availableFamilyMembers = options?.availableFamilyMembers || [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const metadata = extractMetadata(lines);
  const detectedItems = extractLineItems(lines, availableCategories);

  // 1. Extract Cost / Price: PRIORITIZE Grand Total / Net Amount > Total > Subtotal > First detected line item
  let totalCost = 0;

  // Step A: Explicit Grand Total / Net Payable / Final Amount
  const grandTotalMatch = rawText.match(
    /(?:grand\s*total|net\s*amount|net\s*payable|final\s*amount|total\s*payable|amount\s*payable)\s*[:=\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+)/i
  );
  if (grandTotalMatch && grandTotalMatch[1]) {
    totalCost = parseCurrencyAmount(grandTotalMatch[1]);
  }

  // Step B: Total Amount
  if (totalCost === 0) {
    const totalMatch = rawText.match(
      /(?:total\s*amount|total)\s*[:=\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+)/i
    );
    if (totalMatch && totalMatch[1]) {
      totalCost = parseCurrencyAmount(totalMatch[1]);
    }
  }

  // Step C: Subtotal / Estimated Price
  if (totalCost === 0) {
    const subtotalMatch = rawText.match(
      /(?:sub\s*total|subtotal|estimated\s*price|estimate)\s*[:=\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+)/i
    );
    if (subtotalMatch && subtotalMatch[1]) {
      totalCost = parseCurrencyAmount(subtotalMatch[1]);
    }
  }

  // Step D: Sum of detected items or currency match
  if (totalCost === 0 && detectedItems.length > 0) {
    totalCost = detectedItems.reduce((sum, item) => sum + item.actual_cost, 0);
  }

  if (totalCost === 0) {
    const genericMatch = rawText.match(/(?:rs\.?|inr|₹)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+)/i);
    if (genericMatch && genericMatch[1]) {
      totalCost = parseCurrencyAmount(genericMatch[1]);
    }
  }

  // 2. Extract Primary Item Name
  let primaryItem = '';

  if (detectedItems.length === 1) {
    primaryItem = detectedItems[0].item;
  } else if (detectedItems.length > 1) {
    primaryItem = detectedItems.map((d) => d.item).slice(0, 3).join(', ');
  } else {
    for (const keywords of Object.values(DEFAULT_CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        const regex = new RegExp(`\\b([A-Za-z\\s]{0,15}${kw}[A-Za-z\\s]{0,15})\\b`, 'i');
        const match = rawText.match(regex);
        if (match && match[1]) {
          const candidate = match[1].trim();
          if (candidate.length >= 3 && !/^(total|amount|bill|date|invoice)/i.test(candidate)) {
            primaryItem = candidate.charAt(0).toUpperCase() + candidate.slice(1);
            break;
          }
        }
      }
      if (primaryItem) break;
    }

    if (!primaryItem && metadata.vendor) {
      primaryItem = `Shopping from ${metadata.vendor}`;
    } else if (!primaryItem && lines.length > 0) {
      const candidateLine = lines.find(
        (l) =>
          l.length > 3 &&
          l.length < 50 &&
          !/^(invoice|bill|receipt|tax|date|total|gst)/i.test(l) &&
          !/[0-9]{4,}/.test(l)
      );
      if (candidateLine) {
        primaryItem = candidateLine;
      }
    }
  }

  if (!primaryItem) {
    primaryItem = 'Wedding Shopping Item';
  }

  // 3. Category classification
  const matchedCategory = matchBestCategory(
    `${primaryItem} ${rawText}`,
    availableCategories
  );

  // 4. Responsible Person
  const matchedPerson = matchResponsiblePerson(rawText, availableFamilyMembers);

  // 5. Status: Paid / Completed vs Quotation vs Alteration Pending
  let status = 'Completed';
  const lower = rawText.toLowerCase();
  if (lower.includes('alteration') || lower.includes('fitting') || lower.includes('tailor') || lower.includes('pending')) {
    status = 'Alteration Pending';
  } else if (lower.includes('quotation') || lower.includes('estimate') || lower.includes('proforma') || lower.includes('inquiry')) {
    status = 'Not Started';
  }

  // 6. Build Notes with enriched invoice details
  const notesParts: string[] = [];
  if (metadata.vendor) notesParts.push(`Vendor/Store: ${metadata.vendor}`);
  if (metadata.invoiceNo) notesParts.push(`Invoice/Bill #: ${metadata.invoiceNo}`);
  if (metadata.date) notesParts.push(`Date: ${metadata.date}`);
  if (detectedItems.length > 1) {
    notesParts.push(`Items:\n` + detectedItems.map((it) => `• ${it.item} - ₹${it.actual_cost.toLocaleString('en-IN')}`).join('\n'));
  }

  const generatedNotes = notesParts.join('\n');

  let confidence = 0.5;
  if (totalCost > 0) confidence += 0.2;
  if (metadata.vendor || metadata.invoiceNo) confidence += 0.15;
  if (detectedItems.length > 0) confidence += 0.15;

  return {
    primary: {
      item: primaryItem.slice(0, 120),
      category: matchedCategory || availableCategories[0] || '',
      responsible_person: matchedPerson || '',
      actual_cost: totalCost,
      status,
      notes: generatedNotes || 'Scanned from document',
    },
    detectedItems,
    rawText,
    confidence: Math.min(1, confidence),
    metadata: {
      ...metadata,
      totalAmount: totalCost,
    },
  };
}

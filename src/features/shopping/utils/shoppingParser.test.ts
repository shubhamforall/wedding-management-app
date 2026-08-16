import { describe, it, expect } from 'vitest';
import {
  parseCurrencyAmount,
  matchBestCategory,
  matchResponsiblePerson,
  extractMetadata,
  extractLineItems,
  parseShoppingDocumentText,
} from './shoppingParser';

describe('shoppingParser', () => {
  describe('parseCurrencyAmount', () => {
    it('parses standard numbers', () => {
      expect(parseCurrencyAmount('1500')).toBe(1500);
      expect(parseCurrencyAmount('45000.50')).toBe(45000.5);
    });

    it('parses currency symbols and Indian comma formatting', () => {
      expect(parseCurrencyAmount('₹ 1,25,000.00')).toBe(125000);
      expect(parseCurrencyAmount('Rs. 45,000/-')).toBe(45000);
      expect(parseCurrencyAmount('INR 8,500')).toBe(8500);
      expect(parseCurrencyAmount('$120.00')).toBe(120);
    });

    it('handles empty or invalid inputs', () => {
      expect(parseCurrencyAmount('')).toBe(0);
      expect(parseCurrencyAmount('invalid')).toBe(0);
    });
  });

  describe('matchBestCategory', () => {
    const categories = [
      'Groom Outfits',
      'Bride Outfits',
      'Jewellery',
      'Gifts',
      'Pooja Items',
      'Accessories & Footwear',
    ];

    it('matches groom outfit keywords', () => {
      expect(matchBestCategory('Designer Silk Sherwani with Stole', categories)).toBe('Groom Outfits');
      expect(matchBestCategory('Kurta Pajama & Safa Pagri', categories)).toBe('Groom Outfits');
      expect(matchBestCategory('Bandhgala Suit Tuxedo', categories)).toBe('Groom Outfits');
    });

    it('matches bride outfit keywords', () => {
      expect(matchBestCategory('Sabyasachi Velvet Bridal Lehenga', categories)).toBe('Bride Outfits');
      expect(matchBestCategory('Banarasi Silk Saree with heavy pallu', categories)).toBe('Bride Outfits');
      expect(matchBestCategory('Anarkali Gown and Dupatta', categories)).toBe('Bride Outfits');
    });

    it('matches jewellery keywords', () => {
      expect(matchBestCategory('22k Gold Kundan Polki Necklace Set', categories)).toBe('Jewellery');
      expect(matchBestCategory('Diamond Ring and Bangles', categories)).toBe('Jewellery');
      expect(matchBestCategory('Bridal Chuda and Payal', categories)).toBe('Jewellery');
    });

    it('matches gifts and pooja items', () => {
      expect(matchBestCategory('Dry Fruits Sweets Gift Box Hamper', categories)).toBe('Gifts');
      expect(matchBestCategory('Wedding Havan Samagri and Kalash Diya', categories)).toBe('Pooja Items');
    });
  });

  describe('matchResponsiblePerson', () => {
    const family = ['Uncle Ramesh', 'Priya Sharma', 'Shubham', 'Aunt Sunita'];

    it('identifies family members in text', () => {
      expect(matchResponsiblePerson('Purchased by Shubham for wedding', family)).toBe('Shubham');
      expect(matchResponsiblePerson('Bill delivered to Priya Sharma', family)).toBe('Priya Sharma');
      expect(matchResponsiblePerson('No person mentioned here', family)).toBe('');
    });
  });

  describe('extractMetadata', () => {
    it('extracts vendor, invoice number, and date', () => {
      const lines = [
        'Manyavar Mohey Bridal Store',
        'Connaught Place, New Delhi',
        'Tax Invoice No: INV-2024-8942',
        'Date: 15/11/2024',
        'Item: Sherwani Set',
      ];
      const meta = extractMetadata(lines);
      expect(meta.vendor).toBe('Manyavar Mohey Bridal Store');
      expect(meta.invoiceNo).toBe('INV-2024-8942');
      expect(meta.date).toBe('15/11/2024');
    });
  });

  describe('extractLineItems', () => {
    const categories = ['Groom Outfits', 'Bride Outfits', 'Jewellery'];

    it('extracts multiple line items with prices', () => {
      const lines = [
        'Manyavar Mohey',
        '1. Royal Sherwani Set ₹ 35,000',
        '2. Safa & Pagri Rs. 4,500',
        '3. Groom Mojari Shoes 3200/-',
        'Total Amount: 42,700',
      ];
      const items = extractLineItems(lines, categories);
      expect(items.length).toBe(3);
      expect(items[0].item).toBe('Royal Sherwani Set');
      expect(items[0].actual_cost).toBe(35000);
      expect(items[0].category).toBe('Groom Outfits');

      expect(items[1].item).toBe('Safa & Pagri');
      expect(items[1].actual_cost).toBe(4500);

      expect(items[2].item).toBe('Groom Mojari Shoes');
      expect(items[2].actual_cost).toBe(3200);
    });
  });

  describe('parseShoppingDocumentText', () => {
    const categories = ['Groom Outfits', 'Bride Outfits', 'Jewellery', 'Gifts'];
    const family = ['Priya', 'Rohan', 'Amit'];

    it('correctly parses complete wedding boutique receipt', () => {
      const sampleText = `
        KALKI FASHION BOUTIQUE
        Tax Invoice #: KF-9921
        Date: 24-10-2024
        Customer: Priya

        Item Description            Amount
        1. Bridal Red Velvet Lehenga   ₹ 85,000.00
        2. Designer Dupatta            ₹ 12,000.00
        
        Subtotal: ₹ 97,000.00
        GST (5%): ₹ 4,850.00
        Grand Total: ₹ 1,01,850.00
        Paid via Credit Card
      `;

      const result = parseShoppingDocumentText(sampleText, {
        availableCategories: categories,
        availableFamilyMembers: family,
      });

      expect(result.primary.actual_cost).toBe(101850);
      expect(result.primary.category).toBe('Bride Outfits');
      expect(result.primary.responsible_person).toBe('Priya');
      expect(result.primary.status).toBe('Completed');
      expect(result.metadata.vendor).toBe('KALKI FASHION BOUTIQUE');
      expect(result.metadata.invoiceNo).toBe('KF-9921');
      expect(result.primary.notes).toContain('KALKI FASHION BOUTIQUE');
      expect(result.primary.notes).toContain('KF-9921');
      expect(result.detectedItems.length).toBe(2);
    });

    it('handles alteration pending receipts', () => {
      const sampleText = `
        Raymond Custom Tailoring
        Order Slip # 441
        Sherwani Suit alteration pending
        Estimated Price: ₹ 18,500
      `;
      const result = parseShoppingDocumentText(sampleText, {
        availableCategories: categories,
      });

      expect(result.primary.status).toBe('Alteration Pending');
      expect(result.primary.actual_cost).toBe(18500);
      expect(result.primary.category).toBe('Groom Outfits');
    });

    it('handles quotation / estimate documents', () => {
      const sampleText = `
        Tanishq Jewellers
        Quotation / Estimate
        Date: 12/12/2024
        Gold Necklace 22kt - 45 grams
        Total: ₹ 2,80,000
      `;
      const result = parseShoppingDocumentText(sampleText, {
        availableCategories: categories,
      });

      expect(result.primary.status).toBe('Not Started');
      expect(result.primary.actual_cost).toBe(280000);
      expect(result.primary.category).toBe('Jewellery');
    });
  });
});

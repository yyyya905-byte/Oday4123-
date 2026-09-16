/**
 * Clean SVG and Canvas Barcode Generation Utility (Code 128 / EAN-13 pattern generator)
 * Produces 100% self-contained, high-DPI vector barcodes without external CDN dependencies.
 */

// Code 128 Table B encoding patterns
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (Start/Stop)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encodes text into Code 128 binary string ('1' for bar, '0' for space)
 */
export function encodeCode128(text: string): string {
  const cleanText = text.trim() || '00000000';
  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    const codeValue = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(codeValue);
    checksum += codeValue * (i + 1);
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  codes.push(STOP_CODE);

  let binary = "0000000000"; // Quiet zone (10 modules)

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      binary += (isBar ? "1" : "0").repeat(width);
      isBar = !isBar;
    }
  }

  binary += "0000000000"; // Quiet zone
  return binary;
}

/**
 * Normalizes Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) and Persian digits (۰۱۲۳۴۵۶۷۸۹) to standard Latin digits (0-9).
 * Also trims whitespace and dashes for robust code & PIN matching.
 */
export function normalizeArabicDigits(input: string): string {
  if (!input) return '';
  return input
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[\s\-_]/g, '')
    .trim();
}

/**
 * Generates an SVG path string for a barcode
 */
export function generateBarcodeSvg(
  barcodeValue: string, 
  options: {
    width?: number;
    height?: number;
    barColor?: string;
    bgColor?: string;
    showText?: boolean;
    fontSize?: number;
  } = {}
): string {
  const {
    width = 240,
    height = 70,
    barColor = '#0f172a',
    bgColor = '#ffffff',
    showText = true,
    fontSize = 12
  } = options;

  const binary = encodeCode128(barcodeValue);
  const totalModules = binary.length;
  const moduleWidth = width / totalModules;
  const barHeight = showText ? height - 18 : height;

  let rects = '';
  let inBar = false;
  let startX = 0;

  for (let i = 0; i < totalModules; i++) {
    if (binary[i] === '1' && !inBar) {
      inBar = true;
      startX = i * moduleWidth;
    } else if (binary[i] === '0' && inBar) {
      inBar = false;
      const barW = (i * moduleWidth) - startX;
      rects += `<rect x="${startX.toFixed(2)}" y="0" width="${barW.toFixed(2)}" height="${barHeight}" fill="${barColor}" />`;
    }
  }

  if (inBar) {
    const barW = (totalModules * moduleWidth) - startX;
    rects += `<rect x="${startX.toFixed(2)}" y="0" width="${barW.toFixed(2)}" height="${barHeight}" fill="${barColor}" />`;
  }

  const textElement = showText
    ? `<text x="${width / 2}" y="${height - 2}" font-family="ui-monospace, monospace" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="${barColor}">${barcodeValue}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${bgColor}" />
    ${rects}
    ${textElement}
  </svg>`;
}

/**
 * Calculates EAN-13 Check Digit
 */
export function calculateEan13CheckDigit(first12Digits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const num = parseInt(first12Digits[i] || '0', 10);
    sum += i % 2 === 0 ? num : num * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates a standard random 13-digit EAN Barcode
 */
export function generateRandomEan13(prefix: string = '621'): string {
  // 621 is Syrian GS1 prefix, or standard retail internal prefix
  let code = prefix;
  while (code.length < 12) {
    code += Math.floor(Math.random() * 10).toString();
  }
  const checkDigit = calculateEan13CheckDigit(code);
  return code + checkDigit.toString();
}

export type BarcodeLabelSize = 'thermal_50x30' | 'thermal_40x25' | 'thermal_60x40' | 'a4_sheet_24' | 'a4_sheet_30';

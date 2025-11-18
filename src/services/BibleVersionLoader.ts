/**
 * Bible Version Loader
 * Handles loading Bible translations from assets
 * Using require() with proper typing for Expo bundler
 */

// Map of available versions to their require statements
// This approach works with Expo's bundler while avoiding dynamic require issues
export function loadBibleVersion(versionId: string): any {
  const versionMap: { [key: string]: () => any } = {
    KJV: () => require("../../assets/bible/KJV_bible.json"),
    AKJV: () => require("../../assets/bible/AKJV_bible.json"),
    AMP: () => require("../../assets/bible/AMP_bible.json"),
    ASV: () => require("../../assets/bible/ASV_bible.json"),
    CSB: () => require("../../assets/bible/CSB_bible.json"),
    ESV: () => require("../../assets/bible/ESV_bible.json"),
    GNV: () => require("../../assets/bible/GNV_bible.json"),
    NASB: () => require("../../assets/bible/NASB_bible.json"),
    NET: () => require("../../assets/bible/NET_bible.json"),
    NIV: () => require("../../assets/bible/NIV_bible.json"),
    NKJV: () => require("../../assets/bible/NKJV_bible.json"),
    NLT: () => require("../../assets/bible/NLT_bible.json"),
    NRSV: () => require("../../assets/bible/NRSV_bible.json"),
    WEB: () => require("../../assets/bible/WEB_bible.json"),
    YLT: () => require("../../assets/bible/YLT_bible.json"),
  };

  const loader = versionMap[versionId];
  if (!loader) {
    throw new Error(`Version ${versionId} not available`);
  }

  try {
    return loader();
  } catch (error) {
    console.warn(`Error loading version ${versionId}:`, error);
    throw error;
  }
}

export function isVersionAvailable(versionId: string): boolean {
  return Object.keys(AVAILABLE_VERSIONS).includes(versionId);
}

export const AVAILABLE_VERSIONS = {
  KJV: { name: "King James Version", category: "Classic" },
  AKJV: { name: "American King James Version", category: "Classic" },
  ASV: { name: "American Standard Version", category: "Classic" },
  YLT: { name: "Young's Literal Translation", category: "Literal" },
  WEB: { name: "World English Bible", category: "Modern" },
  NRSV: { name: "New Revised Standard Version", category: "Scholarly" },
  ESV: { name: "English Standard Version", category: "Scholarly" },
  NASB: { name: "New American Standard Bible", category: "Literal" },
  NET: { name: "New English Translation", category: "Scholarly" },
  NIV: { name: "New International Version", category: "Balanced" },
  NKJV: { name: "New King James Version", category: "Classic" },
  NLT: { name: "New Living Translation", category: "Readability" },
  AMP: { name: "Amplified Bible", category: "Detailed" },
  CSB: { name: "Christian Standard Bible", category: "Balanced" },
  GNV: { name: "Geneva Bible", category: "Classic" },
};

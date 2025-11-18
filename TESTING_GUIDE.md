# Testing Multi-Version Implementation

## Pre-Test Checklist
- [x] All 15 Bible translations downloaded (~/BibleApp/assets/bible/*.json)
- [x] Code compiles with zero TypeScript errors
- [x] All new modules created (BibleVersionLoader.ts)
- [x] All screens updated with version support
- [x] Context updated for version management

## Test Scenarios

### Scenario 1: App Startup and Default Version
**Test:** Verify app starts with KJV as default

1. Start Expo dev server:
   ```bash
   cd ~/BibleApp && npm start
   ```

2. Open app (iOS simulator or Android)

3. **Expected Results:**
   - ✅ App loads without crashes
   - ✅ "Bible App" home screen appears
   - ✅ Verse of day displays (John 3:16 in KJV)
   - ✅ No console errors

**Verification:**
```
Look for in console:
- "KJV loaded successfully from local JSON"
- Verse text appears (KJV translation)
```

---

### Scenario 2: Settings Tab - Version List
**Test:** Verify Settings displays all 15 versions organized by category

1. Tap **Settings** tab at bottom

2. **Expected Results:**
   - ✅ Page titled "Bible Versions"
   - ✅ Versions organized by category:
     - Classic (5 versions)
     - Literal (2 versions)
     - Scholarly (3 versions)
     - Balanced (2 versions)
     - Modern (1 version)
     - Readability (1 version)
     - Detailed (1 version)
   - ✅ KJV has checkmark (currently selected)
   - ✅ No crashes or errors

**Verification:**
```
Count versions in each category:
Classic: KJV, AKJV, ASV, NKJV, GNV (5)
Literal: YLT, NASB (2)
Scholarly: NRSV, ESV, NET (3)
Balanced: CSB, NIV (2)
Modern: WEB (1)
Readability: NLT (1)
Detailed: AMP (1)
Total: 15 ✓
```

---

### Scenario 3: Version Switching - ESV
**Test:** Switch to ESV and verify it works everywhere

1. In Settings, tap **English Standard Version (ESV)**

2. **Expected Results:**
   - ✅ Checkmark moves to ESV
   - ✅ No crashes or loading delays
   - ✅ Screen shows updated

3. Tap **Home** tab

4. **Expected Results:**
   - ✅ Verse of day text changed (ESV translation of John 3:16)
   - ✅ Different wording than KJV version

5. Tap **Books** tab, select **Genesis**, chapter **1**

6. **Expected Results:**
   - ✅ Genesis 1:1 shows ESV translation
   - ✅ All verses in ESV translation
   - ✅ No version artifacts

**Expected Text Samples:**
```
KJV:  "In the beginning God created the heaven and the earth."
ESV:  "In the beginning, God created the heavens and the earth."
```

---

### Scenario 4: Version Switching - NLT
**Test:** Switch to completely different translation

1. Go to Settings

2. Tap **New Living Translation (NLT)**

3. **Expected Results:**
   - ✅ Checkmark on NLT
   - ✅ Loads without delay
   - ✅ No errors

4. Go to Home

5. **Expected Results:**
   - ✅ Verse of day significantly different (more paraphrase-like)

**Expected Text:**
```
NLT: "In the beginning God created the heavens and the earth."
     (More modern/conversational phrasing)
```

---

### Scenario 5: Search Functionality - Version-Specific
**Test:** Verify search returns results in current version

1. Go to Settings, switch to **NASB** (New American Standard Bible)

2. Go to **Search** tab

3. Type: "love"

4. **Expected Results:**
   - ✅ Results appear (within 100-200ms)
   - ✅ All results tagged with "NASB" in version field
   - ✅ NASB translation of verses with "love"
   - ✅ Up to 50 results shown

5. Note a verse reference (e.g., "1 John 4:8")

6. Go to Books, navigate to 1 John 4:8

7. **Expected Results:**
   - ✅ Same verse shows NASB translation
   - ✅ Text matches search result

---

### Scenario 6: Version Persistence
**Test:** Verify version selection survives app restart

1. Go to Settings, select **NIV** (New International Version)

2. Tap checkmark ✓ (confirm selection)

3. **Force close app** (or simulator)
   - iOS Simulator: Cmd+H then close
   - Android: Back button until closed

4. **Reopen app**

5. **Expected Results:**
   - ✅ App starts with NIV selected (not KJV)
   - ✅ Home verse of day shows NIV translation
   - ✅ Verification in console: no "KJV loaded" message

---

### Scenario 7: Chapter Navigation in All Versions
**Test:** Navigate through multiple chapters in different versions

1. Go to Books tab

2. Select **Genesis**

3. Go to chapter 1

4. **Expected Results:**
   - ✅ Chapter loads instantly
   - ✅ Current version displayed
   - ✅ 31 verses shown

5. Scroll down

6. **Expected Results:**
   - ✅ All verses display correctly
   - ✅ Verse numbering correct (1-31)
   - ✅ No missing or duplicated verses

7. Tap another chapter (e.g., Genesis 2)

8. **Expected Results:**
   - ✅ Transitions instantly
   - ✅ Correct number of verses (30 in Gen 2)
   - ✅ Correct translation

9. Go to Settings, switch to different version

10. Go back to Books, select new chapter

11. **Expected Results:**
    - ✅ New version displayed in new chapter
    - ✅ Translation matches selected version

---

### Scenario 8: Search Results Display Version
**Test:** Verify search results clearly show their version

1. Go to Settings, select **KJV**

2. Go to Search

3. Search: "faith"

4. **Expected Results:**
   - ✅ Results show "version: KJV"
   - ✅ KJV translation of faith verses

5. Note 2-3 results

6. Go to Settings, switch to **ESV**

7. Go to Search

8. Search: "faith"

9. **Expected Results:**
   - ✅ Results show "version: ESV"
   - ✅ Same verse references but ESV translation
   - ✅ Different wording visible

**Example:**
```
KJV: "Now faith is the substance of things hoped for..."
ESV: "Now faith is the assurance of things hoped for..."
```

---

### Scenario 9: Multiple Version Loads
**Test:** Load several versions sequentially to verify lazy loading

1. Settings → **AMP** (Amplified Bible) - note load time

2. **Expected Results:**
   - ✅ First load: ~300ms (loads from disk)
   - ✅ Subsequent switches to AMP: instant
   - ✅ In memory now

3. Settings → **NKJV** - note load time

4. **Expected Results:**
   - ✅ First load: ~300ms
   - ✅ From now on: instant

5. Repeat for **YLT** and **NET**

6. **Expected Results:**
   - ✅ Each version loads once
   - ✅ All subsequent accesses instant
   - ✅ No memory leaks or crashes

---

### Scenario 10: Bookmarks Work Across Versions
**Test:** Bookmark a verse in one version, check it in another

1. Go to Settings → **ESV**

2. Go to Books → John → chapter 3

3. Find verse 16, bookmark it (tap bookmark icon)

4. **Expected Results:**
   - ✅ Bookmark saved (icon filled)

5. Go to Settings → **KJV**

6. Go to Bookmarks or Library

7. **Expected Results:**
   - ✅ John 3:16 still appears in list
   - ✅ Bookmark is version-agnostic
   - ✅ Points to same verse in KJV

---

## Performance Metrics to Verify

### Startup Time
```
Target: < 500ms
Measure: Console log "KJV loaded successfully"
Acceptable: 200-400ms
```

### Version Switch Time
```
Target (first load): < 500ms
Target (subsequent): < 100ms
Measure: Time between tap and checkmark appears
```

### Chapter Load Time
```
Target: < 50ms
Measure: Time from tap to chapter displays
Acceptable: < 100ms
```

### Search Time
```
Target: < 200ms
Measure: Time from typing to results appear
Acceptable: < 500ms
```

---

## Error Scenarios to Check

### Scenario A: Invalid Version
**Test:** What happens if version file corrupted/missing

1. Manually delete one version file:
   ```bash
   rm ~/BibleApp/assets/bible/ESV_bible.json
   ```

2. Restart app

3. Go to Settings, try to select ESV

4. **Expected Results:**
   - ✅ Error in console (not crash)
   - ✅ Stays on current version
   - ✅ Message like "Error loading ESV"

5. Restore file:
   ```bash
   # Version file should be re-downloaded
   ```

### Scenario B: Search with No Results
**Test:** Search term that doesn't exist

1. Go to Search

2. Type: "xyzabc123notaword"

3. **Expected Results:**
   - ✅ No results after 500ms
   - ✅ Shows "No results found"
   - ✅ No crash

### Scenario C: Memory Usage
**Test:** Check memory after loading multiple versions

1. Open app, go to Settings

2. Switch through 8-10 different versions

3. **Expected Results:**
   - ✅ No excessive memory growth
   - ✅ No crashes or out-of-memory errors
   - ✅ App remains responsive

---

## Test Results Template

```
TEST DATE: _____________
TESTER: _________________
PLATFORM: iOS / Android
DEVICE: ________________

Scenario 1: Startup          ☐ PASS ☐ FAIL
Scenario 2: Version List     ☐ PASS ☐ FAIL
Scenario 3: ESV Switch       ☐ PASS ☐ FAIL
Scenario 4: NLT Switch       ☐ PASS ☐ FAIL
Scenario 5: Search           ☐ PASS ☐ FAIL
Scenario 6: Persistence      ☐ PASS ☐ FAIL
Scenario 7: Navigation       ☐ PASS ☐ FAIL
Scenario 8: Results Display  ☐ PASS ☐ FAIL
Scenario 9: Multiple Loads   ☐ PASS ☐ FAIL
Scenario 10: Bookmarks       ☐ PASS ☐ FAIL

Performance:
  Startup: _____ ms
  Version Switch (1st): _____ ms
  Version Switch (2nd): _____ ms
  Chapter Load: _____ ms
  Search: _____ ms

Issues Found:
1. ________________________
2. ________________________
3. ________________________

Overall Status: ☐ PASS ☐ FAIL WITH ISSUES ☐ FAIL
```

---

## Success Criteria

✅ **All scenarios pass without errors**
✅ **Version switching is instant (< 100ms after load)**
✅ **All 15 versions accessible and functional**
✅ **Version preference persists across app restart**
✅ **Search works correctly in all versions**
✅ **No TypeScript errors or console warnings**
✅ **App remains responsive under normal usage**

If all criteria met, implementation is **COMPLETE AND READY FOR PRODUCTION**.

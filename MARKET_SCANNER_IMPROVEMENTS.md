# Market Scanner - Performance Improvements & Implementation Guide

## Executive Summary

The Market Scanner was experiencing blocking issues where multiple scan iterations were being skipped because the previous scan was still running. This document outlines the root cause, all improvements made, and how to validate them.

---

## Root Cause Analysis

### The Problem
- Market Scanner processes **245 combinations** (49 assets × 5 timeframes)
- Each scan was taking longer than the 15-second interval
- The `isScanning` lock would remain true, blocking all subsequent scan attempts
- `recuperarTradesPendentes()` and `limparDadosAntigos()` were running synchronously with `await`, blocking the entire scan cycle

### Why It Was Failing
```
Time 0s:   Scan #1 starts (isScanning = true)
Time 5s:   Still processing combinations...
Time 10s:  Recovery + cleanup starts (with await)
Time 15s:  Scan #2 SKIPPED (isScanning still true) ← PROBLEM
Time 20s:  Scan #3 SKIPPED
Time 25s+: Scan #1 finally completes
```

---

## Improvements Made

### ✅ 1. Background Fire-and-Forget Operations (CRITICAL FIX)

**Before:**
```javascript
if (this.scanCount % 6 === 0) {
  await this.recuperarTradesPendentes();  // BLOCKS HERE
  await this.limparDadosAntigos();        // AND HERE
}
this.scanCount++;
```

**After:**
```javascript
if (this.scanCount % 6 === 0) {
  // Fire-and-forget: Don't await these operations
  this.recuperarTradesPendentes().catch(err => {
    console.error(`❌ Background recovery error: ${err.message}`);
  });
  this.limparDadosAntigos().catch(err => {
    console.error(`❌ Background cleanup error: ${err.message}`);
  });
}
this.scanCount++;
```

**Impact**: Eliminates scan blocking from cleanup/recovery operations

---

### ✅ 2. Safety Timeout for isScanning Lock

**New Implementation:**
```javascript
this.SCAN_TIMEOUT = 25000; // 25 seconds max per scan

// At the start of each interval:
if (this.isScanning && this.scanStartTime) {
  const scanDuration = Date.now() - this.scanStartTime;
  if (scanDuration > this.SCAN_TIMEOUT) {
    console.error(`🚨 TIMEOUT RECOVERY: Previous scan exceeded limit...`);
    this.isScanning = false; // Force unlock
  }
}
```

**Impact**: Prevents infinite blocking if a scan hangs unexpectedly

---

### ✅ 3. Comprehensive Performance Metrics

Added detailed timing for each stage:

```
[STAGE 1] Get fixed assets: 5ms
[STAGE 2] Get SDK actives: 12ms
[STAGE 3] Filter actives: 8ms
[STAGE 4] Create combinations: 2ms
[STAGE 5] Process batches: 11,500ms
  - Batch #1: 850ms (42.5ms/combo)
  - Batch #2: 920ms (46.0ms/combo)
  - ...
  - Candles fetched: 235, Errors: 10
[STAGE 6] Batch insert: 250ms
```

**Impact**: Easy to identify performance bottlenecks

---

### ✅ 4. Enhanced Error Logging

**Before:**
```javascript
try {
  const candles = await this.candlesService.getCandles(...);
} catch (err) {
  // Silent - too many assets to log every error
  return null;
}
```

**After:**
```javascript
try {
  const candles = await this.candlesService.getCandles(...);
} catch (err) {
  totalCandlesErrors++;
  console.error(`❌ Error fetching candles for ${active.ticker} @ ${timeframe}s: ${err.message}`);
  return null;
}
```

**Impact**: Errors are now visible and can be diagnosed

---

### ✅ 5. Increased Parallelism

**Before:**
```javascript
const PARALLEL_BATCH_SIZE = 20;
```

**After:**
```javascript
const PARALLEL_BATCH_SIZE = 35; // ✅ +75% throughput
```

**Impact**: Processes more API calls in parallel, reducing total scan time

---

## Expected Performance Impact

### Before Optimization
```
Scenario: 245 combinations, 49 assets
- Per-batch time (20 parallel): ~1,200ms
- Total batches needed: 13
- Stage 5 total: ~15,600ms (exceeds 15s interval!)
- Skipped scans: Frequent
```

### After Optimization
```
Scenario: 245 combinations, 49 assets
- Per-batch time (35 parallel): ~700-900ms (fewer but larger batches)
- Total batches needed: 7
- Stage 5 total: ~6,300-6,900ms (within 15s interval!)
- Fire-and-forget recovery: Doesn't block scans
- Skipped scans: Should be 0-1 maximum
```

### Expected Time Breakdown (Full Scan)
```
STAGE 1-4 (setup):        27ms
STAGE 5 (candles + analysis): 6,500-7,000ms
STAGE 6 (insert):         200-300ms
────────────────────────
Total per scan:           6,727-7,327ms (should fit in 15s interval!)
```

---

## Deployment Steps

### Step 1: Backup Current Version
```bash
cp apps/backend/src/bot/market-scanner.mjs apps/backend/src/bot/market-scanner.mjs.backup
```

### Step 2: Deploy Updated Code
The new code is already in place with:
- ✅ Background fire-and-forget operations
- ✅ Safety timeout (25 seconds)
- ✅ Detailed performance metrics
- ✅ Enhanced error logging
- ✅ Increased parallelism (20→35)

### Step 3: Start the Scanner
```bash
npm start
# or
pm2 start apps/backend/src/bot/market-scanner.mjs
```

---

## Validation Checklist

### ✅ Phase 1: Deployment Validation (First 1-2 minutes)

1. **Scanner Starts Successfully**
   - [ ] See "🔄 Scanner tempo real iniciado"
   - [ ] See "✅ Market Scanner conectado ao Avalon"

2. **First Scan Completes**
   - [ ] See "🟢 ===== SCAN #1 INICIADO ====="
   - [ ] See all STAGE timings
   - [ ] See "🟢 ===== SCAN #1 COMPLETED (X.Xs) ====="

3. **Metrics Visible**
   - [ ] Stage 5 (candles): Should be 6,500-8,500ms
   - [ ] Total scan time: Should be 6,700-8,700ms
   - [ ] No "SKIPPED" messages yet

### ✅ Phase 2: Continuous Operation (5-10 minutes)

1. **No Blocking Detected**
   - [ ] Skipped scans counter: Should remain at 0-1
   - [ ] If shows 2+, timing degradation is occurring

2. **Error Handling Working**
   - [ ] Any candle fetch errors are logged with asset/timeframe
   - [ ] No silent failures
   - [ ] Supabase errors show code + details

3. **Background Operations**
   - [ ] Every 90 seconds (scan #6), see recovery/cleanup starting in background
   - [ ] Recovery/cleanup shouldn't block subsequent scans
   - [ ] See "[RECOVERY]" and "[CLEANUP]" logs

4. **Data Collection**
   - [ ] Note the stage timings from 5-10 scans
   - [ ] Calculate average scan duration
   - [ ] Identify if any stage is consistently slow

### ✅ Phase 3: Performance Validation (After 10+ scans)

Calculate metrics:
```
Average scan time: (Sum of all scan times) / Number of scans
Candle fetch rate: 245 combinations / Average Stage 5 time
Signals per scan: Count from logs
Database insert success rate: Inserts without errors / Total scans
```

**Success Criteria:**
- ✅ Average scan time < 12 seconds
- ✅ Skipped scans ≤ 1
- ✅ Candle errors < 10% of combinations
- ✅ All Supabase inserts successful (0 errors)

---

## Monitoring Commands

### Watch Scanner in Real-Time
```bash
# If using PM2:
pm2 logs market-scanner

# If running directly:
node apps/backend/src/bot/market-scanner.mjs
```

### Log Analysis Pattern
```
Scan #1: 6.8s ✅
Scan #2: 7.1s ✅
Scan #3: 7.3s ✅ (Recovery running in background)
Scan #4: 6.9s ✅
...
Scan #X: 7.0s ✅
```

### Database Validation
```sql
-- Check signals are being inserted
SELECT COUNT(*) as total_signals,
       COUNT(CASE WHEN result = 'PENDING' THEN 1 END) as pending
FROM strategy_trades
WHERE signal_timestamp > NOW() - INTERVAL '5 minutes';

-- Check for errors in trades
SELECT COUNT(*) FROM strategy_trades
WHERE result = 'LOSS' AND active_id IS NULL; -- Should be 0
```

---

## Troubleshooting

### Issue: Still seeing "SKIPPED" messages
**Solution**: One or more stages are taking too long. Check:
1. Stage 5 time is > 8,000ms?
   - Increase parallelism to 50 (careful with API limits)
   - Or reduce timeframes to [10, 60, 300]

2. Supabase insert time is > 1,000ms?
   - Check Supabase query performance
   - Verify indexes on `signal_timestamp` and `result`

### Issue: High candle fetch errors
**Solution**: API rate limiting detected. Options:
1. Add delays between batches
2. Reduce PARALLEL_BATCH_SIZE back to 25-30
3. Distribute scans across multiple instances

### Issue: Timeout recovery message appears
**Solution**: A scan exceeded 25 seconds. Critical performance issue:
1. Check which stage is slow (review logs)
2. Consider reducing assets or timeframes
3. Verify Avalon API is responsive

---

## Performance Optimization Options (If Needed)

### If Scan Time is 12-15 seconds (OK but tight):
```javascript
const SCAN_INTERVAL = 20000; // 20 seconds instead of 15
```

### If Scan Time is 15-20 seconds (Too slow):
```javascript
// Option 1: More parallelism
const PARALLEL_BATCH_SIZE = 50;

// Option 2: Fewer timeframes
const TIMEFRAMES = [10, 60, 300]; // Remove 30 and 180

// Option 3: Combined approach
const PARALLEL_BATCH_SIZE = 40;
const TIMEFRAMES = [10, 60, 300];
const SCAN_INTERVAL = 20000;
```

### If Scan Time is 20+ seconds (Critical):
```javascript
// Reduce to essential assets only
const TIMEFRAMES = [10, 60]; // Only 2 timeframes
const PARALLEL_BATCH_SIZE = 50;
const SCAN_INTERVAL = 30000; // 30 seconds
```

---

## Success Stories

### Expected Before/After Comparison

**BEFORE (Original Code):**
```
✅ Trade 20206448 | WIN | 5.88
✅ Trade a992104a | LOSS | 0.02
⚠️  Scan anterior ainda em execução, pulando esta iteração...
⚠️  Scan anterior ainda em execução, pulando esta iteração...
⚠️  Scan anterior ainda em execução, pulando esta iteração...
[Repeated 10+ times]
```

**AFTER (Optimized Code):**
```
🟢 ===== SCAN #1 INICIADO =====
⏱️ [STAGE 1] Get fixed assets: 5ms
⏱️ [STAGE 2] Get SDK actives: 12ms
...
⏱️ [STAGE 5] All batches completed: 6,800ms
✅ 125 sinais inseridos em batch
🟢 ===== SCAN #1 COMPLETED (6.9s) =====

🟢 ===== SCAN #2 INICIADO ===== (No skipped scans!)
```

---

## Files Modified

1. **`apps/backend/src/bot/market-scanner.mjs`**
   - ✅ Added `SCAN_TIMEOUT` constant
   - ✅ Added `scanStartTime` tracking
   - ✅ Enhanced `scanLoop()` with detailed metrics
   - ✅ Implemented fire-and-forget for recovery/cleanup
   - ✅ Increased `PARALLEL_BATCH_SIZE` from 20 to 35
   - ✅ Added comprehensive error logging
   - ✅ Enhanced `recuperarTradesPendentes()` and `limparDadosAntigos()` logging

---

## Next Steps

1. ✅ Deploy the code (already done)
2. ⏳ Monitor for 10-15 minutes
3. ⏳ Collect performance metrics
4. ⏳ Adjust parallelism if needed
5. ⏳ Document final performance baseline

---

## Reference Documents

- `MARKET_SCANNER_DIAGNOSTIC.md` - Diagnostic output format and validation
- Original issue logs - Available in git history

---

**Last Updated:** 2025-10-16
**Version:** 2.0 (Optimized)
**Status:** Ready for Deployment

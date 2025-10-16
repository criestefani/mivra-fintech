# Market Scanner - Diagnostic & Performance Analysis Report

## Summary of Changes

### ✅ Completed Improvements

#### 1. **Detailed Timestamp Logging** (STAGE-BASED)
Added comprehensive timing metrics for all critical sections:

- **STAGE 1**: Get fixed assets
- **STAGE 2**: Get SDK actives
- **STAGE 3**: Filter available actives
- **STAGE 4**: Create combinations array
- **STAGE 5**: Process combinations in parallel batches
  - Per-batch timing metrics
  - Per-candle fetch error tracking
  - Candles fetched vs errors count
- **STAGE 6**: Batch insert to Supabase
  - Insert execution time
  - Error details with code and details

#### 2. **Enhanced Error Logging**
Replaced silent `catch` blocks with detailed error reports:

- **getCandles() errors**: Now logged with asset ticker, timeframe, and error message
- **Strategy analysis errors**: Visible error messages
- **Supabase errors**: Full error object with code and details
- **Recovery operations**: Detailed recovery status and completion times
- **Cleanup operations**: Deletion count and operation timing

#### 3. **Safety Timeout for isScanning Lock**
Added automatic timeout recovery to prevent infinite blocking:

- Lock timeout: **25 seconds** (SCAN_INTERVAL is 15s + 67% buffer)
- Auto-recovery when scan exceeds timeout
- Warning messages show how long the previous scan was pending

#### 4. **Background Fire-and-Forget Operations**
Recovery and cleanup operations now run in the background:

- No longer blocks scan execution
- Errors are caught and logged
- Every 6th scan (90 seconds) triggers cleanup/recovery

---

## Diagnostic Output Format

### Each Scan Now Outputs:

```
🟢 ===== SCAN #1 INICIADO =====
⏱️ [STAGE 1] Get fixed assets: 5ms
⏱️ [STAGE 2] Get SDK actives: 12ms
⏱️ [STAGE 3] Filter actives: 8ms
✅ 49/49 ativos disponíveis

⏱️ [STAGE 4] Create combinations: 2ms
🔄 Processando 245 combinações em 13 batches (20 por vez)...

⏱️ Batch #1: 20 combos em 850ms (42.5ms/combo)
⏱️ Batch #2: 20 combos em 920ms (46.0ms/combo)
...

⏱️ [STAGE 5] All batches completed: 11500ms
📊 Candles fetched: 235, Errors: 10

📝 Inserting 120 sinais into Supabase...
✅ 120 sinais inseridos em batch (250ms)

⏱️ [STAGE 6] Batch insert: 250ms

████████████████████████████████████████████████████████
⏱️ SCAN #1 SUMMARY:
   Total time: 12.5s
   Combinations analyzed: 245
   Signals found: 120
   Total accumulated: 120
   Skipped scans so far: 0
████████████████████████████████████████████████████████

🟢 ===== SCAN #1 COMPLETED (12.5s) =====
```

---

## Key Metrics to Monitor

### Performance Indicators
1. **Scan Duration**: Should be under 15 seconds (SCAN_INTERVAL)
   - Currently with logging, expect 10-15s
   - If exceeding 15s, optimization needed

2. **Skipped Scans Counter**: How many times lock was already acquired
   - 0-1 is ideal (scans complete before next interval)
   - High number indicates performance degradation

3. **Candles Fetch Errors**: Track failed API calls
   - High error count = API rate limiting or network issues
   - Should be < 10% of total combinations

4. **Supabase Insert Time**: Should be < 1 second for 200+ signals
   - Indicates database performance

### Expected Performance Ranges

```
GOOD PERFORMANCE:
- Scan duration: 10-15s
- Batch time/combo: 30-50ms
- Supabase insert: 200-500ms
- Skipped scans: 0-1

DEGRADED PERFORMANCE:
- Scan duration: 15-20s
- Batch time/combo: 50-100ms
- Supabase insert: 500ms-2s
- Skipped scans: 2+

CRITICAL ISSUES:
- Scan duration: 20s+
- Batch time/combo: 100ms+
- Supabase insert: 2s+
- Skipped scans: 5+
```

---

## Investigation Checklist

### Before Running Scanner
- [ ] Verify Supabase credentials in `.env` (SUPABASE_URL, SUPABASE_SERVICE_KEY)
- [ ] Confirm `strategy_trades` table exists with correct schema:
  - `id` (primary key, UUID)
  - `active_id` (varchar)
  - `ativo_nome` (varchar)
  - `timeframe` (integer)
  - `signal_timestamp` (timestamp)
  - `signal_direction` (varchar: 'CALL' or 'PUT')
  - `signal_price` (numeric/float)
  - `result` (varchar: 'PENDING', 'WIN', 'LOSS')
  - `result_timestamp` (timestamp, nullable)
  - `result_price` (numeric/float, nullable)
  - `price_diff` (numeric/float, nullable)

### During Scanner Execution
- [ ] Watch for STAGE timing metrics (should be <50ms each)
- [ ] Monitor batch processing time per combination (30-50ms is ideal)
- [ ] Check for candles fetch errors (warnings with asset/timeframe)
- [ ] Verify signals are being collected
- [ ] Confirm Supabase inserts are successful (no error messages)
- [ ] Track skipped scans counter

### Recovery Operations (Every 90 seconds)
- [ ] Recovery logs should show PENDING trades verification status
- [ ] Cleanup logs should show old data deletion count
- [ ] Both should complete within reasonable time (< 5s)

---

## Optimization Strategies (To Be Implemented)

### If Scan Duration Exceeds 15 seconds:

#### Option A: Increase Scan Interval
```javascript
const SCAN_INTERVAL = 30000; // 30 seconds instead of 15
```
**Pros**: Simple, immediate effect
**Cons**: Slower signal detection

#### Option B: Increase Parallelism
```javascript
const PARALLEL_BATCH_SIZE = 50; // 50 instead of 20
```
**Pros**: Faster processing
**Cons**: Need to verify Avalon API rate limits

#### Option C: Reduce Assets/Timeframes
```javascript
const TIMEFRAMES = [10, 60, 300]; // Fewer timeframes
// Or filter to fewer assets in fixed-assets.mjs
```
**Pros**: Directly reduces work
**Cons**: Fewer signals generated

#### Option D: Optimize Strategy Analysis
Ensure `analyzeAggressive()` is efficient:
- Check if it's doing redundant calculations
- Profile CPU usage during strategy analysis

---

## Validation Checklist

### ✅ After Deploying New Code

1. **Logging Verification**
   - [ ] Run scanner for 1-2 minutes
   - [ ] Verify STAGE timings appear in logs
   - [ ] Confirm error messages show detailed information
   - [ ] Check for "SCAN #X COMPLETED" messages

2. **Lock Mechanism Verification**
   - [ ] Expect 0 skipped scans if timing is good
   - [ ] If >2 skipped scans, timing degradation detected
   - [ ] If timeout recovery message appears, previous scan exceeded limit

3. **Data Flow Verification**
   - [ ] Signals should be logged with asset ticker, timeframe, direction
   - [ ] Supabase insert should show count of inserted signals
   - [ ] Check database directly: `SELECT COUNT(*) FROM strategy_trades WHERE result = 'PENDING'`

4. **Performance Metrics**
   - [ ] Calculate average scan duration
   - [ ] Calculate average candles per scan
   - [ ] Calculate average signals per scan
   - [ ] Compare before/after

---

## Database Query for Validation

```sql
-- Check if signals are being inserted
SELECT
  DATE_TRUNC('minute', signal_timestamp) as minute,
  COUNT(*) as signals_count,
  COUNT(CASE WHEN result = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN result = 'WIN' THEN 1 END) as wins,
  COUNT(CASE WHEN result = 'LOSS' THEN 1 END) as losses
FROM strategy_trades
WHERE signal_timestamp > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', signal_timestamp)
ORDER BY minute DESC;
```

---

## Next Steps

1. **Deploy the updated market-scanner.mjs**
2. **Run for 5-10 minutes and collect logs**
3. **Analyze metrics against expected ranges**
4. **If needed, implement optimization strategy**
5. **Re-test and validate improvements**

---

## Notes

- The timeout safety mechanism (25 seconds) will prevent infinite blocking
- Background recovery/cleanup prevents scan blocking
- All error messages are now visible and detailed
- Metrics will help identify which stage is the bottleneck

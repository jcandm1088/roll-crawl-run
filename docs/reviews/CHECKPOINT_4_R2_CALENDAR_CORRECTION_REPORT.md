# Checkpoint 4-R2 — Calendar Shortcut Routing Correction (R-027): Report

*Prepared by Claude Code, 2026-11-28. Automated results are from headless Chromium on Linux. Not tested by a person. Fictional data only.*

## 1. Summary
- **R-027 is corrected** with the mechanism added for the Journal's R-026. One call changed in one file.
- **An unrelated, older Journal defect was found on the way (R-028) and is not corrected.** It can lose unsaved typing. It needs your decision (section 5).

## 2. History, as it happened
1. The owner saw an unexpected editor in the Journal after switching children.
2. ChatGPT identified a suspected routing-state cause from the source.
3. Claude Code reproduced and confirmed that cause, and corrected the Journal (R-026).
4. That investigation found the equivalent defect in the Calendar, present since Checkpoint 3.
5. The owner authorized the Calendar correction separately.

The owner's original Calendar acceptance was not a failed test: the affected sequence had not been identified and was not part of it.

## 3. Exact application-code change
`src/ui/screens/calendar/Calendar.tsx` only:
```diff
+import { consumeRoute } from '../../../router';
 ...
-  // Opened from "New event" on Home (#/calendar/add): keep the address as the plain Calendar afterwards.
+  // Opened from "New event" on Home (#/calendar/add): the request is used once. The address becomes the plain
+  // Calendar and the app's own route state follows it, so a later remount of this screen (a child switch)
+  // can't open the form again (R-027; same mechanism as the Journal's R-026).
   useEffect(() => {
-    if (openAdd) window.history.replaceState(null, '', '#/calendar');
+    if (openAdd) consumeRoute({ name: 'calendar' });
   }, [openAdd]);
```
No other application file changed. The router, child selector, Journal, database and stored records are untouched.

## 4. Evidence
| Step | Result |
|---|---|
| Two new tests (save, cancel) against the **original** handling | 2 of 2 **failed as intended**: Add event form open after the first child switch |
| The same tests with the correction | 2 of 2 passed |
| Type check; build with content validation | Passed |
| Unit suite | 475 of 475 |
| Targeted end-to-end (Calendar 33, Journal 34, Checkpoint 1 18, review regressions 22, final refinement 22, responsive 10, update 8) | 146 of 147; the one failure is R-028 (section 5), not this change |

What the new tests cover: shortcut → save or cancel → switches both ways → shortcut again for each child → Calendar tab → the Calendar's own Add event button → reload → Back and Forward → which child each event belongs to → each child's Upcoming list and Home's Upcoming Appointments.

All 31 earlier Calendar tests passed (overlays, vaccine references, editing, deletion, isolation, offline, themes, layout), as did the three Journal R-026 tests.

## 5. Unexpected finding: R-028 (Journal; **not corrected**)
- **Symptom:** if the Journal's entry form is open at the instant the entry list finishes loading, the form is rebuilt: typed text is cleared, the type returns to Personal Reflection, focus jumps to the first control. No message.
- **How it surfaced:** the unchanged Journal test “keyboard and focus” failed once in the targeted run.
- **It is not caused by the Calendar change:** the same test failed 2 of 16 times on the unmodified `c236a05`.
- **Reproduced deliberately:** with the list's load slowed to 1.5 seconds, text typed into the form was cleared when loading finished, via the Home shortcut and via the Journal tab. The Calendar's form, tested the same way, kept its text.
- **Practical exposure:** normally the interval is a few hundredths of a second. It is longer on a slow device or with many entries, and Home's “Journal entry” shortcut always opens the form inside it. An iPhone with a well-used journal is the realistic case.
- **Cause:** the loading line, empty state and feed are swapped at the same level as the form, which makes the interface library rebuild the form.
- **Proposed correction:** wrap those three alternatives in one fixed container (a few lines in `Journal.tsx`), plus a deterministic regression test that slows the load. Tried in a throwaway experiment (24 of 24 passes on the previously intermittent test), then reverted. **Not in this commit.**
- **Why I stopped:** this step's instructions were not to alter the Journal and to stop before widening scope.
- **Until decided:** the intermittent test is left exactly as it is.

## 6. Not changed, not done
The Journal (byte-for-byte as at `c236a05`), R-024 to R-026, database version 3, stored records. No complete regression cycle (targeted testing was authorized). No push, merge, deployment or Checkpoint 6 work.

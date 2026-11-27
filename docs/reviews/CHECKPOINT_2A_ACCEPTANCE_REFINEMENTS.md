# Checkpoint 2a — Human Acceptance Refinements (R-004 to R-008)

*2026-11-27. Owner-discovered usability findings from hands-on review of the Growth UX refinement (`170cc99`), which had passed all 387 automated tests three consecutive times.*

## 1. Gender-neutral display wording (R-004)

### Approach
- **Source catalog unchanged.** `src/content/milestones.cdc-2022.json` still holds CDC's exact wording, including pronouns. Its 159 locked ids and content hashes (`milestone-ids.lock.json`) are unchanged, and the build still fails if any catalog text changes.
- **Separate display layer.** `src/content/milestones.display.json` holds the parent-facing wording for the 41 milestones where CDC uses “he”, “she”, “his”, “her”, “him”, “himself” or “herself”. CDC alternates these between milestones; the app uses “they/them/their/themselves” instead, or, in two items, an article where the sentence reads naturally without a pronoun.
- **Each adaptation records:**
  - the id;
  - CDC's exact source wording;
  - an ordered list of whole-word replacements;
  - the display text.
- **Mechanical proof (build time and unit tests, `validateDisplay`).** Applying exactly the declared replacements to CDC's text must give the display text, character for character. Every replacement must be either:
  - a gendered pronoun → a neutral word; or
  - the verb agreement singular “they” requires (sees → see, wants → want, doesn’t → don’t, is → are, likes → like, gives → give, knows → know).

  The validator also rejects:
  - stale source wording (if CDC's text changed);
  - unknown or duplicate ids;
  - gendered words left in the result;
  - any gendered catalog item without an adaptation.

  Numbers, qualifiers (“at least”, “with adult supervision”, “within 10 minutes”), examples and quoted speech are therefore identical to CDC's.
- **Reference ages, CDC categories, app areas, sources and ids** come only from the catalog; the display layer holds wording only.
- **Not presented as a quotation.** Each adapted milestone's page says “Wording adapted to be gender-neutral” and, when expanded, shows *CDC's original wording* in quotation marks. Attribution text no longer says the wording is “shown without changes” or “word for word”.
- **Search** in the Library matches the wording shown.
- **Guide text** (overviews, explanations) was already gender-neutral; `validateGuide` now rejects gendered words.
- **Onboarding:** no gender question was added.

### All 41 adaptations
| Id | Age | CDC's wording (catalog, unchanged) | Shown in the app | Replacements |
|---|---|---|---|---|
| `cdc22-m02-se-03` | By 2 months | Seems happy to see you when you walk up to her | Seems happy to see you when you walk up to them | her → them |
| `cdc22-m02-se-04` | By 2 months | Smiles when you talk to or smile at her | Smiles when you talk to or smile at them | her → them |
| `cdc22-m04-se-01` | By 4 months | Smiles on his own to get your attention | Smiles on their own to get your attention | his → their |
| `cdc22-m04-se-02` | By 4 months | Chuckles (not yet a full laugh) when you try to make him laugh | Chuckles (not yet a full laugh) when you try to make them laugh | him → them |
| `cdc22-m04-lc-02` | By 4 months | Makes sounds back when you talk to him | Makes sounds back when you talk to them | him → them |
| `cdc22-m04-cg-01` | By 4 months | If hungry, opens mouth when he sees breast or bottle | If hungry, opens mouth when they see breast or bottle | he → they; sees → see |
| `cdc22-m04-cg-02` | By 4 months | Looks at her hands with interest | Looks at their hands with interest | her → their |
| `cdc22-m04-mp-01` | By 4 months | Holds head steady without support when you are holding him | Holds head steady without support when you are holding them | him → them |
| `cdc22-m04-mp-02` | By 4 months | Holds a toy when you put it in his hand | Holds a toy when you put it in their hand | his → their |
| `cdc22-m04-mp-03` | By 4 months | Uses his arm to swing at toys | Uses their arm to swing at toys | his → their |
| `cdc22-m06-cg-01` | By 6 months | Puts things in her mouth to explore them | Puts things in their mouth to explore them | her → their |
| `cdc22-m06-cg-02` | By 6 months | Reaches to grab a toy she wants | Reaches to grab a toy they want | she → they; wants → want |
| `cdc22-m06-cg-03` | By 6 months | Closes lips to show she doesn’t want more food | Closes lips to show they don’t want more food | she → they; doesn’t → don’t |
| `cdc22-m06-mp-03` | By 6 months | Leans on hands to support herself when sitting | Leans on hands to support themselves when sitting | herself → themselves |
| `cdc22-m09-se-03` | By 9 months | Looks when you call her name | Looks when you call their name | her → their |
| `cdc22-m09-cg-01` | By 9 months | Looks for objects when dropped out of sight (like his spoon or toy) | Looks for objects when dropped out of sight (like a spoon or toy) | his → a |
| `cdc22-m09-mp-01` | By 9 months | Gets to a sitting position by herself | Gets to a sitting position by themselves | herself → themselves |
| `cdc22-m09-mp-02` | By 9 months | Moves things from one hand to her other hand | Moves things from one hand to the other hand | her → the |
| `cdc22-m09-mp-03` | By 9 months | Uses fingers to “rake” food towards himself | Uses fingers to “rake” food towards themselves | himself → themselves |
| `cdc22-m12-cg-02` | By 1 year | Looks for things he sees you hide, like a toy under a blanket | Looks for things they see you hide, like a toy under a blanket | he → they; sees → see |
| `cdc22-m15-se-02` | By 15 months | Shows you an object she likes | Shows you an object they like | she → they; likes → like |
| `cdc22-m15-lc-03` | By 15 months | Follows directions given with both a gesture and words. For example, he gives you a toy when you hold out your hand and say, “Give me the toy.” | Follows directions given with both a gesture and words. For example, they give you a toy when you hold out your hand and say, “Give me the toy.” | he → they; gives → give |
| `cdc22-m15-mp-01` | By 15 months | Takes a few steps on his own | Takes a few steps on their own | his → their |
| `cdc22-m15-mp-02` | By 15 months | Uses fingers to feed herself some food | Uses fingers to feed themselves some food | herself → themselves |
| `cdc22-m18-se-05` | By 18 months | Helps you dress him by pushing arm through sleeve or lifting up foot | Helps you dress them by pushing arm through sleeve or lifting up foot | him → them |
| `cdc22-m18-mp-04` | By 18 months | Feeds himself with his fingers | Feeds themselves with their fingers | himself → themselves; his → their |
| `cdc22-m24-lc-03` | By 2 years | Points to at least two body parts when you ask him to show you | Points to at least two body parts when you ask them to show you | him → them |
| `cdc22-m30-se-02` | By 30 months | Shows you what she can do by saying, “Look at me!” | Shows you what they can do by saying, “Look at me!” | she → they |
| `cdc22-m30-cg-04` | By 30 months | Shows he knows at least one color, like pointing to a red crayon when you ask, “Which one is red?” | Shows they know at least one color, like pointing to a red crayon when you ask, “Which one is red?” | he → they; knows → know |
| `cdc22-m30-mp-02` | By 30 months | Takes some clothes off by himself, like loose pants or an open jacket | Takes some clothes off by themselves, like loose pants or an open jacket | himself → themselves |
| `cdc22-m30-mp-04` | By 30 months | Turns book pages, one at a time, when you read to her | Turns book pages, one at a time, when you read to them | her → them |
| `cdc22-m36-se-01` | By 3 years | Calms down within 10 minutes after you leave her, like at a childcare drop off | Calms down within 10 minutes after you leave them, like at a childcare drop off | her → them |
| `cdc22-m36-cg-01` | By 3 years | Draws a circle, when you show him how | Draws a circle, when you show them how | him → them |
| `cdc22-m36-cg-02` | By 3 years | Avoids touching hot objects, like a stove, when you warn her | Avoids touching hot objects, like a stove, when you warn them | her → them |
| `cdc22-m36-mp-02` | By 3 years | Puts on some clothes by himself, like loose pants or a jacket | Puts on some clothes by themselves, like loose pants or a jacket | himself → themselves |
| `cdc22-m48-se-06` | By 4 years | Changes behavior based on where she is (place of worship, library, playground) | Changes behavior based on where they are (place of worship, library, playground) | she → they; is → are |
| `cdc22-m48-lc-03` | By 4 years | Talks about at least one thing that happened during her day, like “I played soccer.” | Talks about at least one thing that happened during their day, like “I played soccer.” | her → their |
| `cdc22-m48-mp-02` | By 4 years | Serves herself food or pours water, with adult supervision | Serves themselves food or pours water, with adult supervision | herself → themselves |
| `cdc22-m60-lc-01` | By 5 years | Tells a story she heard or made up with at least two events. For example, a cat was stuck in a tree and a firefighter saved it | Tells a story they heard or made up with at least two events. For example, a cat was stuck in a tree and a firefighter saved it | she → they |
| `cdc22-m60-lc-02` | By 5 years | Answers simple questions about a book or story after you read or tell it to him | Answers simple questions about a book or story after you read or tell it to them | him → them |
| `cdc22-m60-cg-05` | By 5 years | Writes some letters in her name | Writes some letters in their name | her → their |

### Meaning review
Each line was read for meaning (Claude Code, 2026-11-27):
- **Pronoun changes:** the pronoun refers to the child in every case, so “they/them/their” keeps the referent.
- **Verb agreement:** changes only the grammatical number.
- **Two pronoun-free items:**
  - `cdc22-m09-mp-02`: “to the other hand” for “to her other hand”. It is the same hand.
  - `cdc22-m09-cg-01`: “(like a spoon or toy)” for “(like his spoon or toy)”. The example is unchanged in kind.
- **Considered and rejected:** “Feeds self with fingers” (CDC's own style in “look at self in a mirror”). Not chosen, because “themselves … their” is clearer to parents.

**For the owner to review:** the source register records CDC's reuse conditions, including “no substantive changes”. The adaptation changes only grammatical gender. It is disclosed on every affected page, and CDC's original wording is available. We consider it non-substantive, but it is a modification of CDC wording; whether it is acceptable under CDC's conditions is an owner decision (section 6).

## 2. Personal milestone creation removed (R-005)
- **Removed:** “Make a personal version” (milestone page), its creation sheet, and the Library's “Your versions” filter. Personal records are no longer listed among the milestones.
- **Preserved:** existing personal records (`customItems`, kind `milestone`, with their milestone records and history) are never deleted, converted or merged.
- **Still reachable:**
  - They appear in a collapsed **“Your personal entries (N)”** section at the end of the Library, shown only when some exist.
  - Each opens its page as before. The page keeps status, Notes & Observations, history, editing the title and description, and hide/restore. It is labelled “Personal entry” and “isn't counted in Progress”.
- **Progress:** the denominator is unchanged; personal records were never counted.
- **Checkpoint 2b options (owner to decide):**
  - leave them as they are;
  - offer to turn each into a goal in Goals & Exercises (an explicit, per-item parent action with the original kept); or
  - offer a permanent delete with the usual two-step confirmation.

  No automatic migration is planned.

## 3. Less CDC terminology (R-006)
- **Principle:** parent-first interface, evidence-backed infrastructure (Design System).
- **Examples:**
  - “All 159 CDC milestones” → “All milestones”, keeping the counts. The view button is “All (159)”.
  - “By CDC age” → “By age”; “Reference age” filter → “Age”.
  - “CDC area: …” → the app area.
  - “Most recent CDC age” → “Most recent milestone age”.
  - Guide overviews: “By 18 months, CDC lists things like” → “By 18 months, milestones include things like”.
- **Attribution is consolidated:**
  - One short source note on Progress and the Library: based on CDC's checklists, in gender-neutral wording, not endorsed by CDC, HHS, or the U.S. Government, with a link to Sources.
  - One line on each milestone page linking to its CDC checklist, with non-endorsement.
  - The guide's Sources card and safeguard.
  - The full attribution card and source list on About these milestones.
- **Kept:** the 75% basis, “not standards / not screening or diagnostic tools”, the healthcare-provider guidance, the gross/fine-motor clarification, external links, and the meaningful distinction between established milestones and personal entries.

## 4. Notes & Observations (R-007)
### Interface
- One section on each milestone page: “Date observed” (defaults to today, and returns to today after each entry), “Note or observation”, and **Add entry**.
- **Previous entries** are listed below, newest first, each with **Edit** and **Remove**.
- **Status and achievement-date controls are separate** (Update status).

### Storage (existing stores; database version still 2; no migration)
| Item | How it's stored | How it's shown |
|---|---|---|
| New entry | `observation` event (existing type) with its observation date | Dated entry |
| Edit of an entry | new `observation-edited` event (`refEventId` = original, new text and date, `fromDate`) — append-only; the original is untouched | Latest text and date, marked “edited”; history shows each version |
| Remove | existing `observation-removed` marker | Hidden from the list; text kept in history, struck through |
| Earlier observations | unchanged | Dated entries |
| Earlier **note** (the old standalone Note box) | unchanged `record.note` + `note` events | Shown first as **“No observation date · saved [date]”**. No observation date is invented. Edit and Remove use the existing note functions (no date added) |

### Permanent erase
- Erasing any version of an entry erases the original and every edit of it.
- Erasing a note version also erases other saved versions with identical text.
- An erase marker remains.
- Profile deletion and app reset still remove everything.

### Compatibility
- Older app versions ignore the new event type for progress (`stateAsRecordedAt` handles only status and visibility events).
- For backup, sharing and reports, entries keep stable ids, dates, device provenance and append-only history, so they can be merged and reported later.

## 5. Age settings explanation (R-008)
- **Where:** below the age panel at the end of Progress.
- **Wording when corrected age is set up:** “You can change whether milestones are based on chronological or corrected age in [child]'s profile settings.”
- **Wording otherwise:** “Milestones are based on chronological age. If [child] was born early, you can turn on corrected age in [child]'s profile settings.”
- **Manage age settings** opens the selected child's profile at `#/profiles/<id>/age`. That page:
  - scrolls to the Corrected age section and focuses its heading;
  - returns to Progress on Back, Cancel or Save.
- **Unchanged:** the form, calculations, eligibility and preferences.

## 6. Open items for the owner
1. Accept or adjust the gender-neutral approach under CDC's “no substantive changes” condition (section 1).
2. How to treat legacy personal entries in Checkpoint 2b (section 2).
3. Hands-on acceptance (TESTING_CHECKLIST, “Human acceptance refinements” section).

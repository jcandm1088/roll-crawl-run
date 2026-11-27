# Checkpoint 2a — What to Expect Educational Content: Final Text, Sources and Meaning Review

**Status:** implemented in the Growth UX refinement (`src/content/guide.cdc-2022.json`). Approach: **Option A** only (owner decision D-9): original explanatory text written for this app, derived from the 159 verified CDC milestones and registered CDC sources. Option B (verbatim CDC excerpts from other pages) is deferred (D-10). AAP, HealthyChildren and Pathways.org were not used.

**Approval history:** proposed in the Phase A review document (2026-11-26); approved by the owner with corrections:
- Q-1 keep “children”;
- Q-2 area explanations once per range;
- Q-3 keep the `Movement/Physical` identifier and verify CDC's display heading;
- Q-4 lengths approved;
- Q-5 align two unsourced app sentences;
- Q-6 restore three qualifiers;
- Q-7 compact neighbour cards on empty ranges;
- Q-8 All 159 ordering.

Revised wording for SH-2, SH-5 and the pre-due-date text was supplied by the owner.

**Label key:**
- *original*: written for this app, never presented as CDC's words;
- *CDC verbatim*: milestone descriptions shown unchanged from `milestones.cdc-2022.json`;
- *app*: describes how the app works.

## 1. Traceability is not accuracy
`validateGuide()` runs at build time and in unit tests. It checks that:
- every overview's basis milestones exist and belong to that range's CDC ages;
- every app area present at those ages is represented;
- no milestone is cited twice;
- phrases quoted inside original text are exact CDC wording from a cited milestone;
- all 11 populated and all 9 empty ranges are covered, with the correct neighbouring CDC ages;
- source identifiers are registered;
- no grading, diagnostic or development-process wording appears.

**These checks prove traceability, not semantic accuracy.** A valid ID does not show that a sentence says what the milestone says. Accuracy rests on the sentence-by-sentence meaning review in section 4, which was done by reading each statement against its cited milestones.

## 2. CDC movement heading (narrow verification, 2026-11-26)
Authorized by the owner (Q-3) for display purposes only. The section headings of four already-registered CDC milestone pages (2 months, 1 year, 3 years, 5 years) were read in a headless browser; no other page content was collected. Each page uses the same four headings: “Social/Emotional Milestones”, “Language/Communication Milestones”, “Cognitive Milestones (learning, thinking, problem-solving)” and “**Movement/Physical Development Milestones**”. The guide therefore displays “Movement/Physical Development”. The stored category identifier `Movement/Physical` and all milestone records are unchanged.

## 3. Final text

### Shared explanations

| ID | Placement | Label | Text |
|---|---|---|---|
| SH-1 | “About this guide”, top of every range (guide body) | original | Each CDC age, like “by 6 months,” lists things most children (75% or more) do by that age. Because these are things most children do, not all, an age in this guide isn’t a deadline. If you’re concerned about your child’s development, talk with your child’s healthcare provider. This guide is for learning about CDC’s milestones. It isn’t a screening or a diagnosis, and reading it doesn’t change anything you’ve recorded. |
| SH-2 | Under the range heading | original (template) | This range includes CDC's “by [age]” milestones. (3–6 months: “by 4 months” and “by 6 months”) |
| SH-3 | “How the age ranges work” (collapsed) | original/app | The app groups CDC’s milestones into three-month ranges to make browsing easier. The ranges are the app’s, not CDC’s. A milestone CDC lists “by 6 months” appears in 3–6 months, and its CDC age stays “by 6 months.” Some ranges have no CDC milestones, and the app doesn’t add any to fill them. |
| SH-4 | “About gross and fine motor”, populated ranges | original | CDC lists movement milestones together in one area, Movement/Physical Development. This app divides them into gross motor and fine motor to make them easier to follow. CDC doesn’t publish separate gross motor and fine motor checklists, and every milestone keeps its CDC area. |
| SH-5 | Area with no milestones at a CDC age | original (template) | No milestones from CDC's “by [age]” checklist are assigned to this category in our app. |
| SH-6 | Under every overview | label | Written for this app from CDC’s milestones. |
| SPC-7 | “Looking ahead”, last range | original | “By 5 years” is the last age in CDC’s checklists. |

### Area explanations (shown with the first CDC age in each range)

| Area | Text | Basis |
|---|---|---|
| gross-motor | Larger movements, like holding the head up, rolling, sitting, and walking. | m02-mp-01, m06-mp-01, m09-mp-04, m18-mp-01 |
| fine-motor | Using hands and fingers, like holding, picking up, and feeding. | m04-mp-02, m12-mp-04, m15-mp-02 |
| cognitive | How your child explores, plays, and figures things out. | m06-cg-01, m18-cg-02, m30-cg-02, m09-cg-01 |
| language-communication | Sounds, gestures, words, and understanding what others say. | m02-lc-01, m09-lc-02, m12-lc-01, m15-lc-01, m12-lc-03, m18-lc-02 |
| social-emotional | How your child responds to and connects with people, and shows feelings. | m02-se-01, m02-se-04, m09-se-02, m15-se-05, m24-se-01, m48-se-03 |

### Overviews (11)

| ID | Range | CDC ages | Text | Basis |
|---|---|---|---|---|
| OV-0 | 0–3 months | 2 | “By 2 months” is the first age in CDC’s checklists. CDC lists things like calming down when spoken to or picked up, looking at your face, making sounds other than crying, watching you as you move, holding their head up when on their tummy, and opening their hands briefly. | m02-se-01, m02-se-02, m02-lc-01, m02-cg-01, m02-mp-01, m02-mp-03 |
| OV-1 | 3–6 months | 4, 6 | By 4 months, CDC lists things like smiling on their own to get your attention, cooing (“oooo”, “aahh”), turning their head toward the sound of your voice, holding their head steady without support while you hold them, and holding a toy when you put it in their hand. By 6 months, CDC lists things like laughing, taking turns making sounds with you, reaching to grab a toy they want, and rolling from tummy to back. | m04-se-01, m04-lc-01, m04-lc-03, m04-mp-01, m04-mp-02, m06-se-03, m06-lc-01, m06-cg-02, m06-mp-01 |
| OV-2 | 6–9 months | 9 | By 9 months, CDC lists things like being shy, clingy, or fearful around strangers, looking when you call their name, smiling or laughing at peek-a-boo, making a lot of different sounds like “mamamama” and “bababababa”, lifting their arms up to be picked up, looking for things dropped out of sight, moving things from one hand to the other, and sitting without support. | m09-se-01, m09-se-03, m09-se-05, m09-lc-01, m09-lc-02, m09-cg-01, m09-mp-02, m09-mp-04 |
| OV-3 | 9–12 months | 12 | By 1 year, CDC lists things like playing games with you, like pat-a-cake, waving “bye-bye”, calling a parent “mama” or “dada” or another special name, looking for things they see you hide, pulling up to stand, and picking things up between thumb and pointer finger. | m12-se-01, m12-lc-01, m12-lc-02, m12-cg-02, m12-mp-01, m12-mp-04 |
| OV-4 | 12–15 months | 15 | By 15 months, CDC lists things like copying other children while playing, showing you affection, trying to say one or two words besides “mama” or “dada”, pointing to ask for something or to get help, stacking at least two small objects, using their fingers to feed themselves some food, and taking a few steps on their own. | m15-se-01, m15-se-05, m15-lc-01, m15-lc-04, m15-cg-02, m15-mp-02, m15-mp-01 |
| OV-5 | 15–18 months | 18 | By 18 months, CDC lists things like moving away from you but looking to make sure you are close by, trying to say three or more words besides “mama” or “dada”, following one-step directions without any gestures, copying you doing chores, walking without holding on to anyone or anything, and scribbling. | m18-se-01, m18-lc-01, m18-lc-02, m18-cg-01, m18-mp-01, m18-mp-02 |
| OV-6 | 21–24 months | 24 | By 2 years, CDC lists things like noticing when others are hurt or upset, saying at least two words together, like “More milk.”, pointing to things in a book when you ask, trying to use switches, knobs, or buttons on a toy, kicking a ball, running, and eating with a spoon. | m24-se-01, m24-lc-02, m24-lc-01, m24-cg-02, m24-mp-01, m24-mp-02, m24-mp-04 |
| OV-7 | 27–30 months | 30 | By 30 months, CDC lists things like playing next to other children and sometimes playing with them, saying about 50 words, saying words like “I,” “me,” or “we”, using things to pretend, following two-step instructions, jumping off the ground with both feet, and turning book pages one at a time when you read to them. | m30-se-01, m30-lc-01, m30-lc-04, m30-cg-01, m30-cg-03, m30-mp-03, m30-mp-04 |
| OV-8 | 33–36 months | 36 | By 3 years, CDC lists things like noticing other children and joining them to play, talking with you in conversation using at least two back-and-forth exchanges, asking “who,” “what,” “where,” or “why” questions, drawing a circle when you show them how, and using a fork. | m36-se-02, m36-lc-01, m36-lc-02, m36-cg-01, m36-mp-03 |
| OV-9 | 45–48 months | 48 | By 4 years, CDC lists things like pretending to be something else during play, comforting others who are hurt or sad, saying sentences with four or more words, talking about at least one thing that happened during their day, naming a few colors of items, drawing a person with three or more body parts, catching a large ball most of the time, and holding a crayon or pencil between fingers and thumb, rather than in a fist. | m48-se-01, m48-se-03, m48-lc-01, m48-lc-03, m48-cg-01, m48-cg-03, m48-mp-01, m48-mp-04 |
| OV-10 | 57–60 months | 60 | By 5 years, CDC lists things like following rules or taking turns when playing games with other children, telling a story they heard or made up that includes at least two events, keeping a conversation going with more than three back-and-forth exchanges, counting to 10, writing some letters in their name, buttoning some buttons, and hopping on one foot. | m60-se-01, m60-lc-01, m60-lc-03, m60-cg-01, m60-cg-05, m60-mp-01, m60-mp-02 |

### Empty ranges (9) — compact neighbour cards

Text (original): *CDC doesn't publish a milestone checklist for this range. Its checklists go from [previous] to [next], so the app doesn't add any milestones here. For a child in this range, CDC's most recent milestones are the ones listed “by [previous].”* Then two compact cards: **Most recent CDC age: by [previous]** · Shown in [range] · Open, and **Next CDC age: by [next]** · Shown in [range] · Open.

| Range index | Previous CDC age | Next CDC age |
|---|---|---|
| 6 | 18 months | 24 months |
| 8 | 24 months | 30 months |
| 10 | 30 months | 36 months |
| 12 | 36 months | 48 months |
| 13 | 36 months | 48 months |
| 14 | 36 months | 48 months |
| 16 | 48 months | 60 months |
| 17 | 48 months | 60 months |
| 18 | 48 months | 60 months |

### Special situations, attribution and safeguards (app text, in `Growth.tsx`)
- **Corrected age (after the due date):** “Age used for milestones: N months (corrected)”, then: “Chronological age: [precise]. Corrected age is counted from [child]'s due date instead of birth date. You chose to use it for milestones in [child]'s profile.”
- **Before the due date (owner wording):** “Age used for milestones: Before due date”, then: “[Child]'s due date hasn't arrived yet. No CDC milestones are counted as applicable using corrected age at this time. You can still explore the developmental guide.”
- **Older than five:** “CDC's milestone checklists end at age 5, so there are no milestones after “by 5 years.” The guide opens at 57–60 months, the last range.”
- **Preview banner:** “You're looking at [range]. Viewing the guide doesn't change [child]'s records.” [Back to current age]
- **Sources (populated ranges):** CDC credit with the page titles linked; “shown word for word”; “The overviews and explanations are written for this app from those milestones”; free at cdc.gov; not endorsed by CDC, HHS, or the U.S. Government.
- **Sources (empty ranges):** the short form of the same credit and non-endorsement.
- **A note for parents:** “CDC explains that its milestone checklists aren't developmental standards and aren't screening or diagnostic tools…”, plus the provider guidance and the neutral link to CDC's “Concerned About Your Child's Development?”.

**Q-5 alignment (existing app text):**
- “Children develop at different rates” was replaced in the Progress and Home safeguard and in About these milestones with the 75%-basis wording.
- “explains next steps” became “has more information”.

## 4. Sentence-by-sentence meaning review
*(From the approved Phase A review, updated for the owner's corrections.)*


### 4.1 Shared explanations

| ID | Statement | Basis | Meaning check |
|---|---|---|---|
| SH-1 s1 | Each CDC age … lists things most children (75% or more) do by that age. | S2 (registered: “75% basis”); S1 page sections “What most babies/children do by …” (2a verification §2) | ✓ CDC's stated basis is milestones “most children (75% or more) are expected to reach”. “do by that age” mirrors the page sections. |
| SH-1 s2 | Because these are things most children do, not all, an age isn't a deadline. | Inference from S2's 75% basis | ✓ Logical consequence only, with no added developmental claim. *Deliberately replaces the existing app sentence “Children develop at different rates”, which has no registered source* (Phase A question Q-5, now aligned). |
| SH-1 s3 | It isn't a screening or a diagnosis. | S2 (registered: “not screening or diagnostic tools”) | ✓ |
| SH-1 s4 | Reading it doesn't change anything you've recorded. | App design (approved D-2, plan §7) | APP FACT; becomes true once Phase B is implemented and tested (E1–E3). |
| SH-2/2b | This range includes CDC's “by [age]” milestones. (owner-revised wording) | D2 mapping; S1 reference ages | ✓ The mapping is the existing, tested interval rule. |
| SH-3 | Ranges are the app's; “by 6 months” appears in 3–6 months; no milestones added to empty ranges. | D2; Decision #49 (validation); existing About text | ✓ APP FACT. |
| SH-4 | CDC lists movement milestones together in Movement/Physical; the app divides them; CDC doesn't publish separate gross and fine checklists; each keeps its CDC area. | S1 (`cdcCategory` = “Movement/Physical” on all 44); D1; Decision #50; 2a verification §5 | ✓ “Doesn't publish separate checklists” is true of the twelve verified pages (one “Movement/Physical Development Milestones” section each — heading verified 2026-11-26, see §2). The claim is limited to CDC's milestone checklists. |
| SH-5 | No milestones from CDC's “by 6 months” checklist are assigned to this category in our app. (owner-revised wording) | S1 data: Fine motor at 6 months = 0; Gross motor at 3 years = 0 (inventory counts) | ✓ It says “in this group” (the app's group), not “CDC has no fine-motor milestones” as a CDC fact. *Note: at 6 months, CDC's “Reaches to grab a toy she wants” is in Cognitive, so “no hand milestones at 6 months” would be wrong; the wording avoids that.* |
| SH-6 | Written for this app from CDC's milestones. | — | Label. |

### 4.2 Area explanations

| ID | Statement | Supporting milestones (examples) | Meaning check |
|---|---|---|---|
| CAT-SE | Responds to and connects with people, and shows feelings | m02-se-01 Calms down when spoken to or picked up; m02-se-04 Smiles when you talk to or smile at her; m09-se-02 Shows several facial expressions…; m15-se-05 Shows you affection…; m24-se-01 Notices when others are hurt or upset…; m48-se-03 Comforts others… | ✓ “Responds to” (se-01, se-04), “connects with people” (se-05 at 15 months, m36-se-02 joins other children), “shows feelings” (m09-se-02). Describes the area, not what a child will do. |
| CAT-LC | Sounds, gestures, words, and understanding what others say | m02-lc-01 Makes sounds other than crying; m09-lc-02 Lifts arms up to be picked up; m12-lc-01 Waves “bye-bye”; m15-lc-01 Tries to say one or two words…; m12-lc-03 Understands “no”…; m18-lc-02 Follows one-step directions… | ✓ All four elements are directly represented. |
| CAT-CG | Explores, plays, and figures things out | m06-cg-01 Puts things in her mouth to explore them; m18-cg-02 Plays with toys in a simple way…; m30-cg-02 Shows simple problem-solving skills…; m09-cg-01 Looks for objects when dropped out of sight… | ✓ “figures things out” paraphrases “problem-solving” (m30-cg-02). I avoided “remembers” and “thinks” as interpretive. |
| CAT-GM | Larger movements, like holding the head up, rolling, sitting, and walking | m02-mp-01 Holds head up when on tummy; m06-mp-01 Rolls from tummy to back; m09-mp-04 Sits without support; m18-mp-01 Walks without holding on… | ✓ Each example is a gross-motor milestone. “Larger movements” matches the approved grouping definition (2a verification §5). |
| CAT-FM | Using hands and fingers, like holding, picking up, and feeding | m04-mp-02 Holds a toy when you put it in his hand; m12-mp-04 Picks things up between thumb and pointer finger…; m15-mp-02 Uses fingers to feed herself some food | ✓ Each example is a fine-motor milestone. “Drawing” was left out because “Draws a circle” (m36-cg-01) is CDC Cognitive, which could confuse. |

### 4.3 Overviews: phrase-by-phrase

| ID | Phrase in overview | Milestone | Meaning check |
|---|---|---|---|
| OV-0 | “By 2 months” is the first age in CDC's checklists | S1: reference ages 2…60 (12 pages); S3 index | ✓ |
| | calming down when spoken to or picked up | m02-se-01 | ✓ near-verbatim |
| | looking at your face | m02-se-02 | ✓ |
| | making sounds other than crying | m02-lc-01 | ✓ |
| | watching you as you move | m02-cg-01 | ✓ |
| | holding their head up when on their tummy | m02-mp-01 | ✓ |
| | opening their hands briefly | m02-mp-03 | ✓ |
| OV-1 | smiling on their own to get your attention | m04-se-01 | ✓ |
| | cooing (“oooo”, “aahh”) | m04-lc-01 | ✓ The quoted sounds are verbatim. |
| | turning their head toward the sound of your voice | m04-lc-03 | ✓ “towards” → “toward” in original text only; the CDC bullet stays verbatim. |
| | holding their head steady without support while you hold them | m04-mp-01 | ✓ Kept “without support”, which changes the meaning if dropped. |
| | holding a toy when you put it in their hand | m04-mp-02 | ✓ |
| | laughing | m06-se-03 | ✓ |
| | taking turns making sounds with you | m06-lc-01 | ✓ |
| | reaching to grab a toy they want | m06-cg-02 | ✓ |
| | rolling from tummy to back | m06-mp-01 | ✓ Direction kept (not “rolling over”). |
| OV-2 | being shy, clingy, or fearful around strangers | m09-se-01 | ✓ Included because it is on CDC's list; stated neutrally. |
| | looking when you call their name | m09-se-03 | ✓ |
| | smiling or laughing at peek-a-boo | m09-se-05 | ✓ |
| | making a lot of different sounds like “mamamama” and “bababababa” | m09-lc-01 | ✓ Verbatim fragment, following CDC's web wording (not the PDF's “babababa”). |
| | lifting their arms up to be picked up | m09-lc-02 | ✓ |
| | looking for things dropped out of sight | m09-cg-01 | ✓ |
| | moving things from one hand to the other | m09-mp-02 | ✓ |
| | sitting without support | m09-mp-04 | ✓ |
| OV-3 | playing games with you, like pat-a-cake | m12-se-01 | ✓ |
| | waving “bye-bye” | m12-lc-01 | ✓ |
| | calling a parent “mama” or “dada” or another special name | m12-lc-02 | ✓ Kept “or another special name”. |
| | looking for things they see you hide | m12-cg-02 | ✓ |
| | pulling up to stand | m12-mp-01 | ✓ |
| | picking things up between thumb and pointer finger | m12-mp-04 | ✓ |
| OV-4 | copying other children while playing | m15-se-01 | ✓ |
| | showing you affection | m15-se-05 | ✓ |
| | trying to say one or two words besides “mama” or “dada” | m15-lc-01 | ✓ Kept “tries to”. |
| | pointing to ask for something or to get help | m15-lc-04 | ✓ |
| | stacking at least two small objects | m15-cg-02 | ✓ |
| | using their fingers to feed themselves some food | m15-mp-02 | ✓ |
| | taking a few steps on their own | m15-mp-01 | ✓ |
| OV-5 | moving away from you but looking to make sure you are close by | m18-se-01 | ✓ |
| | trying to say three or more words besides “mama” or “dada” | m18-lc-01 | ✓ |
| | following one-step directions without any gestures | m18-lc-02 | ✓ |
| | copying you doing chores | m18-cg-01 | ✓ |
| | walking without holding on to anyone or anything | m18-mp-01 | ✓ |
| | scribbling | m18-mp-02 | ✓ |
| OV-6 | noticing when others are hurt or upset | m24-se-01 | ✓ |
| | saying at least two words together, like “More milk.” | m24-lc-02 | ✓ Verbatim example. |
| | pointing to things in a book when you ask | m24-lc-01 | ✓ |
| | trying to use switches, knobs, or buttons on a toy | m24-cg-02 | ✓ |
| | kicking a ball · running · eating with a spoon | m24-mp-01 · m24-mp-02 · m24-mp-04 | ✓ |
| OV-7 | playing next to other children and sometimes playing with them | m30-se-01 | ✓ Kept “sometimes”. |
| | saying about 50 words | m30-lc-01 | ✓ Kept “about”. |
| | saying words like “I,” “me,” or “we” | m30-lc-04 | ✓ |
| | using things to pretend | m30-cg-01 | ✓ |
| | following two-step instructions | m30-cg-03 | ✓ CDC area is Cognitive (no area is claimed in the text). |
| | jumping off the ground with both feet | m30-mp-03 | ✓ |
| | turning book pages one at a time when you read to them | m30-mp-04 | ✓ Qualifier restored (owner correction Q-6). |
| OV-8 | noticing other children and joining them to play | m36-se-02 | ✓ |
| | talking with you in conversation using at least two back-and-forth exchanges | m36-lc-01 | ✓ |
| | asking “who,” “what,” “where,” or “why” questions | m36-lc-02 | ✓ |
| | drawing a circle when you show them how | m36-cg-01 | ✓ Kept “when you show him how”, which matters to the meaning. |
| | using a fork | m36-mp-03 | ✓ |
| OV-9 | pretending to be something else during play | m48-se-01 | ✓ |
| | comforting others who are hurt or sad | m48-se-03 | ✓ |
| | saying sentences with four or more words | m48-lc-01 | ✓ |
| | talking about at least one thing that happened during their day | m48-lc-03 | ✓ |
| | naming a few colors of items | m48-cg-01 | ✓ |
| | drawing a person with three or more body parts | m48-cg-03 | ✓ |
| | holding a crayon or pencil between fingers and thumb, rather than in a fist | m48-mp-04 | ✓ Qualifier restored (owner correction Q-6). |
| | catching a large ball most of the time | m48-mp-01 | ✓ Kept “most of the time”. |
| OV-10 | following rules or taking turns when playing games with other children | m60-se-01 | ✓ |
| | telling a story they heard or made up that includes at least two events | m60-lc-01 | ✓ Qualifier restored (owner correction Q-6). |
| | keeping a conversation going with more than three back-and-forth exchanges | m60-lc-03 | ✓ |
| | counting to 10 | m60-cg-01 | ✓ |
| | writing some letters in their name | m60-cg-05 | ✓ |
| | buttoning some buttons · hopping on one foot | m60-mp-01 · m60-mp-02 | ✓ |
| | “By 5 years” is the last age in CDC's checklists | S1 (12 pages, the last is 5 years); S3 index | ✓ Says CDC's *checklists* end, not that development or milestones end. |

**Coverage:** every overview draws on each of the five app areas that has milestones at its CDC age(s). The only gaps are where CDC lists none in that group: Fine motor at 6 months (covered by the 4-month phrase in OV-1) and Gross motor at 3 years (OV-8). In total, 76 overview phrases cite 76 distinct milestones (checked by script against the verified content file): no milestone is cited twice, every cited milestone belongs to that overview's CDC age, and none is invented.

### 4.4 Empty ranges, special situations and attribution

| ID | Statement | Basis | Meaning check |
|---|---|---|---|
| EMP s1 | CDC doesn't publish a milestone checklist for this range | S1: the twelve reference ages map to 11 ranges; nine have none (data-verified) | ✓ Precisely: no CDC age falls in the range. It doesn't say CDC is silent on development at those ages. |
| EMP s2 | Its checklists go from [prev] to [next] | S1 reference-age list | ✓ The table in 2.4 is computed from the data (verified). |
| EMP s3 | the app doesn't add any milestones here | Decision #49, D2 | ✓ APP FACT |
| EMP s4 | For a child in this range, CDC's most recent milestones are the ones listed “by [prev]” | S1 + D2 applicability rule (reference age ≤ milestone age) | ✓ The most recent CDC age below the range. It doesn't say these milestones “apply” clinically; it says they are CDC's most recent. |
| SPC-1 | Corrected age is counted from the due date; you chose it; the app doesn't advise on use | Decisions #4–6, #52; existing About text (2a, approved) | ✓ It is the definition of the app's arithmetic only; no clinical guidance, consistent with the AAP exclusion. |
| SPC-2 | Age used for milestones: Before due date. [Child]'s due date hasn't arrived yet. No CDC milestones are counted as applicable using corrected age at this time. You can still explore the developmental guide. (owner wording) | Decision #5, #52, R9 | ✓ APP FACT; no clinical guidance |
| SPC-4 | CDC's checklists end at age 5; the guide opens at 57–60 | S1; R9 (“ages over 60 months → 57–60”) | ✓ |
| SPC-5/6/8/9 | Navigation and preview text | App design | APP FACT |
| ATT-1 | CDC credit; word for word; overviews written for this app; free at cdc.gov; not endorsed by CDC, HHS, or the U.S. Government | S4 conditions (credit, no substantive change, free availability, non-endorsement); existing 2a wording | ✓ All four S4 conditions are covered. “Written for this app” keeps our summaries from being taken for CDC text. |
| SAF-1 s1 | CDC explains its checklists aren't developmental standards and aren't screening or diagnostic tools | S2 (registered: “not standards; not screening or diagnostic tools”) | ✓ Attributed to CDC, as registered. |
| SAF-1 s2–3 | The guide doesn't assess or replace your provider; talk with your provider if concerned | App safeguard (existing 2a wording, approved) | ✓ ORIGINAL; not presented as CDC's words. |
| SAF-1 s4 | CDC's page “Concerned About Your Child's Development?” has more information | S3 (registered, linked) | ✓ Deliberately neutral. The existing app text says the page “explains next steps”, which describes page content not recorded in the register (Q-5). |

---


## 5. Compliance and wording checks

| Check | Result |
|---|---|
| CDC milestone wording and reference ages unchanged | ✓ Bullets come from the verified file, unchanged. No age other than CDC's twelve appears as a milestone age. Three-month ranges are always labelled as the app's. |
| Original text clearly distinguished from CDC text | ✓ SH-6 under every overview; ATT-1 states which is which. CDC phrases inside original text are in quotation marks. |
| No unsupported developmental claims | ✓ Every overview phrase restates one cited milestone (Part 3.3). No generalizations about stages, causes, or what children “learn”. |
| No causal explanations | ✓ None (no “because the brain…”, no “this helps…”). |
| No diagnostic or prescriptive language | ✓ No “should”, “normal”, “typical”, “on track”, “behind”, “delay”, “warning sign” or “red flag”. The only advice is “talk with your child's healthcare provider”, which is existing approved wording. |
| No new clinical recommendations | ✓ Corrected-age text defines only the arithmetic and defers to the provider. |
| No invented reference ages | ✓ Empty ranges assign no age; the neighbor cards name CDC's actual ages. |
| Gross and fine motor framed as the app's subdivision | ✓ SH-4 and the area names; the statement that CDC doesn't publish separate checklists is explicit. |
| CDC reuse conditions (S4) | ✓ Credit, non-endorsement, no substantive change to CDC text, free availability, links open in a new window, no CDC logo, photos or videos. |
| Excluded sources | ✓ No AAP, HealthyChildren or Pathways.org content or wording. |
| No new collection | ✓ Only registered sources and the verified content file were used. |
| Offline | ✓ All text is intended to be bundled; only the links need internet (SAF-2). |
| Parent-facing terminology | ✓ No checkpoint or development terms in any proposed text. |
| Readability | Overviews are about 40–60 words; area explanations are one line. Plain words, second person. |

---



## 6. Phase A self-correction (recorded)
In the first Phase A draft, five overviews (OV-0, OV-1, OV-2, OV-4, OV-9) omitted fine motor examples even though CDC lists fine-motor milestones at those ages, contrary to the stated coverage objective. Claude found this during its own review before delivering the draft and added one fine-motor example to each. The coverage rule is now enforced by `validateGuide()` (“no example from [area]”). This was an AI self-correction, not an owner finding.

---

## Revision 2026-11-27 (R-004, R-006) — owner usability findings
- **Overviews:** “By N months, CDC lists things like …” became “By N months, milestones include things like …”. The first overview now reads ““By 2 months” is the first milestone age. Milestones at this age include things like …”. Examples and qualifiers are unchanged.
- **Shared text:**
  - “Each CDC age” → “Each milestone age”.
  - “learning about CDC's milestones” → “learning about milestones”.
  - The ranges paragraph is simplified; it still says the ranges are the app's, not CDC's.
  - Motor paragraph: “…This is the app's own grouping, not a separate checklist.”
  - Overview label: “Written for this app from the milestones below.”
  - Last age: “By 5 years” is the last milestone age.
- **Meaning:** unchanged. Source attribution remains in the guide's Sources card and safeguard. The milestone lists beneath each overview use the gender-neutral display wording (`CHECKPOINT_2A_ACCEPTANCE_REFINEMENTS.md`).
- **Validation:** `validateGuide` still passes all traceability rules and now also rejects gendered words. Content version `guide-2026-11-27`.

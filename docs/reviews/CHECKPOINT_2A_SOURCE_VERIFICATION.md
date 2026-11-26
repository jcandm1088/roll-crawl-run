# Checkpoint 2a — Source Verification and Compliance Record

## 1. Access set-up
- **Environment:** the owner approved a dedicated personal environment, “roll-crawl-run”, with domain-specific access instead of widening the Default environment.
- **Initial allowed sites:** cdc.gov, www.cdc.gov, healthychildren.org, www.healthychildren.org, aap.org, www.aap.org, publications.aap.org, downloads.aap.org, pathways.org, www.pathways.org, and jcandm1088.github.io.
- **CDC:** its server (Akamai) refused plain command-line requests (HTTP 403 “Access Denied”) but served pages to a standard browser (headless Chromium). CDC pages were retrieved that way.
- **After the owner's decision** (section 4), the AAP and HealthyChildren sites were removed. Remaining sites: cdc.gov, www.cdc.gov, pathways.org, www.pathways.org, and jcandm1088.github.io. Pathways.org content must not be collected or analyzed until its terms are reviewed and approved.

## 2. CDC milestone sources (retrieved Nov 26, 2026)
- **Pages:** all 12 “Milestones by [age]” pages at `https://www.cdc.gov/act-early/milestones/` (2, 4, 6, 9 months; 1 year; 15, 18 months; 2 years; 30 months; 3, 4, 5 years).
  - Each page shows “Content last reviewed May 15, 2026”.
  - Each page's metadata says first published September 4, 2025 and last updated May 16, 2026.
- **Revision status (verified, not assumed):** CDC's “Key Points about CDC's Developmental Milestone Checklists” (last updated Feb 17, 2026) says: “Revised developmental milestone checklists … were made available in February 2022.” The pages' basis (“milestones most children (75% or more) are expected to reach”) cites *Evidence-Informed Milestones for Developmental Surveillance Tools* (PubMed 35132439).
- **Extraction:** the milestone lists were parsed programmatically from each page's “What most babies/children do by …” section, not retyped. The result is 159 items, each under one of CDC's four headings.
- **Reuse** (CDC “Use of Agency Materials”, last reviewed Oct 28, 2026):
  - Public domain, provided the app:
    1. credits CDC,
    2. shows a prominent non-endorsement disclaimer,
    3. makes no substantive changes, and
    4. states that the material is available free from CDC.
  - Links should open in a new window; the CDC logo may not be used.
  - Some CDC images are restricted, so CDC photos and videos are excluded. Only text is used, and no source documents are committed to the repository.

## 3. Comparison with CDC's printable checklists (PDF)
- **Files compared:** the 12 printable PDFs linked from the pages. Their internal creation dates are October 2021 (30 months: June 2022).
- **Correction of an earlier preparation statement:** the preparation report said 151 of 159 items matched “word for word”. That check actually tested whether each item's *words* appeared anywhere in the PDF, so pronoun swaps passed. A strict exact-sequence comparison (after decoding the PDFs' shifted font encoding) found **133 exact matches and 26 non-exact items**. All 26 were checked by rendering the PDF pages as images and reading them:

| Result | Count | Items |
|---|---|---|
| Identical; only an extraction artifact (two-column layout or encoded font) | 14 | 1 year: “Waves ‘bye-bye’”, “Understands ‘no’ …”; 2 years: “Runs”; 4 years: “Asks to go play …”; 5 years: “Counts to 10”; all 9 items at 30 months |
| Pronoun differs only (the PDF uses the other pronoun) | 10 | 4 months: “Chuckles … make him/her laugh”, “opens mouth when he/she sees”, “Looks at her/his hands”, “holding him/her”, “Uses his/her arm”; 6 months: “a toy she/he wants”, “support herself/himself”; 18 months: “Feeds himself with his/herself with her fingers”; 4 years: “Serves herself/himself food”, “during her/his day” |
| Wording differs | 2 | 6 months: web “Likes to look at **self** in a mirror” vs PDF “at **himself**”; 9 months: web “Makes **a lot of** different sounds like ‘mamamama’ and ‘**bababababa**’” vs PDF “Makes different sounds like ‘mamamama’ and ‘**babababa**’” |

- **The owner's 8 requested items** (those not machine-matched in the preparation report):
  - Identical: “Waves ‘bye-bye’”, “Runs”, “Asks to go play …”, “Counts to 10”.
  - Pronoun-only differences: 18-month “Feeds himself …” and 4-year “Serves herself …”.
  - Wording differences: the 6-month “self/himself” and 9-month “sounds” items.
- **Decision:** the current CDC web pages are the canonical source (newer than the PDFs). Their wording and pronouns are reproduced exactly, as the owner approved.

## 4. AAP and HealthyChildren.org — what happened
1. During preparation, after the environment allowed AAP sites, I loaded three AAP-hosted pages in an automated (headless) browser: the HealthyChildren.org “Corrected Age For Preemies” page, the AAP homepage, and AAP's Terms of Use page. Two other AAP hosts (publications.aap.org, downloads.aap.org) refused access (HTTP 403). Copies of the three loaded pages' text were saved to the session's temporary scratchpad (not the repository).
2. Reading the Terms of Use (published Sept 24, 2026) showed restrictions on using automated means (“robot, spider, scraper or other automated means”) to access the websites without express written permission, and on using content “in conjunction with any artificial intelligence tool”, including “to analyze Content using artificial intelligence”, without express written permission.
3. On discovering this, I stopped all access to AAP and HealthyChildren sites, deleted the saved copies from the scratchpad, and did not use their content in the app or its data. The only AAP text in the project is the short quotation of the Terms of Use above, included solely to document the restriction.
4. The owner then decided to exclude AAP and HealthyChildren content and remove those domains from the environment. This was done through the environment-settings permission mechanism, which the owner approved.
5. **Corrective measure going forward:** before any automated collection or analysis of a source, its access and reuse terms are reviewed first. Pathways.org remains reachable but will not be collected or analyzed until its terms have been reviewed and approved.

This record describes events only. It draws no legal conclusions.

## 5. Gross/fine motor classification (owner-approved)
- **What it covers:** CDC's 44 Movement/Physical milestones are split into **20 gross motor** and **24 fine motor**. This is the app's organizational grouping, not a CDC or clinical classification. Every item keeps its CDC category, and the app explains the distinction.
- **Gross motor:** head, trunk, and posture control; changing position; getting around; balance; whole-limb movement; whole-body ball skills.
- **Fine motor:** using hands and fingers to grasp, release, move, or manipulate objects; tools (spoon, fork, crayon); self-feeding; cup drinking; handling clothing and fasteners.
- **Borderline assignments (all 10 approved):**
  - gross motor: “Moves both arms and both legs”, “Leans on hands to support herself when sitting”, “Catches a large ball most of the time”
  - fine motor: “Uses his arm to swing at toys”, “Brings hands to mouth”, both cup-drinking items, both dressing items, and “Serves herself food or pours water…”

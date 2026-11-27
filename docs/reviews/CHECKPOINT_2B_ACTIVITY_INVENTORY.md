# Checkpoint 2b — Recommended Activity Inventory (final, as implemented)

*Supersedes the planning draft (Appendix A of the implementation plan). Generated from `src/content/activities.cdc-2022.json`, which the build validates against `src/content/activity-ids.lock.json`. This is an editorial and product review, not a clinical validation or certification of CDC's guidance.*

## Summary

- **162 CDC tip records → 153 activities** (unchanged from the approved proposal: 8 groups combine identical or near-identical tips that appear at several ages).
- **93 tips excluded** as general parenting guidance (table at the end).
- **19 activities flagged safety-sensitive** (assisted movement, positioning, supervision, water, climbing, kitchen, scissors, mirrors): their CDC safety sentences and CDC's page guidance are shown on the activity page, the adopted exercise page and the stopwatch/counter sheet.
- **57 activities list materials**, as phrases copied from CDC's text with their qualifiers; examples are marked. Others have no materials field.
- **8 records contain CDC frequency or duration wording** (for a few minutes, every day, a few seconds, each day). It is kept in the text exactly as written and never turned into a schedule, target or prescribed routine; scheduling and targets are left to the parent.
- **Source and reuse:** the 12 registered CDC “Milestones by [age]” pages (content last reviewed May 15, 2026; last updated May 16, 2026), section “Tips and activities — What you can do for your [age]”. Retrieved 2026-11-27 with headless Chromium. U.S. Government public domain under CDC “Use of Agency Materials” (last reviewed Oct 28, 2026; re-read 2026-11-27; conditions unchanged). Text only; no images, logos, videos or PDFs.
- **Display wording:** CDC's exact wording is stored as `source`. The parent-facing `display` applies only declared pronoun → gender-neutral replacements and verb agreement (D4; Decision #86 reasoning), including CDC's page guidance (“his or her” → “their”), plus one disclosed typographical correction (“helps you child” → “helps your child”, record m48-08). Every activity page offers CDC's original wording.
- **App-created organization:** titles, app areas, grouping, materials phrases, sentence roles (purpose/safety/step) and the safety-sensitive flag. Each page says the title and area are the app's own organization.

## Changes from the proposed inventory (content-quality pass, authorization §3)

| Item | Change |
|---|---|
| Inclusion | None added or removed: 153 activities from 162 records, as approved. No activity lost a safety qualification, so none had to be excluded |
| Frequency/duration documentation | Corrected: CDC does use some time words (listed above); they are preserved as text, never converted into schedules or targets |
| Materials | Rewritten as meaningful CDC phrases with qualifiers (e.g. “safe toys to play with that are easy to hold”; “rattles or cloth books with colorful pictures for their age”, marked as examples). Isolated words removed; materials omitted where unnecessary |
| Gender-neutral fields | Purpose and safety are no longer separate extractions: they are sentences of the validated display text, so they can't reintroduce gendered wording. Page guidance is adapted and validated too |
| Repetition | The purpose sentence is shown once (“Why it helps”); safety sentences are highlighted in place within the instructions rather than repeated |
| Safety after adoption | Safety sentences and page guidance come from the locked content by activity id, separate from the parent-editable instructions, and stay visible after adoption and customization |
| Segment role correction | 3-year “Words for feelings”: “a quiet, safe place” is not a safety qualification (marked as an ordinary instruction sentence) |
| Typo | “helps you child” shown as “helps your child”, disclosed, original kept (D4) |
| Titles | “(4 months)” / “(3 years)” suffixes removed from two titles; the age is shown separately |

## Coverage (activities listed at each CDC age, by area)

| CDC age | Gross | Fine | Cognitive | Language | Social |
|---|---|---|---|---|---|
| 2 months | 1 | 0 | 2 | 4 | 2 |
| 4 months | 4 | 1 | 1 | 5 | 2 |
| 6 months | 4 | 0 | 2 | 4 | 1 |
| 9 months | 2 | 1 | 2 | 4 | 3 |
| 1 year | 2 | 1 | 1 | 4 | 0 |
| 15 months | 1 | 2 | 4 | 6 | 2 |
| 18 months | 2 | 0 | 3 | 4 | 2 |
| 2 years | 2 | 3 | 4 | 2 | 3 |
| 30 months | 4 | 2 | 4 | 4 | 2 |
| 3 years | 1 | 3 | 4 | 5 | 3 |
| 4 years | 3 | 0 | 6 | 3 | 8 |
| 5 years | 2 | 3 | 5 | 4 | 3 |

Zero cells stay empty in the app (“CDC's tips for this age don't include a … activity”); nothing is invented.

## Activities

### `cdc22-act-a001` · Back-and-forth “talking” — Language & communication
- **`cdc22-act-m2-01`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Respond positively to your baby. Act excited, smile, and talk to him when he makes sounds. This teaches him to take turns "talking" back and forth in conversation.”
  - Shown as: “Respond positively to your baby. Act excited, smile, and talk to them when they make sounds. This teaches them to take turns "talking" back and forth in conversation.”
  - Why it helps (CDC sentence): “This teaches them to take turns "talking" back and forth in conversation.”
- **`cdc22-act-m4-01`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Respond positively to your baby. Act excited, smile, and talk to him when he makes sounds. This teaches him to take turns "talking" back and forth in conversation.”
  - Shown as: “Respond positively to your baby. Act excited, smile, and talk to them when they make sounds. This teaches them to take turns "talking" back and forth in conversation.”
  - Why it helps (CDC sentence): “This teaches them to take turns "talking" back and forth in conversation.”

### `cdc22-act-a002` · Talk, read and sing — Language & communication
- **`cdc22-act-m2-02`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Talk, read, and sing to your baby to help her develop and understand language.”
  - Shown as: “Talk, read, and sing to your baby to help them develop and understand language.”

### `cdc22-act-a003` · Cuddling and holding — Social & emotional
- **`cdc22-act-m2-03`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Spend time cuddling and holding your baby. This will help him feel safe and cared for. You will not spoil your baby by holding or responding to him.”
  - Shown as: “Spend time cuddling and holding your baby. This will help them feel safe and cared for. You will not spoil your baby by holding or responding to them.”
  - Why it helps (CDC sentence): “This will help them feel safe and cared for.”

### `cdc22-act-a004` · Tummy time with toys — Gross motor · safety-sensitive
- **`cdc22-act-m2-07`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Lay your baby on his tummy when he is awake and put toys at eye level in front of him. This will help him practice lifting his head up. Do not leave your baby alone. If he seems sleepy, place him on his back in a safe sleep area (firm mattress with no blankets, pillows, bumper pads, or toys).”
  - Shown as: “Lay your baby on their tummy when they are awake and put toys at eye level in front of them. This will help them practice lifting their head up. Do not leave your baby alone. If they seem sleepy, place them on their back in a safe sleep area (firm mattress with no blankets, pillows, bumper pads, or toys).”
  - Why it helps (CDC sentence): “This will help them practice lifting their head up.”
  - Safety (CDC sentences, highlighted in place): “Do not leave your baby alone. If they seem sleepy, place them on their back in a safe sleep area (firm mattress with no blankets, pillows, bumper pads, or toys).”
- Materials (CDC phrases): toys at eye level

### `cdc22-act-a005` · Find the rattle sound — Cognitive
- **`cdc22-act-m2-13`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Hold a rattle off to one side of your baby's head, shake it, and see if your baby looks for the noise.”
  - Shown as: verbatim
- Materials (CDC phrases): a rattle

### `cdc22-act-a006` · Talk and play during daily care — Language & communication
- **`cdc22-act-m2-16`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Talk and play with your baby while feeding, dressing, and bathing.”
  - Shown as: verbatim

### `cdc22-act-a007` · Copy your baby’s sounds — Language & communication
- **`cdc22-act-m2-18`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Copy your baby's sounds and see how long your baby "talks" by making sounds back and forth with you.”
  - Shown as: verbatim

### `cdc22-act-a008` · Mirror time — Social & emotional · safety-sensitive
- **`cdc22-act-m2-19`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Place a baby-safe mirror near your baby so she can look at herself. She will begin to develop a sense of who she is.”
  - Shown as: “Place a baby-safe mirror near your baby so they can look at themselves. They will begin to develop a sense of who they are.”
  - Safety (CDC sentences, highlighted in place): “Place a baby-safe mirror near your baby so they can look at themselves.”
- Materials (CDC phrases): a baby-safe mirror

### `cdc22-act-a009` · Bright pictures and faces — Cognitive
- **`cdc22-act-m2-20`** · 2 months · https://www.cdc.gov/act-early/milestones/2-months.html · retrieved 2026-11-27
  - CDC wording: “Look at pictures with bright colors or faces with your baby and talk about them.”
  - Shown as: verbatim
- Materials (CDC phrases): pictures with bright colors or faces

### `cdc22-act-a010` · Reach and kick play — Gross motor · safety-sensitive
- **`cdc22-act-m4-02`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Provide safe opportunities for your baby to reach for toys, kick at toys and explore what is around her. For example, put her on a blanket with safe toys.”
  - Shown as: “Provide safe opportunities for your baby to reach for toys, kick at toys and explore what is around them. For example, put them on a blanket with safe toys.”
  - Safety (CDC sentences, highlighted in place): “Provide safe opportunities for your baby to reach for toys, kick at toys and explore what is around them. For example, put them on a blanket with safe toys.”
- Materials (CDC phrases): a blanket with safe toys (example)

### `cdc22-act-a011` · Talk, read and sing — Language & communication
- **`cdc22-act-m4-04`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Talk, read, and sing to your baby. This will help her learn to speak and understand words later.”
  - Shown as: “Talk, read, and sing to your baby. This will help them learn to speak and understand words later.”
  - Why it helps (CDC sentence): “This will help them learn to speak and understand words later.”

### `cdc22-act-a012` · Easy-to-hold toys — Fine motor
- **`cdc22-act-m4-07`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Give your baby safe toys to play with that are easy to hold, like rattles or cloth books with colorful pictures for her age.”
  - Shown as: “Give your baby safe toys to play with that are easy to hold, like rattles or cloth books with colorful pictures for their age.”
  - Safety (CDC sentences, highlighted in place): “Give your baby safe toys to play with that are easy to hold, like rattles or cloth books with colorful pictures for their age.”
- Materials (CDC phrases): safe toys to play with that are easy to hold; rattles or cloth books with colorful pictures for their age (example)

### `cdc22-act-a013` · Follow the moving toy — Cognitive
- **`cdc22-act-m4-10`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Lay your baby on her back and show her a bright-colored toy. Move the toy slowly from left to right and up and down to see if she watches how the toy moves.”
  - Shown as: “Lay your baby on their back and show them a bright-colored toy. Move the toy slowly from left to right and up and down to see if they watch how the toy moves.”
- Materials (CDC phrases): a bright-colored toy

### `cdc22-act-a014` · Sing-along movement play — Gross motor · safety-sensitive
- **`cdc22-act-m4-11`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Sing and talk to your baby as you help her "exercise" (move her body) for a few minutes. Gently bend and move her arms and legs up and down.”
  - Shown as: “Sing and talk to your baby as you help them "exercise" (move their body) for a few minutes. Gently bend and move their arms and legs up and down.”
  - Safety (CDC sentences, highlighted in place): “Gently bend and move their arms and legs up and down.”
  - CDC time wording kept as text: for a few minutes

### `cdc22-act-a015` · Supported bouncing on your lap — Gross motor · safety-sensitive
- **`cdc22-act-m4-12`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Play with your baby by holding him securely under his arms with his feet on your lap. Let him bounce up and down.”
  - Shown as: “Play with your baby by holding them securely under their arms with their feet on your lap. Let them bounce up and down.”
  - Safety (CDC sentences, highlighted in place): “Play with your baby by holding them securely under their arms with their feet on your lap.”

### `cdc22-act-a016` · Peek-a-boo — Social & emotional
- **`cdc22-act-m4-13`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Play games, such as peek-a-boo. You can cover your eyes with your hands and then uncover and say "peek-a-boo." Watch for your baby's smile or other signs he is enjoying the game.”
  - Shown as: “Play games, such as peek-a-boo. You can cover your eyes with your hands and then uncover and say "peek-a-boo." Watch for your baby's smile or other signs they are enjoying the game.”

### `cdc22-act-a017` · Sound conversations — Language & communication
- **`cdc22-act-m4-15`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Copy your baby's sounds and see how long your baby "talks" back and forth with you.”
  - Shown as: verbatim

### `cdc22-act-a018` · Using your baby’s name — Language & communication
- **`cdc22-act-m4-16`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Call your baby by his name to help him learn it. He will start to recognize it around 9 months. For example, "Are you ticklish, Jordan?"”
  - Shown as: “Call your baby by their name to help them learn it. They will start to recognize it around 9 months. For example, "Are you ticklish, Jordan?"”

### `cdc22-act-a019` · Floor play every day — Gross motor
- **`cdc22-act-m4-17`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Playing on the floor or play mat with your baby every day helps him to move, learn, and explore.”
  - Shown as: “Playing on the floor or play mat with your baby every day helps them to move, learn, and explore.”
  - CDC time wording kept as text: every day
- **`cdc22-act-m6-15`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Playing on the floor or play mat with your baby every day helps him to move, learn, and explore.”
  - Shown as: “Playing on the floor or play mat with your baby every day helps them to move, learn, and explore.”
  - CDC time wording kept as text: every day

### `cdc22-act-a020` · Hold, talk and smile — Social & emotional
- **`cdc22-act-m4-18`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Hold and talk to your baby; smile and be cheerful while you do.”
  - Shown as: verbatim

### `cdc22-act-a021` · Quiet reading and singing time — Language & communication
- **`cdc22-act-m4-19`** · 4 months · https://www.cdc.gov/act-early/milestones/4-months.html · retrieved 2026-11-27
  - CDC wording: “Have quiet play times when you "read" or sing to your baby.”
  - Shown as: verbatim

### `cdc22-act-a022` · Back-and-forth play — Social & emotional
- **`cdc22-act-m6-01`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Use "back and forth" play with your baby. When your baby smiles, you smile; when he makes sounds, you copy them. This helps him learn to be social.”
  - Shown as: “Use "back and forth" play with your baby. When your baby smiles, you smile; when they make sounds, you copy them. This helps them learn to be social.”
  - Why it helps (CDC sentence): “This helps them learn to be social.”

### `cdc22-act-a023` · “Read” colorful pictures — Language & communication
- **`cdc22-act-m6-02`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “"Read" to your baby every day by looking at colorful pictures in magazines or books and talk about them. Respond to her when she babbles and "reads" too. For example, if she makes sounds, say "Yes, that's the doggy!"”
  - Shown as: “"Read" to your baby every day by looking at colorful pictures in magazines or books and talk about them. Respond to them when they babble and "read" too. For example, if they make sounds, say "Yes, that's the doggy!"”
  - CDC time wording kept as text: every day
- Materials (CDC phrases): colorful pictures in magazines or books

### `cdc22-act-a024` · Name new things — Language & communication
- **`cdc22-act-m6-03`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Point out new things to your baby and name them. For example, when on a walk, point out cars, trees, and animals.”
  - Shown as: verbatim

### `cdc22-act-a025` · Songs and music — Language & communication
- **`cdc22-act-m6-04`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Sing to your baby and play music. This will help his brain develop.”
  - Shown as: “Sing to your baby and play music. This will help their brain develop.”
  - Why it helps (CDC sentence): “This will help their brain develop.”

### `cdc22-act-a026` · Point and talk — Language & communication
- **`cdc22-act-m6-06`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “When your baby looks at something, point to it and talk about it.”
  - Shown as: verbatim

### `cdc22-act-a027` · Roll to reach toys — Gross motor · safety-sensitive
- **`cdc22-act-m6-07`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Put your baby on her tummy or back and put toys just out of reach. Encourage her to roll over to reach the toys.”
  - Shown as: “Put your baby on their tummy or back and put toys just out of reach. Encourage them to roll over to reach the toys.”
- Materials (CDC phrases): toys just out of reach

### `cdc22-act-a028` · Supported sitting — Gross motor · safety-sensitive
- **`cdc22-act-m6-12`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Hold your baby up while she sits. Let her look around and give her toys to look at while she learns to balance herself.”
  - Shown as: “Hold your baby up while they sit. Let them look around and give them toys to look at while they learn to balance themselves.”
- Materials (CDC phrases): toys to look at

### `cdc22-act-a029` · Supported standing — Gross motor · safety-sensitive
- **`cdc22-act-m6-13`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Hold your baby with both of your hands securely under her arms and let her stand. Look around with your baby and name what you can see while she is standing.”
  - Shown as: “Hold your baby with both of your hands securely under their arms and let them stand. Look around with your baby and name what you can see while they are standing.”
  - Safety (CDC sentences, highlighted in place): “Hold your baby with both of your hands securely under their arms and let them stand.”

### `cdc22-act-a030` · New sounds and voices — Cognitive
- **`cdc22-act-m6-14`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “Introduce your baby to different sounds and voices. For example, whisper, clap, or make funny noises. See if your baby looks or is curious and see which sounds she prefers.”
  - Shown as: “Introduce your baby to different sounds and voices. For example, whisper, clap, or make funny noises. See if your baby looks or is curious and see which sounds they prefer.”

### `cdc22-act-a031` · Drop-and-return game — Cognitive
- **`cdc22-act-m6-16`** · 6 months · https://www.cdc.gov/act-early/milestones/6-months.html · retrieved 2026-11-27
  - CDC wording: “When he drops a toy on the floor, pick it up and give it back. This game helps him learn cause and effect.”
  - Shown as: “When they drop a toy on the floor, pick it up and give it back. This game helps them learn cause and effect.”
  - Why it helps (CDC sentence): “This game helps them learn cause and effect.”

### `cdc22-act-a032` · Repeat sounds, add words — Language & communication
- **`cdc22-act-m9-01`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Repeat your baby's sounds and say simple words using those sounds. For example, if your baby says "bababa," repeat "bababa," then say "book."”
  - Shown as: verbatim

### `cdc22-act-a033` · Crawl, scoot or roll to reach toys — Gross motor · safety-sensitive
- **`cdc22-act-m9-02`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Place toys on the ground or on a play mat a little out of reach and encourage your baby to crawl, scoot, or roll to get them. Celebrate when she reaches them.”
  - Shown as: “Place toys on the ground or on a play mat a little out of reach and encourage your baby to crawl, scoot, or roll to get them. Celebrate when they reach them.”
- Materials (CDC phrases): toys on the ground or on a play mat

### `cdc22-act-a034` · Wave “bye-bye” and simple signs — Language & communication
- **`cdc22-act-m9-03`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Teach your baby to wave "bye-bye" or shake his head "no." For example, wave and say "bye-bye" when you are leaving. You can also teach simple baby sign language to help your baby tell you what he wants before he can use words.”
  - Shown as: “Teach your baby to wave "bye-bye" or shake their head "no." For example, wave and say "bye-bye" when you are leaving. You can also teach simple baby sign language to help your baby tell you what they want before they can use words.”

### `cdc22-act-a035` · Peek-a-boo with a cloth — Social & emotional
- **`cdc22-act-m9-04`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Play games, such as peek-a-boo. You can cover your head with a cloth and see if your baby pulls it off.”
  - Shown as: verbatim
- Materials (CDC phrases): a cloth

### `cdc22-act-a036` · Dump and fill — Fine motor
- **`cdc22-act-m9-05`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Play with your baby by dumping blocks from a container and putting them back in together.”
  - Shown as: verbatim
- Materials (CDC phrases): blocks; a container

### `cdc22-act-a037` · My turn, your turn — Social & emotional
- **`cdc22-act-m9-06`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Play games with your baby, such as my turn, your turn. Try this by passing a toy back and forth.”
  - Shown as: verbatim
- Materials (CDC phrases): a toy

### `cdc22-act-a038` · “Read” by naming pictures — Language & communication
- **`cdc22-act-m9-07`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “"Read" to your baby. Reading can be talking about pictures. For example, while looking at books or magazines, name the pictures as you point to them.”
  - Shown as: verbatim
- Materials (CDC phrases): books or magazines (example)

### `cdc22-act-a039` · Drop-it game — Cognitive
- **`cdc22-act-m9-17`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Make it a game when your baby drops things. Hand the item back to her so she can drop it again.”
  - Shown as: “Make it a game when your baby drops things. Hand the item back to them so they can drop it again.”

### `cdc22-act-a040` · Describe what your baby sees — Language & communication
- **`cdc22-act-m9-19`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Describe what your baby is looking at; for example, "red, round ball."”
  - Shown as: verbatim

### `cdc22-act-a041` · Find the hidden toy — Cognitive
- **`cdc22-act-m9-20`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Play a game that teaches your baby to look for things she sees you hide, such as a toy under a blanket.”
  - Shown as: “Play a game that teaches your baby to look for things they see you hide, such as a toy under a blanket.”
- Materials (CDC phrases): a toy under a blanket (example)

### `cdc22-act-a042` · Naming feelings — Social & emotional
- **`cdc22-act-m9-22`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Use your words, facial expressions, and voice to show what you think your baby is feeling (sad, mad, happy). For example, tell him "You are sad, let's see if we can make you feel better."”
  - Shown as: “Use your words, facial expressions, and voice to show what you think your baby is feeling (sad, mad, happy). For example, tell them "You are sad, let's see if we can make you feel better."”

### `cdc22-act-a043` · Safe places to pull up — Gross motor · safety-sensitive
- **`cdc22-act-m9-23`** · 9 months · https://www.cdc.gov/act-early/milestones/9-months.html · retrieved 2026-11-27
  - CDC wording: “Put your baby close to things that she can pull up on safely.”
  - Shown as: “Put your baby close to things that they can pull up on safely.”
  - Safety (CDC sentences, highlighted in place): “Put your baby close to things that they can pull up on safely.”
- Materials (CDC phrases): things that they can pull up on safely

### `cdc22-act-a044` · Build on what your baby says — Language & communication
- **`cdc22-act-m12-03`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Build on what your baby tries to say. If he says "ta," say "Yes, a truck," or if he says "truck," say "Yes, that's a big, blue truck."”
  - Shown as: “Build on what your baby tries to say. If they say "ta," say "Yes, a truck," or if they say "truck," say "Yes, that's a big, blue truck."”

### `cdc22-act-a045` · Answer pointing with words — Language & communication
- **`cdc22-act-m12-06`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Respond with words when your baby points. Babies point to ask for things. For example, say "You want the cup? Here is the cup. It's your cup." If he tries to say "cup," celebrate his attempt.”
  - Shown as: “Respond with words when your baby points. Babies point to ask for things. For example, say "You want the cup? Here is the cup. It's your cup." If they try to say "cup," celebrate their attempt.”

### `cdc22-act-a046` · Point out interesting things — Language & communication
- **`cdc22-act-m12-07`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Point to interesting things you see, such as a truck, bus, or animals. This will help your baby pay attention to what others are "showing" him through pointing.”
  - Shown as: “Point to interesting things you see, such as a truck, bus, or animals. This will help your baby pay attention to what others are "showing" them through pointing.”
  - Why it helps (CDC sentence): “This will help your baby pay attention to what others are "showing" them through pointing.”

### `cdc22-act-a047` · Pots-and-pans music — Cognitive
- **`cdc22-act-m12-12`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Give your baby pots and pans or a small musical instrument like a drum or cymbals. Encourage your baby to make noise.”
  - Shown as: verbatim
- Materials (CDC phrases): pots and pans or a small musical instrument like a drum or cymbals (example)

### `cdc22-act-a048` · Touch-and-lift books — Language & communication
- **`cdc22-act-m12-15`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “"Read" books with your baby. Reading can be talking about pictures. Babies this age like books with things they can feel or flaps they can lift.”
  - Shown as: verbatim
- Materials (CDC phrases): books with things they can feel or flaps they can lift

### `cdc22-act-a049` · Blocks and hand toys — Fine motor
- **`cdc22-act-m12-16`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Play together with blocks and other toys that encourage your baby to use her hands.”
  - Shown as: “Play together with blocks and other toys that encourage your baby to use their hands.”
- Materials (CDC phrases): blocks and other toys that encourage your baby to use their hands

### `cdc22-act-a050` · Push toys for walking practice — Gross motor · safety-sensitive
- **`cdc22-act-m12-18`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Let your baby push things around, such as empty boxes, a "kiddie chair," or "push toys," so he can practice walking.”
  - Shown as: “Let your baby push things around, such as empty boxes, a "kiddie chair," or "push toys," so they can practice walking.”
- Materials (CDC phrases): empty boxes, a "kiddie chair," or "push toys," (example)

### `cdc22-act-a051` · Walking practice — Gross motor · safety-sensitive
- **`cdc22-act-m12-19`** · 1 year · https://www.cdc.gov/act-early/milestones/1-year.html · retrieved 2026-11-27
  - CDC wording: “Encourage your baby to practice walking on her own. Baby walkers are not recommended. Let her hold your hands or hold onto furniture that is safe.”
  - Shown as: “Encourage your baby to practice walking on their own. Baby walkers are not recommended. Let them hold your hands or hold onto furniture that is safe.”
  - Safety (CDC sentences, highlighted in place): “Baby walkers are not recommended. Let them hold your hands or hold onto furniture that is safe.”
- Materials (CDC phrases): furniture that is safe

### `cdc22-act-a052` · Repeat and add to words — Language & communication
- **`cdc22-act-m15-01`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Help your child learn to speak. A child's early words are not complete. Repeat and add to what he says. He may say "ba" for ball and you can say "Ball, yes, that's a ball."”
  - Shown as: “Help your child learn to speak. A child's early words are not complete. Repeat and add to what they say. They may say "ba" for ball and you can say "Ball, yes, that's a ball."”

### `cdc22-act-a053` · Name it and wait — Language & communication
- **`cdc22-act-m15-02`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Tell your child the names of objects when he points to them and wait a few seconds to see if he makes any sounds before handing it to him. If he does make a sound, acknowledge him, and repeat the name of the object. "Yes! Cup."”
  - Shown as: “Tell your child the names of objects when they point to them and wait a few seconds to see if they make any sounds before handing it to them. If they do make a sound, acknowledge them, and repeat the name of the object. "Yes! Cup."”
  - CDC time wording kept as text: a few seconds

### `cdc22-act-a054` · Everyday helper — Social & emotional
- **`cdc22-act-m15-03`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Find ways to let your child help with everyday activities. Let her get her shoes to go outside, put the snacks in the bag for the park, or put the socks in the basket.”
  - Shown as: “Find ways to let your child help with everyday activities. Let them get their shoes to go outside, put the snacks in the bag for the park, or put the socks in the basket.”

### `cdc22-act-a055` · What do you do with it? — Cognitive
- **`cdc22-act-m15-05`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Show your child different things, such as a hat. Ask him, "What do you do with a hat? You put it on your head." Put it on your head and then give it to him to see if he copies you. Do this with other objects, such as a book or a cup.”
  - Shown as: “Show your child different things, such as a hat. Ask them, "What do you do with a hat? You put it on your head." Put it on your head and then give it to them to see if they copy you. Do this with other objects, such as a book or a cup.”
- Materials (CDC phrases): a hat (example); a book or a cup (example)

### `cdc22-act-a056` · Songs with gestures — Language & communication
- **`cdc22-act-m15-06`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Sing songs with gestures, such as "Wheels on the Bus." See if your child tries to do some of the actions.”
  - Shown as: verbatim

### `cdc22-act-a057` · Stack and knock down blocks — Fine motor
- **`cdc22-act-m15-11`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to play with blocks. You can stack the blocks and she can knock them down.”
  - Shown as: “Encourage your child to play with blocks. You can stack the blocks and they can knock them down.”
- Materials (CDC phrases): blocks

### `cdc22-act-a058` · Name things throughout the day — Language & communication
- **`cdc22-act-m15-15`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Continue to talk, read, sing, and tell your child the names of things throughout the day. She will try to say and learn many new words, which can help her read later on.”
  - Shown as: “Continue to talk, read, sing, and tell your child the names of things throughout the day. They will try to say and learn many new words, which can help them read later on.”

### `cdc22-act-a059` · Family picture book — Language & communication
- **`cdc22-act-m15-16`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Make a "book" with pictures of people and pets in your child's life. Name them as you look through the book together. Include a picture of your child.”
  - Shown as: verbatim
- Materials (CDC phrases): pictures of people and pets in your child's life

### `cdc22-act-a060` · Sing and dance together — Gross motor
- **`cdc22-act-m15-17`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Sing or play children's songs and songs your family enjoys. Dance with your child.”
  - Shown as: verbatim

### `cdc22-act-a061` · A new book after a favorite — Cognitive
- **`cdc22-act-m15-18`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Read a new book after a favorite one to explore and try new books. Children like to do favorite things again and again. You can use the things they like to do to introduce new things.”
  - Shown as: verbatim

### `cdc22-act-a062` · Simple hide and seek — Cognitive
- **`cdc22-act-m15-19`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Play simple games, such as hide and seek. Let your child watch you hide behind a chair and then wait for her to come "find" you.”
  - Shown as: “Play simple games, such as hide and seek. Let your child watch you hide behind a chair and then wait for them to come "find" you.”

### `cdc22-act-a063` · Cleanup song — Social & emotional
- **`cdc22-act-m15-20`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Make up a simple "cleanup song" and sing it while you teach your child to help "clean up." Have him help put toys in a basket or hand you things to put away.”
  - Shown as: “Make up a simple "cleanup song" and sing it while you teach your child to help "clean up." Have them help put toys in a basket or hand you things to put away.”
- Materials (CDC phrases): a basket

### `cdc22-act-a064` · Simple gestures and signs — Language & communication
- **`cdc22-act-m15-21`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “You can teach simple gestures and sign language (for example, pointing and waving) to help your child "talk" to you and show you what she wants.”
  - Shown as: “You can teach simple gestures and sign language (for example, pointing and waving) to help your child "talk" to you and show you what they want.”

### `cdc22-act-a065` · Stuffed-animal pretend talk — Cognitive
- **`cdc22-act-m15-22`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “"Pretend talk" to your child with a stuffed animal. See if your child tries to copy you or if he uses another stuffed animal to "talk" with the one you are holding.”
  - Shown as: “"Pretend talk" to your child with a stuffed animal. See if your child tries to copy you or if they use another stuffed animal to "talk" with the one you are holding.”
- Materials (CDC phrases): a stuffed animal

### `cdc22-act-a066` · Bubble popping — Fine motor
- **`cdc22-act-m15-23`** · 15 months · https://www.cdc.gov/act-early/milestones/15-months.html · retrieved 2026-11-27
  - CDC wording: “Blow bubbles and let your child pop them. Say things as she pops them, such as "Pop, pop."”
  - Shown as: “Blow bubbles and let your child pop them. Say things as they pop them, such as "Pop, pop."”
- Materials (CDC phrases): bubbles

### `cdc22-act-a067` · Pretend feeding play — Cognitive
- **`cdc22-act-m18-02`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Encourage "pretend" play. Give your child a spoon so she can pretend to feed her stuffed animal. Take turns pretending.”
  - Shown as: “Encourage "pretend" play. Give your child a spoon so they can pretend to feed their stuffed animal. Take turns pretending.”
- Materials (CDC phrases): a spoon; their stuffed animal

### `cdc22-act-a068` · Noticing others’ feelings — Social & emotional
- **`cdc22-act-m18-03`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Help your child learn about others' feelings and about positive ways to react. For example, when he sees a child who is sad, say "He looks sad. Let's bring him a teddy."”
  - Shown as: “Help your child learn about others' feelings and about positive ways to react. For example, when they see a child who is sad, say "They look sad. Let's bring them a teddy."”
- **`cdc22-act-m48-05`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child learn about others' feelings, and about positive ways to react. For example, when he sees a child who is sad, say "He looks sad. Let's bring him a teddy."”
  - Shown as: “Help your child learn about others' feelings, and about positive ways to react. For example, when they see a child who is sad, say "They look sad. Let's bring them a teddy."”
- Materials (CDC phrases): a teddy (example)

### `cdc22-act-a069` · Ask “What is that?” — Cognitive
- **`cdc22-act-m18-04`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Ask simple questions to help your child think about what's around her. For example, ask her, "What is that?"”
  - Shown as: “Ask simple questions to help your child think about what's around them. For example, ask them, "What is that?"”

### `cdc22-act-a070` · Talk at eye level — Language & communication
- **`cdc22-act-m18-11`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Talk with your child by facing her and getting down to her eye level when possible. This helps your child "see" what you're saying through your eyes and face, not just your words.”
  - Shown as: “Talk with your child by facing them and getting down to their eye level when possible. This helps your child "see" what you're saying through your eyes and face, not just your words.”
  - Why it helps (CDC sentence): “This helps your child "see" what you're saying through your eyes and face, not just your words.”

### `cdc22-act-a071` · Name body parts — Language & communication
- **`cdc22-act-m18-12`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Start to teach your child the names for body parts by pointing them out and saying things like "Here's your nose, here's my nose," while pointing to her nose and your own.”
  - Shown as: “Start to teach your child the names for body parts by pointing them out and saying things like "Here's your nose, here's my nose," while pointing to their nose and your own.”

### `cdc22-act-a072` · Add to your child’s words — Language & communication
- **`cdc22-act-m18-14`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Teach your child more words by adding to the words she says. For example, if she says "Dog," say "Yes, that's a dog. Dogs say 'woof, woof.'"”
  - Shown as: “Teach your child more words by adding to the words they say. For example, if they say "Dog," say "Yes, that's a dog. Dogs say 'woof, woof.'"”

### `cdc22-act-a073` · Balls, cars and containers — Gross motor
- **`cdc22-act-m18-15`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Play with your child by rolling balls back and forth, pushing toy cars, and putting blocks or other items in and out of containers.”
  - Shown as: verbatim
- Materials (CDC phrases): balls; toy cars; blocks or other items; containers

### `cdc22-act-a074` · Picture books with simple words — Language & communication
- **`cdc22-act-m18-16`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Read books and talk about the pictures using simple words.”
  - Shown as: verbatim

### `cdc22-act-a075` · Bubbles, taking turns — Social & emotional
- **`cdc22-act-m18-17`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Play simple games where both of you have a part to play. Blow bubbles and let your child pop them. Say things as he pops them, such as "Pop, pop."”
  - Shown as: “Play simple games where both of you have a part to play. Blow bubbles and let your child pop them. Say things as they pop them, such as "Pop, pop."”
- Materials (CDC phrases): bubbles

### `cdc22-act-a076` · Push and pull toys — Gross motor · safety-sensitive
- **`cdc22-act-m18-19`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Give toys that your child can push or pull safely.”
  - Shown as: verbatim
  - Safety (CDC sentences, highlighted in place): “Give toys that your child can push or pull safely.”
- Materials (CDC phrases): toys that your child can push or pull safely

### `cdc22-act-a077` · Pretend-play props — Cognitive
- **`cdc22-act-m18-20`** · 18 months · https://www.cdc.gov/act-early/milestones/18-months.html · retrieved 2026-11-27
  - CDC wording: “Give toys and things to your child that encourage "pretend" play, such as a doll and a baby blanket.”
  - Shown as: verbatim
- Materials (CDC phrases): a doll and a baby blanket (example)

### `cdc22-act-a078` · Help with word sounds — Language & communication
- **`cdc22-act-m24-01`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child learn how words sound, even if he can't say them clearly yet. For example, if your child says, "or nana," say "You want more banana."”
  - Shown as: “Help your child learn how words sound, even if they can't say them clearly yet. For example, if your child says, "or nana," say "You want more banana."”

### `cdc22-act-a079` · Mealtime helper — Social & emotional
- **`cdc22-act-m24-03`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Have your child help you get ready for mealtime, by letting him carry things to the table, such as plastic cups or napkins. Thank your child for helping.”
  - Shown as: “Have your child help you get ready for mealtime, by letting them carry things to the table, such as plastic cups or napkins. Thank your child for helping.”
- Materials (CDC phrases): plastic cups or napkins (example)

### `cdc22-act-a080` · Kick, roll and throw balls — Gross motor
- **`cdc22-act-m24-04`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Give your child balls to kick, roll, and throw.”
  - Shown as: verbatim
- Materials (CDC phrases): balls to kick, roll, and throw

### `cdc22-act-a081` · Cause-and-effect toys — Cognitive
- **`cdc22-act-m24-05`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Give toys that teach your child how to make things work and how to solve problems. For example, give her toys where she can push a button and something happens.”
  - Shown as: “Give toys that teach your child how to make things work and how to solve problems. For example, give them toys where they can push a button and something happens.”
- Materials (CDC phrases): toys where they can push a button and something happens (example)

### `cdc22-act-a082` · Dress-up play — Cognitive
- **`cdc22-act-m24-06`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child play dress up with grown-up clothes, such as shoes, hats, and shirts. This helps him begin to pretend play.”
  - Shown as: “Let your child play dress up with grown-up clothes, such as shoes, hats, and shirts. This helps them begin to pretend play.”
  - Why it helps (CDC sentence): “This helps them begin to pretend play.”
- Materials (CDC phrases): grown-up clothes, such as shoes, hats, and shirts (example)

### `cdc22-act-a083` · Simple chores — Social & emotional
- **`cdc22-act-m24-10`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Use positive words when your child is being a good helper. Let him help with simple chores, such as putting toys or laundry in a basket.”
  - Shown as: “Use positive words when your child is being a good helper. Let them help with simple chores, such as putting toys or laundry in a basket.”

### `cdc22-act-a084` · “Ready, set, go” swing game — Gross motor · safety-sensitive
- **`cdc22-act-m24-11`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Play with your child outside, by playing "ready, set, go." For example, pull your child back in a swing. Say "Ready, set....", then wait and say "Go" when you push the swing.”
  - Shown as: verbatim
- **`cdc22-act-m30-16`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Play with your child outside by playing "ready, set, go." For example, pull your child back in a swing. Say "Ready, set...", then wait and say "Go" when you push the swing.”
  - Shown as: verbatim
- Materials (CDC phrases): a swing (example)

### `cdc22-act-a085` · Crayons and finger paint — Fine motor
- **`cdc22-act-m24-12`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child create simple art projects with you. Give your child crayons or put some finger paint on paper and let her explore by spreading it around and making dots. Hang it on the wall or refrigerator so your child can see it.”
  - Shown as: “Let your child create simple art projects with you. Give your child crayons or put some finger paint on paper and let them explore by spreading it around and making dots. Hang it on the wall or refrigerator so your child can see it.”
- Materials (CDC phrases): crayons; finger paint on paper

### `cdc22-act-a086` · Sand and water play — Fine motor · safety-sensitive
- **`cdc22-act-m24-14`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child play with sand toys or plastic containers, spoons, or a funnel in the tub or in a sandbox.”
  - Shown as: verbatim
- Materials (CDC phrases): sand toys or plastic containers, spoons, or a funnel

### `cdc22-act-a087` · Simple puzzles — Cognitive
- **`cdc22-act-m24-15`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child do simple puzzles with shapes, colors, or animals. Name each piece when your child puts it in place.”
  - Shown as: verbatim
- **`cdc22-act-m30-11`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Help your child do simple puzzles with shapes, colors, or animals. Name each piece when your child puts it in place.”
  - Shown as: verbatim
- Materials (CDC phrases): simple puzzles with shapes, colors, or animals

### `cdc22-act-a088` · Explore new places — Cognitive
- **`cdc22-act-m24-16`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child's curiosity and help her learn and explore new things. Take her to the park, take walks, or go on a bus ride.”
  - Shown as: “Encourage your child's curiosity and help them learn and explore new things. Take them to the park, take walks, or go on a bus ride.”

### `cdc22-act-a089` · Body-part songs — Language & communication
- **`cdc22-act-m24-17`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Sing songs, such as "Head, Shoulders, Knees, and Toes," to teach names of body parts. After singing it a few times, see if your child sings some of the words when you touch a body part and wait.”
  - Shown as: verbatim

### `cdc22-act-a090` · Build and knock down towers — Fine motor
- **`cdc22-act-m24-19`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to play with blocks. Take turns building towers and knocking them down.”
  - Shown as: verbatim
- Materials (CDC phrases): blocks

### `cdc22-act-a091` · Helping hands — Social & emotional
- **`cdc22-act-m24-20`** · 2 years · https://www.cdc.gov/act-early/milestones/2-years.html · retrieved 2026-11-27
  - CDC wording: “Ask your child to help you open the drawer when you put away clothes or open the door when you go outside.”
  - Shown as: verbatim

### `cdc22-act-a092` · Free play — Cognitive
- **`cdc22-act-m30-01`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Encourage "free play," where your child can follow her interests, try new things, and use things in new ways.”
  - Shown as: “Encourage "free play," where your child can follow their interests, try new things, and use things in new ways.”

### `cdc22-act-a093` · Who, what and where questions — Language & communication
- **`cdc22-act-m30-04`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Ask your child simple questions about books and stories. Ask questions, such as "Who?" "What?" and "Where?"”
  - Shown as: verbatim

### `cdc22-act-a094` · Learning to play together — Social & emotional
- **`cdc22-act-m30-05`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Help your child learn how to play with other children. Show him how by helping him share, take turns, and use his "words."”
  - Shown as: “Help your child learn how to play with other children. Show them how by helping them share, take turns, and use their "words."”

### `cdc22-act-a095` · Drawing lines and circles — Fine motor
- **`cdc22-act-m30-06`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Let your child "draw" with crayons on paper, shaving cream on a tray, or chalk on a sidewalk. If you draw a straight line, see if she will copy you. When she gets good at lines, show her how to draw a circle.”
  - Shown as: “Let your child "draw" with crayons on paper, shaving cream on a tray, or chalk on a sidewalk. If you draw a straight line, see if they will copy you. When they get good at lines, show them how to draw a circle.”
- Materials (CDC phrases): crayons on paper, shaving cream on a tray, or chalk on a sidewalk

### `cdc22-act-a096` · Playing with other children — Social & emotional
- **`cdc22-act-m30-07`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Let your child play with other children, such as at a park or library. Ask about local play groups and pre-school programs. Playing with others helps him learn the value of sharing and friendship.”
  - Shown as: “Let your child play with other children, such as at a park or library. Ask about local play groups and pre-school programs. Playing with others helps them learn the value of sharing and friendship.”
  - Why it helps (CDC sentence): “Playing with others helps them learn the value of sharing and friendship.”
- **`cdc22-act-m48-08`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child play with other children, such as at a park or library. Ask about local play groups and pre-school programs. Playing with others helps you child learn the value of sharing and friendship.”
  - Shown as: “Let your child play with other children, such as at a park or library. Ask about local play groups and pre-school programs. Playing with others helps your child learn the value of sharing and friendship.” (includes the disclosed typing correction)
  - Why it helps (CDC sentence): “Playing with others helps your child learn the value of sharing and friendship.”
- **`cdc22-act-m60-14`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child play with other children, such as at a park or library. Ask about local play groups and pre-school programs. Playing with others helps your child learn the value of sharing and friendship.”
  - Shown as: verbatim
  - Why it helps (CDC sentence): “Playing with others helps your child learn the value of sharing and friendship.”

### `cdc22-act-a097` · Describing words — Language & communication
- **`cdc22-act-m30-10`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Use words to describe things to your child, such as big/small, fast/slow, on/off, and in/out.”
  - Shown as: verbatim

### `cdc22-act-a098` · Climbing and running at the park — Gross motor · safety-sensitive
- **`cdc22-act-m30-12`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Play with your child outside. For example, take your child to the park to climb on equipment and run in safe areas.”
  - Shown as: verbatim
  - Safety (CDC sentences, highlighted in place): “For example, take your child to the park to climb on equipment and run in safe areas.”

### `cdc22-act-a099` · Big-box pretend play — Cognitive
- **`cdc22-act-m30-15`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Let your child play with large boxes. He can pretend it is a car, bus, train, or house. Let him color, paint it, and put stickers on it.”
  - Shown as: “Let your child play with large boxes. They can pretend it is a car, bus, train, or house. Let them color, paint it, and put stickers on it.”
- Materials (CDC phrases): large boxes; stickers

### `cdc22-act-a100` · Name colors, body parts and pictures — Language & communication
- **`cdc22-act-m30-17`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to name colors, body parts, and pictures in books.”
  - Shown as: verbatim

### `cdc22-act-a101` · Kick a ball back and forth — Gross motor
- **`cdc22-act-m30-18`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Kick a ball back and forth with your child. When your child is good at that, show her how to run and kick the ball.”
  - Shown as: “Kick a ball back and forth with your child. When your child is good at that, show them how to run and kick the ball.”
- Materials (CDC phrases): a ball

### `cdc22-act-a102` · Follow the leader — Gross motor
- **`cdc22-act-m30-20`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Play "follow the leader" with your child. Walk in a straight line, make turns, walk backwards, and walk on tiptoes. Let your child lead after you show him how.”
  - Shown as: “Play "follow the leader" with your child. Walk in a straight line, make turns, walk backwards, and walk on tiptoes. Let your child lead after you show them how.”

### `cdc22-act-a103` · Reading and library visits — Language & communication
- **`cdc22-act-m30-21`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Read to your child and visit the local library. This will help your child enjoy reading and be ready to read when she is older.”
  - Shown as: “Read to your child and visit the local library. This will help your child enjoy reading and be ready to read when they are older.”
  - Why it helps (CDC sentence): “This will help your child enjoy reading and be ready to read when they are older.”

### `cdc22-act-a104` · Pretend cooking — Cognitive
- **`cdc22-act-m30-22`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Encourage "pretend" play. For example, let your child pretend to cook using safe things from your kitchen.”
  - Shown as: verbatim
  - Safety (CDC sentences, highlighted in place): “For example, let your child pretend to cook using safe things from your kitchen.”
- Materials (CDC phrases): safe things from your kitchen (example)

### `cdc22-act-a105` · Turning pages — Fine motor
- **`cdc22-act-m30-23`** · 30 months · https://www.cdc.gov/act-early/milestones/30-months.html · retrieved 2026-11-27
  - CDC wording: “Show your child how to turn pages in a book or magazine.”
  - Shown as: verbatim
- Materials (CDC phrases): a book or magazine

### `cdc22-act-a106` · Solving problems together — Cognitive
- **`cdc22-act-m36-01`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to solve her own problems with your support. Ask questions to help her understand the problem. Help her think of solutions, try one out, and try more if needed.”
  - Shown as: “Encourage your child to solve their own problems with your support. Ask questions to help them understand the problem. Help them think of solutions, try one out, and try more if needed.”

### `cdc22-act-a107` · Words for feelings — Social & emotional
- **`cdc22-act-m36-02`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Talk about your child's emotions and give him words to help him explain how he's feeling. Help your child manage stressful feelings by teaching him to take deep breaths, hug a favorite toy, or go to a quiet, safe place when he is upset.”
  - Shown as: “Talk about your child's emotions and give them words to help them explain how they're feeling. Help your child manage stressful feelings by teaching them to take deep breaths, hug a favorite toy, or go to a quiet, safe place when they are upset.”

### `cdc22-act-a108` · Talk about the story — Language & communication
- **`cdc22-act-m36-04`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Read with your child. Ask questions, such as "What is happening in the picture?" and/or "What do you think will happen next?" When she gives you an answer, ask for more details.”
  - Shown as: “Read with your child. Ask questions, such as "What is happening in the picture?" and/or "What do you think will happen next?" When they give you an answer, ask for more details.”

### `cdc22-act-a109` · Counting games — Cognitive
- **`cdc22-act-m36-05`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Play counting games. Count body parts, stairs, and other things you use or see every day. Children this age are starting to learn about numbers and counting.”
  - Shown as: verbatim
  - CDC time wording kept as text: every day

### `cdc22-act-a110` · Longer sentences — Language & communication
- **`cdc22-act-m36-06`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child develop his language skills by speaking to him in longer sentences than his, using real words. Repeat what he says, for example, "need nana," and then show how to use more "grown-up" words by saying, "I want a banana."”
  - Shown as: “Help your child develop their language skills by speaking to them in longer sentences than theirs, using real words. Repeat what they say, for example, "need nana," and then show how to use more "grown-up" words by saying, "I want a banana."”

### `cdc22-act-a111` · Helping make meals — Fine motor · safety-sensitive
- **`cdc22-act-m36-07`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child help with making meals. Give him simple tasks, such as washing fruits and vegetables or stirring.”
  - Shown as: “Let your child help with making meals. Give them simple tasks, such as washing fruits and vegetables or stirring.”

### `cdc22-act-a112` · Two- and three-step instructions — Language & communication
- **`cdc22-act-m36-08`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Give your child instructions with 2 or 3 steps. For example, "Go to your room and get your shoes and coat."”
  - Shown as: verbatim

### `cdc22-act-a113` · Songs and rhymes — Language & communication
- **`cdc22-act-m36-10`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Teach your child simple songs and rhymes, such as "Itsy Bitsy Spider" or "Twinkle, Twinkle, Little Star."”
  - Shown as: verbatim

### `cdc22-act-a114` · Activity box — Fine motor
- **`cdc22-act-m36-11`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Give your child an "activity box" with paper, crayons, and coloring books. Color and draw lines and shapes with your child.”
  - Shown as: verbatim
- Materials (CDC phrases): an "activity box" with paper, crayons, and coloring books

### `cdc22-act-a115` · Playing with other children — Social & emotional
- **`cdc22-act-m36-12`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to play with other children. This helps him learn the value of friendship and how to get along with others.”
  - Shown as: “Encourage your child to play with other children. This helps them learn the value of friendship and how to get along with others.”
  - Why it helps (CDC sentence): “This helps them learn the value of friendship and how to get along with others.”

### `cdc22-act-a116` · Playdough — Fine motor
- **`cdc22-act-m36-13`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child play with playdough by squishing it, pressing it, pinching it, and making balls in different colors. This builds her hand and finger muscles for writing, buttoning, and cutting.”
  - Shown as: “Let your child play with playdough by squishing it, pressing it, pinching it, and making balls in different colors. This builds their hand and finger muscles for writing, buttoning, and cutting.”
  - Why it helps (CDC sentence): “This builds their hand and finger muscles for writing, buttoning, and cutting.”
- Materials (CDC phrases): playdough

### `cdc22-act-a117` · Opposites game — Cognitive
- **`cdc22-act-m36-15`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Play games to teach opposites. Get down low and say, "I am small." Then stand up and say, "I am big." Do the same thing for fast/slow, quiet/loud.”
  - Shown as: verbatim

### `cdc22-act-a118` · Matching games — Cognitive
- **`cdc22-act-m36-16`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Play matching games. Ask your child to find objects in books or around the house that are the same.”
  - Shown as: verbatim

### `cdc22-act-a119` · Outdoor play, child leads — Gross motor
- **`cdc22-act-m36-17`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Play outside with your child. Go to the park or a walking trail. Allow your child plenty of time to choose what and how she wants to play. Join her and follow her lead.”
  - Shown as: “Play outside with your child. Go to the park or a walking trail. Allow your child plenty of time to choose what and how they want to play. Join them and follow their lead.”

### `cdc22-act-a120` · Getting ready for new places — Social & emotional
- **`cdc22-act-m36-18`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child be ready for new places and meeting new people. For example, you can read stories or role play (pretend play) about new places or things to help him feel more comfortable.”
  - Shown as: “Help your child be ready for new places and meeting new people. For example, you can read stories or role play (pretend play) about new places or things to help them feel more comfortable.”
- **`cdc22-act-m48-01`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child be ready for new places and meeting new people. For example, you can read stories or role play (pretend play) to help him be comfortable.”
  - Shown as: “Help your child be ready for new places and meeting new people. For example, you can read stories or role play (pretend play) to help them be comfortable.”

### `cdc22-act-a121` · Name and age — Language & communication
- **`cdc22-act-m36-19`** · 3 years · https://www.cdc.gov/act-early/milestones/3-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to tell you her name and age.”
  - Shown as: “Encourage your child to tell you their name and age.”

### `cdc22-act-a122` · What happens next? — Language & communication
- **`cdc22-act-m48-02`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Read with your child. Ask him what's happening in the story and what he thinks might happen next.”
  - Shown as: “Read with your child. Ask them what's happening in the story and what they think might happen next.”

### `cdc22-act-a123` · Colors, shapes and sizes — Cognitive
- **`cdc22-act-m48-03`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child learn about colors, shapes, and sizes. For example, ask the color, shapes, and size of things she sees during the day.”
  - Shown as: “Help your child learn about colors, shapes, and sizes. For example, ask the color, shapes, and size of things they see during the day.”

### `cdc22-act-a124` · Using words to ask — Social & emotional
- **`cdc22-act-m48-04`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to use "his words" to ask for things and solve problems but show him how. He may not know the words he needs. For example, help your child say, "Can I have a turn?" instead of taking something from someone.”
  - Shown as: “Encourage your child to use "their words" to ask for things and solve problems but show them how. They may not know the words they need. For example, help your child say, "Can I have a turn?" instead of taking something from someone.”

### `cdc22-act-a125` · Imaginative play — Cognitive
- **`cdc22-act-m48-11`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Give your child toys or things that encourage his imagination, such as dress-up clothes, pots and pans to pretend cook, or blocks to build with. Join him in pretend play, such as eating the pretend food he cooks.”
  - Shown as: “Give your child toys or things that encourage their imagination, such as dress-up clothes, pots and pans to pretend cook, or blocks to build with. Join them in pretend play, such as eating the pretend food they cook.”
- Materials (CDC phrases): dress-up clothes, pots and pans to pretend cook, or blocks to build with (example)

### `cdc22-act-a126` · Answering “why” questions — Cognitive
- **`cdc22-act-m48-12`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Take time to answer your child's "why" questions. If you don't know the answer, say "I don't know," or help your child find the answer in a book, on the Internet, or from another adult.”
  - Shown as: verbatim

### `cdc22-act-a127` · Counting things — Cognitive
- **`cdc22-act-m48-13`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Count simple things, such as fingers, toys, or bananas. This will help your child learn about numbers and counting.”
  - Shown as: verbatim
  - Why it helps (CDC sentence): “This will help your child learn about numbers and counting.”

### `cdc22-act-a128` · Skills for playing with others — Social & emotional
- **`cdc22-act-m48-15`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Continue to teach your child skills to play with others, such as using words, sharing toys, and taking turns.”
  - Shown as: verbatim

### `cdc22-act-a129` · Outdoor games with friends — Gross motor
- **`cdc22-act-m48-16`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Teach your child to play outdoor games with friends, such as tag, follow the leader, and hide and seek.”
  - Shown as: verbatim

### `cdc22-act-a130` · Complete sentences — Language & communication
- **`cdc22-act-m48-17`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Spend time speaking to your child in complete sentences, using "grown-up" words. This will help her learn better speaking skills and helps with future reading and writing skills.”
  - Shown as: “Spend time speaking to your child in complete sentences, using "grown-up" words. This will help them learn better speaking skills and helps with future reading and writing skills.”
  - Why it helps (CDC sentence): “This will help them learn better speaking skills and helps with future reading and writing skills.”

### `cdc22-act-a131` · Helping with chores — Social & emotional
- **`cdc22-act-m48-18`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child help with simple chores, such as bringing in the mail, feeding a pet, or wiping down tables. This helps build independence.”
  - Shown as: verbatim
  - Why it helps (CDC sentence): “This helps build independence.”

### `cdc22-act-a132` · Stop-and-go games — Social & emotional
- **`cdc22-act-m48-19`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Teach your child to stop and wait when excited by playing red light, green light, or freeze dance (play music, turn it off, and have everyone freeze when it stops).”
  - Shown as: verbatim

### `cdc22-act-a133` · Dance and copy moves — Gross motor
- **`cdc22-act-m48-20`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Play your child's favorite songs and dance with your child. Take turns copying each other's moves.”
  - Shown as: verbatim

### `cdc22-act-a134` · Working it out with friends — Social & emotional
- **`cdc22-act-m48-21`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Give your child time to solve her own problems with friends. For example, if they are arguing over who gets to be which superhero, let them work it out. Stay nearby to help if needed. If they can't work it out, use questions to help them think of other solutions.”
  - Shown as: “Give your child time to solve their own problems with friends. For example, if they are arguing over who gets to be which superhero, let them work it out. Stay nearby to help if needed. If they can't work it out, use questions to help them think of other solutions.”
  - Safety (CDC sentences, highlighted in place): “Stay nearby to help if needed.”

### `cdc22-act-a135` · First, second, finally — Cognitive
- **`cdc22-act-m48-22`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Use words, such as "first," "second," and "finally." When playing, telling stories, or doing chores, ask your child what comes next. This will help your child learn about the order of events.”
  - Shown as: verbatim
  - Why it helps (CDC sentence): “This will help your child learn about the order of events.”

### `cdc22-act-a136` · Tic-tac-toe and matching games — Cognitive
- **`cdc22-act-m48-24`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Play simple games, such as Tic-Tac-Toe or matching games.”
  - Shown as: verbatim
- Materials (CDC phrases): Tic-Tac-Toe or matching games (example)

### `cdc22-act-a137` · Active play every day — Gross motor
- **`cdc22-act-m48-25`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Try to make time for active play each day. Your child will have more fun if she can choose the activity. For example, give her choices, such as playing music and dancing together, playing outside, or taking a walk together.”
  - Shown as: “Try to make time for active play each day. Your child will have more fun if they can choose the activity. For example, give them choices, such as playing music and dancing together, playing outside, or taking a walk together.”
  - CDC time wording kept as text: each day
- **`cdc22-act-m60-23`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Try to make time for active play each day. Your child will have more fun if she can choose the activity. For example, give her choices, such as playing music and dancing together, playing outside, or taking a walk together.”
  - Shown as: “Try to make time for active play each day. Your child will have more fun if they can choose the activity. For example, give them choices, such as playing music and dancing together, playing outside, or taking a walk together.”
  - CDC time wording kept as text: each day

### `cdc22-act-a138` · Library trips — Language & communication
- **`cdc22-act-m48-27`** · 4 years · https://www.cdc.gov/act-early/milestones/4-years.html · retrieved 2026-11-27
  - CDC wording: “Take trips to the library to let your child pick out books.”
  - Shown as: verbatim

### `cdc22-act-a139` · Ask “why” and “how” — Language & communication
- **`cdc22-act-m60-02`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Ask your child what she is playing. Help her expand her answers by asking "Why?" and "How?" For example, say "That's a nice bridge you're building. Why did you put it there?"”
  - Shown as: “Ask your child what they are playing. Help them expand their answers by asking "Why?" and "How?" For example, say "That's a nice bridge you're building. Why did you put it there?"”

### `cdc22-act-a140` · Puzzles and building blocks — Fine motor
- **`cdc22-act-m60-03`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Play with toys that encourage your child to put things together, such as puzzles and building blocks.”
  - Shown as: verbatim
- Materials (CDC phrases): puzzles and building blocks (example)

### `cdc22-act-a141` · Words about time — Cognitive
- **`cdc22-act-m60-04`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Use words to help your child begin to understand time. For example, sing songs about the days of the week and let him know what day it is. Use words about time, such as today, tomorrow, and yesterday.”
  - Shown as: “Use words to help your child begin to understand time. For example, sing songs about the days of the week and let them know what day it is. Use words about time, such as today, tomorrow, and yesterday.”

### `cdc22-act-a142` · Doing it themselves — Fine motor
- **`cdc22-act-m60-05`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Let your child do things for himself, even if he doesn't do it perfectly. For example, let him make his bed, button his shirt, or pour water into a cup. Celebrate when he does it and try not to "fix" anything you don't have to.”
  - Shown as: “Let your child do things for themselves, even if they don't do it perfectly. For example, let them make their bed, button their shirt, or pour water into a cup. Celebrate when they do it and try not to "fix" anything you don't have to.”

### `cdc22-act-a143` · Talking about feelings — Social & emotional
- **`cdc22-act-m60-06`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Talk about and label your child's and your own feelings. Read books and talk about the feelings characters have and why they have them.”
  - Shown as: verbatim

### `cdc22-act-a144` · Rhyming games — Language & communication
- **`cdc22-act-m60-07`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Play rhyming games. For example, say "What rhymes with cat?"”
  - Shown as: verbatim

### `cdc22-act-a145` · Games with rules — Cognitive
- **`cdc22-act-m60-08`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Teach your child to follow rules in games. For example, play simple board games, card games, or Simon Says.”
  - Shown as: verbatim
- Materials (CDC phrases): simple board games, card games, or Simon Says (example)

### `cdc22-act-a146` · Telling the story from pictures — Language & communication
- **`cdc22-act-m60-12`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to "read" by looking at the pictures and telling the story.”
  - Shown as: verbatim

### `cdc22-act-a147` · Memory and attention games — Cognitive
- **`cdc22-act-m60-13`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Play games that help with memory and attention. For example, play card games, Tic Tac Toe, I Spy, or Hot and Cold.”
  - Shown as: verbatim
- Materials (CDC phrases): card games, Tic Tac Toe, I Spy, or Hot and Cold (example)

### `cdc22-act-a148` · Dress-up, school and house — Cognitive
- **`cdc22-act-m60-17`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Encourage your child to pretend play. Help your child find items she can use to play dress up, school, or house.”
  - Shown as: “Encourage your child to pretend play. Help your child find items they can use to play dress up, school, or house.”
- Materials (CDC phrases): items they can use to play dress up, school, or house

### `cdc22-act-a149` · Creative art box — Fine motor · safety-sensitive
- **`cdc22-act-m60-18`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Keep a box of crayons, paper, paint, child scissors, and glue for creative play. Encourage your child to draw and make art projects with different supplies.”
  - Shown as: verbatim
- Materials (CDC phrases): a box of crayons, paper, paint, child scissors, and glue

### `cdc22-act-a150` · Swings and monkey bars — Gross motor · safety-sensitive
- **`cdc22-act-m60-19`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Take your child to the playground. Teach her how to pump her legs back and forth on a swing and help her play on the monkey bars.”
  - Shown as: “Take your child to the playground. Teach them how to pump their legs back and forth on a swing and help them play on the monkey bars.”

### `cdc22-act-a151` · Ask about the pictures — Language & communication
- **`cdc22-act-m60-21`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Read to your child. Ask questions, such as "What is happening in the picture?" and "What do you think will happen next?"”
  - Shown as: verbatim

### `cdc22-act-a152` · Explore what they love — Cognitive
- **`cdc22-act-m60-22`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Explore things your child likes. For example, if he loves animals, get some library books about animals, look for birds and squirrels in a park, or visit a zoo to learn about animals.”
  - Shown as: “Explore things your child likes. For example, if they love animals, get some library books about animals, look for birds and squirrels in a park, or visit a zoo to learn about animals.”

### `cdc22-act-a153` · Getting ready for kindergarten — Social & emotional
- **`cdc22-act-m60-25`** · 5 years · https://www.cdc.gov/act-early/milestones/5-years.html · retrieved 2026-11-27
  - CDC wording: “Help your child be ready for new places and meeting new people. For example, you can read stories or role play (pretend play) to help her get ready for Kindergarten.”
  - Shown as: “Help your child be ready for new places and meeting new people. For example, you can read stories or role play (pretend play) to help them get ready for Kindergarten.”

## Page guidance (shown with every activity of that age)

- **cdc-ltsae-2-months**: “As your baby's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.” (CDC: “As your baby's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.”)
- **cdc-ltsae-4-months**: “As your baby's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.” (CDC: “As your baby's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.”)
- **cdc-ltsae-6-months**: “As your baby's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.” (CDC: “As your baby's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.”)
- **cdc-ltsae-9-months**: “As your baby's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.” (CDC: “As your baby's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.”)
- **cdc-ltsae-1-year**: “As your baby's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.” (CDC: “As your baby's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your baby's doctor and teachers if you have questions or for more ideas on how to help your baby's development.”)
- **cdc-ltsae-15-months**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)
- **cdc-ltsae-18-months**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)
- **cdc-ltsae-2-years**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)
- **cdc-ltsae-30-months**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)
- **cdc-ltsae-3-years**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)
- **cdc-ltsae-4-years**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)
- **cdc-ltsae-5-years**: “As your child's first teacher, you can help their learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.” (CDC: “As your child's first teacher, you can help his or her learning and brain development. Try these simple tips and activities in a safe way. Talk with your child's doctor and teachers if you have questions or for more ideas on how to help your child's development.”)

## Excluded tips

| Reason | Count | Records |
|---|---|---|
| Caregiver self-care or general responsiveness guidance | 13 | m2-04, m2-05, m2-06, m2-14, m2-17, m4-08, m4-14, m6-08, m6-11, m9-14, m9-16, m9-18, m12-17 |
| Feeding, mealtime or nutrition guidance | 22 | m2-08, m2-09, m2-10, m4-06, m6-09, m6-10, m9-09, m9-11, m12-09, m12-10, m12-13, m15-12, m15-13, m18-05, m24-07, m30-03, m30-08, m30-13, m36-14, m48-09, m48-14, m60-11 |
| Home or personal safety guidance | 6 | m2-11, m9-21, m12-05, m15-14, m60-15, m60-16 |
| Routines or transitions | 5 | m2-12, m4-09, m9-13, m12-11, m18-07 |
| Screen-time guidance | 12 | m2-15, m4-05, m6-05, m9-08, m12-08, m15-10, m18-08, m24-18, m30-09, m36-09, m48-28, m60-10 |
| Permission-style guidance rather than an activity | 1 | m4-03 |
| Behavior guidance or discipline | 22 | m9-10, m12-01, m12-04, m15-07, m15-08, m15-09, m18-01, m18-06, m18-10, m18-13, m18-18, m24-02, m24-13, m30-02, m36-03, m48-06, m48-07, m48-23, m48-26, m60-01, m60-09, m60-24 |
| Example uses a gendered family role word ("Mommy", "Daddy") that the validated pronoun-only display layer cannot adapt | 2 | m9-12, m12-02 |
| Sleep or bedtime routine | 7 | m9-15, m12-14, m15-04, m24-08, m30-19, m48-10, m60-20 |
| Toilet training | 3 | m18-09, m24-09, m30-14 |

# Checkpoint 2b-R — Age-responsive goal ideas (R-010): content and mapping

*Prepared by Claude Code on 2026-11-27. Generated from `src/content/goal-ideas.app-2026.json`; the build fails if the content doesn't pass its validation.*

## What these are
- **App-written** possible goals, shown under My Goals → Looking for inspiration? → **Goal ideas by age**. They are not CDC content, not CDC milestones, not recommendations from CDC or any medical organization, and not things a child is expected to do.
- **Sources:** only the verified inventories already in the app: the 159 CDC milestones (`milestones.cdc-2022.json`) and the 153 recommended activities (`activities.cdc-2022.json`). **No new external source was used and nothing was retrieved.**
- **Never** assigned, scheduled or dated. Choosing an idea fills in only the goal name and area on the ordinary goal form; nothing is saved until the parent saves it, no target date is set and no milestone is linked.
- **Safety:** an idea supported by a safety-sensitive activity shows that activity's safety sentences (CDC wording, gender-neutral display) and a link to the activity's safety notes.
- **Why:** the eight generic examples approved at D8 were an approved design that proved insufficiently useful during the owner's human testing (a 4-month-old was shown ideas meant for much older children). It was not a programming defect.
- **Review:** the wording and mapping were written and checked by Claude Code as an editorial review, not a clinical one. The owner may want to read the list below.

## Ranges (whole months of the child's milestone age)
| Range | Months | Supporting reference ages |
|---|---|---|
| Birth to under 6 months | 0 ≤ age < 6 | 2, 4, 6 |
| 6 to under 12 months | 6 ≤ age < 12 | 6, 9, 12 |
| 12 to under 24 months | 12 ≤ age < 24 | 12, 15, 18, 24 |
| 24 to under 36 months | 24 ≤ age < 36 | 24, 30, 36 |
| 36 to under 48 months | 36 ≤ age < 48 | 36, 48 |
| 48 to 60 months | 48 ≤ age ≤ 60 | 48, 60 |

- **Milestone age** = chronological, or corrected when the parent chose corrected age (the same age the milestones use). **Before the due date** no range is chosen and nothing is presented as being for the child; a neutral note and explicit browsing are offered. **Older than 60 months**: the last range, with an explanation that the ideas go up to age 5.
- A range's supporting records may come from its upper bound (for example 6-month milestones for “Birth to under 6 months”), because CDC milestones describe what most children do *by* that age.

## Validation (`validateGoalIdeas`, at build time and in unit tests)
Six contiguous ranges with the boundaries above · 8–12 ideas per range · unique ids · titles 1–80 characters, gender-neutral, not naming CDC, with no schedule, deadline or expectation wording, and not identical to a milestone or activity title · every idea has at least one supporting record, each of which exists and is for an age in the range · the idea's area matches a supporting record.

## Mapping

### Birth to under 6 months (11 ideas)
| Id | Idea (app-written) | Area | Supporting milestones | Supporting activities |
|---|---|---|---|---|
| gi-r0-6-01 | Get comfortable with tummy time | Gross motor | cdc22-m02-mp-01 (by 2 months): Holds head up when on tummy<br>cdc22-m04-mp-05 (by 4 months): Pushes up onto elbows/forearms when on tummy | cdc22-act-a004 “Tummy time with toys” (2 months) — safety notes shown<br>cdc22-act-a019 “Floor play every day” (4, 6 months) |
| gi-r0-6-02 | Share back-and-forth “conversations” with sounds and smiles | Language & communication | cdc22-m04-lc-02 (by 4 months): Makes sounds back when you talk to them<br>cdc22-m06-lc-01 (by 6 months): Takes turns making sounds with you | cdc22-act-a001 “Back-and-forth “talking”” (2, 4 months)<br>cdc22-act-a017 “Sound conversations” (4 months) |
| gi-r0-6-03 | Make talking, reading and singing part of our day | Language & communication | cdc22-m04-lc-03 (by 4 months): Turns head towards the sound of your voice | cdc22-act-a002 “Talk, read and sing” (2 months)<br>cdc22-act-a011 “Talk, read and sing” (4 months) |
| gi-r0-6-04 | Enjoy calm cuddle time together | Social & emotional | cdc22-m02-se-01 (by 2 months): Calms down when spoken to or picked up | cdc22-act-a003 “Cuddling and holding” (2 months) |
| gi-r0-6-05 | Practice holding and reaching for easy-to-hold toys | Fine motor | cdc22-m04-mp-02 (by 4 months): Holds a toy when you put it in their hand<br>cdc22-m06-cg-02 (by 6 months): Reaches to grab a toy they want | cdc22-act-a012 “Easy-to-hold toys” (4 months) |
| gi-r0-6-06 | Watch a moving toy together | Cognitive | cdc22-m02-cg-01 (by 2 months): Watches you as you move<br>cdc22-m02-cg-02 (by 2 months): Looks at a toy for several seconds | cdc22-act-a013 “Follow the moving toy” (4 months) |
| gi-r0-6-07 | Listen for sounds together, like a rattle | Cognitive | cdc22-m02-lc-02 (by 2 months): Reacts to loud sounds | cdc22-act-a005 “Find the rattle sound” (2 months) |
| gi-r0-6-08 | Share laughs with peek-a-boo | Social & emotional | cdc22-m04-se-02 (by 4 months): Chuckles (not yet a full laugh) when you try to make them laugh<br>cdc22-m06-se-03 (by 6 months): Laughs | cdc22-act-a016 “Peek-a-boo” (4 months) |
| gi-r0-6-09 | Reach and kick during floor play | Gross motor | cdc22-m02-mp-02 (by 2 months): Moves both arms and both legs<br>cdc22-m04-mp-03 (by 4 months): Uses their arm to swing at toys | cdc22-act-a010 “Reach and kick play” (4 months) — safety notes shown<br>cdc22-act-a019 “Floor play every day” (4, 6 months) |
| gi-r0-6-10 | Work toward rolling from tummy to back | Gross motor | cdc22-m06-mp-01 (by 6 months): Rolls from tummy to back | cdc22-act-a027 “Roll to reach toys” (6 months) — safety notes shown |
| gi-r0-6-11 | Look in a baby-safe mirror together | Social & emotional | cdc22-m06-se-02 (by 6 months): Likes to look at self in a mirror | cdc22-act-a008 “Mirror time” (2 months) — safety notes shown |

### 6 to under 12 months (12 ideas)
| Id | Idea (app-written) | Area | Supporting milestones | Supporting activities |
|---|---|---|---|---|
| gi-r6-12-01 | Practice sitting, with support at first | Gross motor | cdc22-m06-mp-03 (by 6 months): Leans on hands to support themselves when sitting<br>cdc22-m09-mp-04 (by 9 months): Sits without support | cdc22-act-a028 “Supported sitting” (6 months) — safety notes shown |
| gi-r6-12-02 | Reach toys by crawling, scooting or rolling | Gross motor | — | cdc22-act-a033 “Crawl, scoot or roll to reach toys” (9 months) — safety notes shown |
| gi-r6-12-03 | Find safe places to pull up to stand | Gross motor | cdc22-m12-mp-01 (by 1 year): Pulls up to stand<br>cdc22-m12-mp-02 (by 1 year): Walks, holding on to furniture | cdc22-act-a043 “Safe places to pull up” (9 months) — safety notes shown |
| gi-r6-12-04 | Learn to wave “bye-bye” or a simple sign | Language & communication | cdc22-m12-lc-01 (by 1 year): Waves “bye-bye” | cdc22-act-a034 “Wave “bye-bye” and simple signs” (9 months) |
| gi-r6-12-05 | Take turns babbling, and add simple words | Language & communication | cdc22-m09-lc-01 (by 9 months): Makes a lot of different sounds like “mamamama” and “bababababa” | cdc22-act-a032 “Repeat sounds, add words” (9 months) |
| gi-r6-12-06 | Play peek-a-boo with a cloth | Social & emotional | cdc22-m09-se-05 (by 9 months): Smiles or laughs when you play peek-a-boo | cdc22-act-a035 “Peek-a-boo with a cloth” (9 months) |
| gi-r6-12-07 | Look for a hidden toy together | Cognitive | cdc22-m09-cg-01 (by 9 months): Looks for objects when dropped out of sight (like a spoon or toy)<br>cdc22-m12-cg-02 (by 1 year): Looks for things they see you hide, like a toy under a blanket | cdc22-act-a041 “Find the hidden toy” (9 months) |
| gi-r6-12-08 | Practice putting things in a container and taking them out | Fine motor | cdc22-m12-cg-01 (by 1 year): Puts something in a container, like a block in a cup | cdc22-act-a036 “Dump and fill” (9 months) |
| gi-r6-12-09 | Play with blocks and toys that use both hands | Fine motor | cdc22-m09-mp-02 (by 9 months): Moves things from one hand to the other hand | cdc22-act-a049 “Blocks and hand toys” (12 months) |
| gi-r6-12-10 | Name the pictures in books together | Language & communication | — | cdc22-act-a038 ““Read” by naming pictures” (9 months) |
| gi-r6-12-11 | Put feelings into words together | Social & emotional | cdc22-m09-se-02 (by 9 months): Shows several facial expressions, like happy, sad, angry, and surprised | cdc22-act-a042 “Naming feelings” (9 months) |
| gi-r6-12-12 | Make music by banging pots and pans | Cognitive | cdc22-m09-cg-02 (by 9 months): Bangs two things together | cdc22-act-a047 “Pots-and-pans music” (12 months) |

### 12 to under 24 months (11 ideas)
| Id | Idea (app-written) | Area | Supporting milestones | Supporting activities |
|---|---|---|---|---|
| gi-r12-24-01 | Practice walking, with a helping hand or a push toy | Gross motor | cdc22-m15-mp-01 (by 15 months): Takes a few steps on their own<br>cdc22-m18-mp-01 (by 18 months): Walks without holding on to anyone or anything | cdc22-act-a050 “Push toys for walking practice” (12 months) — safety notes shown<br>cdc22-act-a051 “Walking practice” (12 months) — safety notes shown |
| gi-r12-24-02 | Learn a few new words | Language & communication | cdc22-m15-lc-01 (by 15 months): Tries to say one or two words besides “mama” or “dada,” like “ba” for ball or “da” for dog<br>cdc22-m18-lc-01 (by 18 months): Tries to say three or more words besides “mama” or “dada” | cdc22-act-a052 “Repeat and add to words” (15 months)<br>cdc22-act-a053 “Name it and wait” (15 months) |
| gi-r12-24-03 | Point to and name body parts | Language & communication | cdc22-m24-lc-03 (by 2 years): Points to at least two body parts when you ask them to show you | cdc22-act-a071 “Name body parts” (18 months) |
| gi-r12-24-04 | Stack blocks and knock them down | Fine motor | cdc22-m15-cg-02 (by 15 months): Stacks at least two small objects, like blocks | cdc22-act-a057 “Stack and knock down blocks” (15 months) |
| gi-r12-24-05 | Help with simple everyday tasks | Social & emotional | cdc22-m18-cg-01 (by 18 months): Copies you doing chores, like sweeping with a broom | cdc22-act-a054 “Everyday helper” (15 months) |
| gi-r12-24-06 | Look at picture books together | Language & communication | cdc22-m18-se-04 (by 18 months): Looks at a few pages in a book with you<br>cdc22-m24-lc-01 (by 2 years): Points to things in a book when you ask, like “Where is the bear?” | cdc22-act-a074 “Picture books with simple words” (18 months) |
| gi-r12-24-07 | Enjoy pretend feeding play | Cognitive | cdc22-m24-cg-03 (by 2 years): Plays with more than one toy at the same time, like putting toy food on a toy plate | cdc22-act-a067 “Pretend feeding play” (18 months) |
| gi-r12-24-08 | Sing songs with actions | Language & communication | cdc22-m24-lc-04 (by 2 years): Uses more gestures than just waving and pointing, like blowing a kiss or nodding yes | cdc22-act-a056 “Songs with gestures” (15 months) |
| gi-r12-24-09 | Try scribbling with crayons | Fine motor | cdc22-m18-mp-02 (by 18 months): Scribbles | cdc22-act-a085 “Crayons and finger paint” (24 months) |
| gi-r12-24-10 | Kick, roll and throw a ball together | Gross motor | cdc22-m24-mp-01 (by 2 years): Kicks a ball | cdc22-act-a080 “Kick, roll and throw balls” (24 months) |
| gi-r12-24-11 | Talk about how other people feel | Social & emotional | cdc22-m24-se-01 (by 2 years): Notices when others are hurt or upset, like pausing or looking sad when someone is crying | cdc22-act-a068 “Noticing others’ feelings” (18, 48 months) |

### 24 to under 36 months (12 ideas)
| Id | Idea (app-written) | Area | Supporting milestones | Supporting activities |
|---|---|---|---|---|
| gi-r24-36-01 | Learn the names of a few colors | Cognitive | cdc22-m30-cg-04 (by 30 months): Shows they know at least one color, like pointing to a red crayon when you ask, “Which one is red?” | cdc22-act-a100 “Name colors, body parts and pictures” (30 months) |
| gi-r24-36-02 | Help with a simple chore, like putting toys in a basket | Social & emotional | cdc22-m30-se-03 (by 30 months): Follows simple routines when told, like helping to pick up toys when you say, “It’s clean-up time.” | cdc22-act-a083 “Simple chores” (24 months) |
| gi-r24-36-03 | Do simple puzzles together | Cognitive | — | cdc22-act-a087 “Simple puzzles” (24, 30 months) |
| gi-r24-36-04 | Draw lines and circles | Fine motor | cdc22-m36-cg-01 (by 3 years): Draws a circle, when you show them how | cdc22-act-a095 “Drawing lines and circles” (30 months) |
| gi-r24-36-05 | Practice playing with other children | Social & emotional | cdc22-m30-se-01 (by 30 months): Plays next to other children and sometimes plays with them | cdc22-act-a094 “Learning to play together” (30 months) |
| gi-r24-36-06 | Ask and answer “who,” “what” and “where” questions | Language & communication | cdc22-m36-lc-02 (by 3 years): Asks “who,” “what,” “where,” or “why” questions, like “Where is mommy/daddy?” | cdc22-act-a093 “Who, what and where questions” (30 months) |
| gi-r24-36-07 | Make reading and library visits part of our routine | Language & communication | cdc22-m30-lc-03 (by 30 months): Names things in a book when you point and ask, “What is this?” | cdc22-act-a103 “Reading and library visits” (30 months) |
| gi-r24-36-08 | Pretend play with a big box | Cognitive | cdc22-m30-cg-01 (by 30 months): Uses things to pretend, like feeding a block to a doll as if it were food | cdc22-act-a099 “Big-box pretend play” (30 months) |
| gi-r24-36-09 | Climb and run in safe places at the park | Gross motor | cdc22-m24-mp-02 (by 2 years): Runs | cdc22-act-a098 “Climbing and running at the park” (30 months) — safety notes shown |
| gi-r24-36-10 | Take turns kicking a ball to each other | Gross motor | cdc22-m24-mp-01 (by 2 years): Kicks a ball | cdc22-act-a101 “Kick a ball back and forth” (30 months) |
| gi-r24-36-11 | Play follow-the-leader | Gross motor | — | cdc22-act-a102 “Follow the leader” (30 months) |
| gi-r24-36-12 | Practice taking off loose clothes | Fine motor | cdc22-m30-mp-02 (by 30 months): Takes some clothes off by themselves, like loose pants or an open jacket | — |

### 36 to under 48 months (12 ideas)
| Id | Idea (app-written) | Area | Supporting milestones | Supporting activities |
|---|---|---|---|---|
| gi-r36-48-01 | Talk about stories after reading them | Language & communication | cdc22-m48-cg-02 (by 4 years): Tells what comes next in a well-known story | cdc22-act-a108 “Talk about the story” (36 months) |
| gi-r36-48-02 | Find words for feelings | Social & emotional | cdc22-m48-se-03 (by 4 years): Comforts others who are hurt or sad, like hugging a crying friend | cdc22-act-a107 “Words for feelings” (36 months) |
| gi-r36-48-03 | Play counting games | Cognitive | — | cdc22-act-a109 “Counting games” (36 months) |
| gi-r36-48-04 | Follow two- and three-step instructions | Language & communication | — | cdc22-act-a112 “Two- and three-step instructions” (36 months) |
| gi-r36-48-05 | Help make a meal, like washing fruit or stirring | Fine motor | cdc22-m48-mp-02 (by 4 years): Serves themselves food or pours water, with adult supervision | cdc22-act-a111 “Helping make meals” (36 months) — safety notes shown |
| gi-r36-48-06 | Squish, roll and shape playdough | Fine motor | — | cdc22-act-a116 “Playdough” (36 months) |
| gi-r36-48-07 | Enjoy playtime with other children | Social & emotional | cdc22-m36-se-02 (by 3 years): Notices other children and joins them to play | cdc22-act-a115 “Playing with other children” (36 months) |
| gi-r36-48-08 | Play matching games | Cognitive | — | cdc22-act-a118 “Matching games” (36 months) |
| gi-r36-48-09 | Get ready for a new place, like childcare | Social & emotional | cdc22-m36-se-01 (by 3 years): Calms down within 10 minutes after you leave them, like at a childcare drop off | cdc22-act-a120 “Getting ready for new places” (36, 48 months) |
| gi-r36-48-10 | Say their first name and age | Language & communication | cdc22-m36-lc-04 (by 3 years): Says first name, when asked | cdc22-act-a121 “Name and age” (36 months) |
| gi-r36-48-11 | Play outside, with your child leading | Gross motor | — | cdc22-act-a119 “Outdoor play, child leads” (36 months) |
| gi-r36-48-12 | String large beads or macaroni | Fine motor | cdc22-m36-mp-01 (by 3 years): Strings items together, like large beads or macaroni | — |

### 48 to 60 months (12 ideas)
| Id | Idea (app-written) | Area | Supporting milestones | Supporting activities |
|---|---|---|---|---|
| gi-r48-60-01 | Play games with rules and turns | Cognitive | cdc22-m60-se-01 (by 5 years): Follows rules or takes turns when playing games with other children | cdc22-act-a145 “Games with rules” (60 months) |
| gi-r48-60-02 | Play rhyming games | Language & communication | cdc22-m60-lc-04 (by 5 years): Uses or recognizes simple rhymes (bat-cat, ball-tall) | cdc22-act-a144 “Rhyming games” (60 months) |
| gi-r48-60-03 | Tell a story from the pictures in a book | Language & communication | cdc22-m60-lc-01 (by 5 years): Tells a story they heard or made up with at least two events. For example, a cat was stuck in a tree and a firefighter saved it | cdc22-act-a146 “Telling the story from pictures” (60 months) |
| gi-r48-60-04 | Talk about colors, shapes and sizes | Cognitive | cdc22-m48-cg-01 (by 4 years): Names a few colors of items | cdc22-act-a123 “Colors, shapes and sizes” (48 months) |
| gi-r48-60-05 | Count everyday things together | Cognitive | cdc22-m60-cg-01 (by 5 years): Counts to 10 | cdc22-act-a127 “Counting things” (48 months) |
| gi-r48-60-06 | Help with chores, like matching socks | Social & emotional | cdc22-m60-se-03 (by 5 years): Does simple chores at home, like matching socks or clearing the table after eating | cdc22-act-a131 “Helping with chores” (48 months) |
| gi-r48-60-07 | Practice doing buttons and other things on their own | Fine motor | cdc22-m60-mp-01 (by 5 years): Buttons some buttons | cdc22-act-a142 “Doing it themselves” (60 months) |
| gi-r48-60-08 | Make art with crayons, paper and child scissors | Fine motor | cdc22-m48-cg-03 (by 4 years): Draws a person with three or more body parts | cdc22-act-a149 “Creative art box” (60 months) — safety notes shown |
| gi-r48-60-09 | Make time for active play they choose | Gross motor | — | cdc22-act-a137 “Active play every day” (48, 60 months) |
| gi-r48-60-10 | Dance together and copy each other’s moves | Gross motor | cdc22-m60-se-02 (by 5 years): Sings, dances, or acts for you | cdc22-act-a133 “Dance and copy moves” (48 months) |
| gi-r48-60-11 | Get ready for kindergarten | Social & emotional | — | cdc22-act-a153 “Getting ready for kindergarten” (60 months) |
| gi-r48-60-12 | Use words about time, like today and tomorrow | Cognitive | cdc22-m60-cg-03 (by 5 years): Uses words about time, like “yesterday,” “tomorrow,” “morning,” or “night” | cdc22-act-a141 “Words about time” (60 months) |

**Total:** 70 ideas.

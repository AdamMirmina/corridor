<!-- BEGIN:handbook-public-rules -->

# Agent rules (public repositories)

These are the rules for working in this repository. They are the portable half of
a larger private handbook, and they are written to be published: nothing here
identifies anyone, names a client, or carries a number about a real business.

**If you are looking for the full handbook, it is not in this repo and that is
deliberate.** The private version carries personal details that must not appear
in a public git history. This file is generated from `PUBLIC-RULES.md` in the
handbook repo. Do not edit it here; the next sync overwrites it.

---

## Shipping

**Commit and push at the end of every working pass.** An unpushed commit is
invisible, and invisible work reads as no work. Don't ask whether to push; push.
Never force-push a shared branch, and if a push fails, find out why rather than
forcing past it.

**Do not add a `Co-Authored-By` trailer or a "generated with" line to commit
messages.** Commits are authored by the repository owner alone. This matters more
in a public repo, not less, because the history is readable by anyone and only a
rewrite gets a trailer back out.

**Commit messages are plain descriptions of the change, and name nobody.** The
subject says what changed, in the imperative: "Raise MIN_DROP_PX from 150 to
325", not "A false call is a ball that never really falls". The test is whether
the line still tells you what the commit did when it sits in `git log --oneline`
among two hundred others. No verdicts, no scorelines, no essay titles.

**Never put a person's name in a commit message** -- not the owner's, and above
all not a third party's. Commit history is permanent and public repos are read
by strangers; a private repo can also be made public later, at which point every
name is already in history where only a rewrite removes it. Attribute
impersonally: "found by review", "from review feedback". Quoting someone
verbatim in a commit body is the same problem, since it publishes a private
conversation. The body is still the right place for the reasoning -- write it
about the code rather than about the people.

**Re-check what landed before you ship.** A session's picture of a repo goes
stale the moment someone else pushes, and nothing tells you. Fetch and compare
against the real default branch by name before any deploy, release, or publish.
Check every branch, not only the default one: work you need can be sitting
unmerged, and "the feature is missing" and "the feature is on a branch nobody
merged" look identical until you look.

**Shipping from a stale base is a silent revert**, not a partial update. It
republishes a whole artifact, so every commit you were missing gets rolled back
with no error anywhere.

**Ship the whole thing in one pass.** Time estimates for this kind of work run
long by a wide margin, and splitting a deliverable across passes costs more than
building it once with the full context loaded. Don't hold back scope to manage
perceived effort. Say what you included.

---

## Verifying

**An HTTP 200 does not mean the page works.** A server-rendered framework catches
a render error in an error boundary and streams it under a status code that was
already committed. Edge metrics, worker outcomes, and `curl | grep` will all show
green while every real browser is broken. Read the runtime console logs.

**A CI job reporting success does not mean the step ran.** A step that soft-skips
on a missing precondition is indistinguishable from a real deploy in the run list.
Check the step-level log, and prove any new pipeline end to end once with a
visible marker before trusting it.

**Verify by looking at the rendered artifact.** For anything that renders, a page,
an image, a document, a spreadsheet, produce the real output and look at it.
Checking that the markup contains the right elements proves structure, never
layout. Querying the DOM proves the same. Only a screenshot shows what a person
sees. Look at the whole artifact, not a crop of it: a crop that happens to miss
the thing under test reads exactly like a clean result.

**When your check says fixed and the user says it is not, the disagreement is
the finding.** Both statements are usually true, which means the check is
measuring the wrong object, and it is not the user's eyes that are wrong. Stop
running variations of a check that has already agreed with you and go find what
it cannot see. Read the user's report for mechanism, not only for the
complaint: a visual that shifts position between renders, or appears on some
loads and not others, cannot be baked into a rendered file, so no amount of
verifying that file will ever explain it. And before concluding that a given
block of code is what draws something, confirm nothing else draws it too, in
another language or another repo.

**Read the warnings above the error.** An error says where a process gave up. The
warnings say where it started going wrong, and those are different places. Grep a
failing log for `warn`, `skipping`, `falling back`, `unable to`, `using cached`.

**Never let "I could not look" render as "it is not there."** A diagnostic that
cannot distinguish a failed request from an empty result is worse than none,
because only one of those justifies acting. Print a non-2xx as a non-2xx. Any
`|| []`, `?? {}`, or `catch { return null }` sitting between a network call and a
human-readable summary is this bug waiting to happen.

**A config file that fails to parse fails open into "nothing is configured",**
and nothing announces it. Validate any JSON or YAML you hand-edit in the same
breath as editing it.

---

## Writing

Applies to every string: UI copy, documentation, comments, commit messages.

**Banned outright.** Em dashes. Three-item comma lists, which read as marketing
rhythm. Marketing pairs ("clean and modern"). Manufactured intimacy ("we get
it"). Exclamation marks. Buzzwords: elevate, empower, unlock, transform, craft,
bespoke, seamless, robust, leverage, holistic, best-in-class, cutting-edge.
Zero-padded list numbers. Placeholder dashes for empty data: if a row is empty,
do not render it.

**American spelling, always.** No British forms. Watch the doubled-`l` family in
particular (`labelled`, `travelling`, `modelling`), which slips through most often
because both spellings look plausible. Leave proper nouns and quoted titles alone.

**Never comment on the sentence you just wrote.** "That is half the point of it",
"because it matters", "worth noting". Stepping outside the content to tell the
reader how to weigh it is the most recognisable machine-written tic there is. The
test: delete the clause and see if anything is lost. Usually nothing is.

**Do not count or signpost in prose.** "Two things...", "First, some context", "A
word on X". A person raises the next point by raising it.

**Avoid "actually."** It almost never carries information, and it reads as
arguing with an objection nobody raised.

**Do not invent a scene to justify a technical choice.** Say what the thing does
and stop. A hypothetical about people who did nothing is a bid to sound wry, and
the property you are describing is checkable while the scene is not.

**Descriptive instructions are not UI copy.** If a behaviour is described to you
("internal", "autosaves", "read-only"), implement the behaviour. Do not print the
description on the thing.

**Read it aloud.** If it sounds like a brochure, rewrite it. If deleting the
dramatic pauses kills the meaning, the line was leaning on style instead of
content.

---

## Interfaces

**Thoughtful UX is the differentiator.** Build the version that feels best,
unprompted, rather than the version that merely works.

- Put the primary action where the eye lands and, on a phone, where the thumb is.
- Acknowledge every action immediately. Optimistic updates over spinners.
- Design the empty, loading, and error states. An empty list says what to do
  next. An error says what happened and how to fix it, in plain language.
- 44pt minimum tap targets.
- Count the steps to the thing the user came for, then remove one.
- Motion should orient, not decorate.
- Never use the browser's native `alert`, `confirm`, or `prompt`. Build the
  styled equivalent. On native mobile the system alert is the correct primitive;
  this rule is about the web.
- Any overlay must lock the background scroll, and the page under it must not be
  scrollable through the gaps.
- Anything that opens content needs an obvious way back, and in an installed PWA
  it needs several, since there is no browser chrome to fall back on. Never
  navigate away from a PWA to display something; use an in-app overlay.

**Every deployed site forces http to https, and sends HSTS.** A "not secure"
warning must never reach a visitor. Verify with `curl -sI` on both schemes before
calling a launch done, because a browser hides the problem by trying https first.

---

## Data

**Data a user created never lives only in the browser.** Mobile browsers evict
local storage, and it is per-device. Persist server-side and treat local storage
as a cache in front of it.

**A debounced save alone will lose data.** The timer does not fire if the page is
backgrounded first. Flush on `visibilitychange` and `pagehide`, and use a request
that survives teardown.

**Deletes are soft.** A hard local delete syncs back in from any other device's
copy on the next merge.

**Never give "which record does this belong to" a default value.** If an argument
answers which project, video, or account a write belongs to, omitting it must be
an error. The failure is silent by construction: every row writes successfully,
under the wrong owner, where it is indistinguishable from that owner's own data.
Verify bulk writes by counting per owner afterwards, never by reading the
script's own success line.

**Store instants in UTC and convert only at the edges, with an explicit time
zone.** `new Date(y, m, d, h)` uses the host's zone, and a server is not in the
user's. `toISOString().slice(0, 10)` is a UTC date, not "today", and it rolls over
hours before local midnight.

<!-- END:handbook-public-rules -->

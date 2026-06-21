# OCaml Static Site Rewrite Plan

## Goal

Rewrite the current React/Vim-style portfolio into a tiny OCaml-generated static site inspired by `https://chshersh.com/`.

The target is a dark, precise, text-first personal site with two main sections:

- About
- Blog

Blog posts should open inside the website itself, not on Dev.to, Hashnode, or another external platform.

## Core Model

You are building a static site generator.

```text
Markdown content -> OCaml generator -> HTML/CSS/static files -> Cloudflare Worker serves build/
```

Markdown is the source of truth.

OCaml is the compiler.

HTML/CSS is the generated artifact.

Cloudflare is the file server.

OCaml does not run in the browser. OCaml also does not need to run on Cloudflare at request time. It only runs during the build step.

## Source World

These are files you edit by hand.

```text
content/
  about.md
  posts/
    reliable-backend-code.md
    boring-systems.md

assets/
  style.css

static/
  resume.pdf
```

## Generated World

These are files produced by the OCaml generator.

```text
build/
  index.html
  blog/
    reliable-backend-code/
      index.html
    boring-systems/
      index.html
  assets/
    style.css
  resume.pdf
```

Do not hand-edit `build/`. Treat it like compiler output.

## What To Search

Useful topics:

```text
OCaml dune project tutorial
OCaml read file
OCaml write file
OCaml list directory files
OCaml mkdir recursive
OCaml cmarkit markdown html
OCaml yaml frontmatter
OCaml static site generator
Cloudflare Workers static assets wrangler.toml
Cloudflare wrangler assets directory
GitHub Actions setup OCaml opam
```

Useful libraries to research:

```text
dune
bos
fpath
logs
cmarkit
ptime
alcotest
```

Minimal stack:

```text
dune
cmarkit
```

Nicer stack:

```text
dune
bos
fpath
cmarkit
```

## Generator Flow

The build command should do this:

```text
1. Start program
2. Remove old build/ or recreate its contents
3. Read content/about.md
4. Read all content/posts/*.md
5. Parse frontmatter from every Markdown file
6. Convert Markdown body to HTML
7. Sort posts newest first
8. Render homepage HTML
9. Render blog post pages
10. Copy assets/style.css to build/assets/style.css
11. Copy static/resume.pdf to build/resume.pdf
12. Exit successfully
```

The final result is normal static files. Cloudflare does not know or care that OCaml generated them.

## Target Repo Shape

```text
.
├── bin/
│   ├── dune
│   └── main.ml
├── lib/
│   ├── dune
│   ├── content.ml
│   ├── content.mli
│   ├── markdown.ml
│   ├── markdown.mli
│   ├── post.ml
│   ├── post.mli
│   ├── render.ml
│   ├── render.mli
│   ├── routes.ml
│   ├── routes.mli
│   ├── site.ml
│   └── site.mli
├── content/
│   ├── about.md
│   └── posts/
│       ├── reliable-backend-code.md
│       └── first-post.md
├── assets/
│   └── style.css
├── static/
│   └── resume.pdf
├── build/
├── dune-project
├── profile.opam
├── wrangler.toml
└── .github/
    └── workflows/
        └── deploy.yml
```

## Files To Delete From Current React App

Since the rewrite is full replacement, remove the React/CRA app:

```text
src/
public/
tailwind.config.js
postcss.config.js
bun.lock
package.json if not needed
node_modules/
React dependencies
CRA files
```

Keep or move useful static files:

```text
public/resume.pdf -> static/resume.pdf
public/logo.png -> static/logo.png, if wanted
```

Current `wrangler.toml` already points to `build/`:

```toml
name="shams"
compatibility_date="2025-10-10"
assets = { directory = "build"}
```

That is good. The OCaml generator can emit to `build/`, and Wrangler can serve it.

## OCaml Project Setup

Create a Dune project with:

```text
dune-project
profile.opam
bin/dune
lib/dune
```

Search:

```text
dune executable public_name
dune library stanza
opam dune cmarkit yaml
```

The executable entrypoint should stay tiny:

```ocaml
let () = Site.build ()
```

All real logic should live in `lib/`.

## Markdown Format

Blog posts should use frontmatter.

```markdown
---
title: "The Shape of Reliable Backend Code"
date: "2026-06-21"
slug: "reliable-backend-code"
tags: ["backend", "systems"]
summary: "Notes on making backend code boring in the useful way."
draft: false
---

Production code is mostly about reducing surprise.

A good service has visible edges:

- input
- state
- output
- failure

Everything else is negotiation.
```

About page can be simpler:

```markdown
---
title: "About"
---

Hi, I'm Amr.

I build backend systems, internal tools, and software that survives contact with production.

I like explicit state, small interfaces, typed edges, boring databases, and code that can be deleted.
```

## Frontmatter Rules

For blog posts, require:

```text
title
date
slug
draft
```

Optional fields:

```text
tags
summary
```

Rules:

```text
draft: true means do not publish
slug becomes URL path
summary appears in blog list if present
tags appear under the title
```

Failure cases should fail the build clearly:

```text
missing opening ---
missing closing ---
invalid YAML
missing title
missing slug
invalid date
duplicate slug
```

Bad content should not silently deploy.

## Data Types

In `post.ml`, model blog content.

```ocaml
type meta = {
  title : string;
  date : string;
  slug : string;
  tags : string list;
  summary : string option;
  draft : bool;
}

type t = {
  meta : meta;
  body_html : string;
}
```

For the about page:

```ocaml
type page = {
  title : string;
  body_html : string;
}
```

Later, these can be generalized. Do not overbuild early.

## Content Parsing

`content.ml` should do three things:

```text
read file
split frontmatter from Markdown body
turn frontmatter into typed OCaml values
```

Frontmatter splitting algorithm:

```text
1. File must start with ---
2. Find next ---
3. Everything between is YAML
4. Everything after is Markdown body
```

Search:

```text
OCaml split string
OCaml yaml parse
OCaml Result error handling
```

For a personal generator, exceptions are acceptable. `Result` is cleaner if you want stricter code.

## Markdown Rendering

`markdown.ml` should expose one function:

```ocaml
val to_html : string -> string
```

Internally, use `cmarkit` or `omd`.

Recommended search:

```text
cmarkit OCaml render HTML
cmarkit markdown to html
omd markdown to html OCaml
```

If `cmarkit` feels annoying, use `omd`. The generator is small, so perfect CommonMark compliance is not critical for v1.

## HTML Rendering

`render.ml` should create HTML strings.

Do not build a complex templating engine at first.

Useful functions:

```ocaml
val layout :
  title:string ->
  description:string ->
  current:string ->
  body:string ->
  string

val home :
  about_html:string ->
  posts:Post.t list ->
  string

val post :
  post:Post.t ->
  string
```

The layout should include:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>...</title>
  <meta name="description" content="...">
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  ...
</body>
</html>
```

Escape user-controlled text in titles, summaries, and tags.

Markdown body HTML is already HTML output from the Markdown renderer, so do not escape it again.

## Routes

`routes.ml` should centralize paths.

```ocaml
let build_dir = "build"

let index_output = "build/index.html"

let post_url slug =
  "/blog/" ^ slug ^ "/"

let post_output slug =
  "build/blog/" ^ slug ^ "/index.html"
```

Centralize routes because links and output paths must agree.

This link:

```html
<a href="/blog/reliable-backend-code/">
```

must match this generated file:

```text
build/blog/reliable-backend-code/index.html
```

## Site Build Module

`site.ml` is the conductor.

Pseudo-flow:

```ocaml
let build () =
  prepare_build_dir ();
  let about = Content.read_about "content/about.md" in
  let posts = Content.read_posts "content/posts" in
  let published_posts =
    posts
    |> List.filter (fun p -> not p.meta.draft)
    |> sort_newest_first
  in
  write_file "build/index.html" (Render.home ~about ~posts:published_posts);
  List.iter render_post published_posts;
  copy_assets ();
  copy_static ()
```

Keep this module boring and explicit.

## Build Directory Strategy

Simplest first implementation:

```text
delete build/
recreate build/
generate everything
```

Search:

```text
OCaml remove directory recursively
OCaml Unix.mkdir
OCaml Sys.file_exists
OCaml Bos.OS.Dir
```

If recursive delete is annoying, use the `bos` library.

Avoid leaving stale files in `build/`.

## Asset Copying

Copy:

```text
assets/style.css -> build/assets/style.css
static/resume.pdf -> build/resume.pdf
```

Search:

```text
OCaml copy file
Bos.OS.File.copy
```

Later static files can include:

```text
static/favicon.ico
static/logo.png
static/og-image.png
```

Everything in `static/` can be copied to the root of `build/`.

Everything in `assets/` can be copied to `build/assets/`.

## Homepage Content Design

Target homepage should be one-screen-ish, not a modern portfolio.

Concept:

```text
AMR SHAMS

Backend engineer.
Systems, types, text, boring reliable software.

[ga About] [gb Blog]

────────────────────────────────

About content or blog list

────────────────────────────────

h GitHub   l LinkedIn   x X/Twitter   e Email   cv Resume
```

For v1, static stacked sections are best:

```text
header
about
blog
footer
```

Shortcut labels can be visual only:

```text
ga / about
gb / blog
```

No JavaScript is required for v1.

## Blog List Design

Render every post like:

```html
<a class="post-row" href="/blog/reliable-backend-code/">
  <span class="post-title">{The Shape of Reliable Backend Code}</span>
  <span class="post-date">2026-06-21</span>
  <span class="post-summary">Notes on making backend code boring...</span>
</a>
```

Visual target:

```text
{The Shape of Reliable Backend Code}
2026-06-21
Notes on making backend code boring in the useful way.
```

The latest post can show `NEW`.

## Blog Post Design

Generated page:

```text
AMR SHAMS / BLOG

{The Shape of Reliable Backend Code}
2026-06-21
backend / systems

────────────────────────

Markdown-rendered body

────────────────────────

← all posts
```

Use the same layout and CSS as the homepage.

## CSS Direction

Use a single handcrafted stylesheet.

Search:

```text
CSS custom properties dark theme
CSS monospace website
CSS responsive max width
CSS custom scrollbar
CSS focus-visible
```

Core variables:

```css
:root {
  --bg: #1e1e1e;
  --panel: #121212;
  --text: #e2e2e2;
  --muted: #919191;
  --yellow: #ffc107;
  --blue: #569cd6;
  --border: #2a2a2a;
}
```

Core layout:

```css
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "JetBrains Mono", monospace;
}

.site {
  max-width: 880px;
  margin: 0 auto;
  padding: 32px 16px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
}
```

Keep it sharp:

```text
no gradients
no glassmorphism
no card grid
no hero blobs
no generic portfolio layout
```

## Autistic / Systemized Direction

Express this through structure, not stereotypes.

Use:

```text
explicit structure
short factual sentences
fixed vocabulary
predictable layout
keyboard hints
monospace
low animation
no marketing tone
strong boundaries between sections
calm color contrast
dense but readable information
```

Example copy direction:

```text
I like software with edges.

Input.
State.
Output.
Failure.

If I cannot name the edge, I probably cannot maintain it.
```

Avoid turning autism into decoration. Let the systemized structure carry the feeling.

## Accessibility

Do not sacrifice accessibility for the aesthetic.

Include:

```text
semantic HTML
proper headings
visible focus states
readable contrast
normal anchor links
mobile viewport
```

Use:

```html
<main>
<section>
<article>
<nav>
<footer>
```

Every page should work without JavaScript.

## Cloudflare Deployment

Current deployment model uses Wrangler static assets:

```toml
assets = { directory = "build"}
```

So after OCaml generates:

```text
build/index.html
build/blog/foo/index.html
build/assets/style.css
```

Cloudflare serves those files.

There is no runtime OCaml server.

Current workflow:

```text
checkout repo
bun install
bun run build
wrangler deploy
```

New workflow:

```text
checkout repo
install OCaml/opam
install dependencies
run dune exec bin/main.exe
run wrangler deploy
```

Search:

```text
GitHub Actions setup OCaml
ocaml/setup-ocaml GitHub Action
opam install deps GitHub Actions
Cloudflare wrangler action
```

Conceptual workflow:

```yaml
- checkout
- setup OCaml
- opam install . --deps-only
- dune build
- dune exec bin/main.exe
- wrangler deploy
```

## Local Commands

Expected local loop:

```bash
opam install . --deps-only
dune build
dune exec bin/main.exe
python3 -m http.server 3000 -d build
```

Then open:

```text
http://localhost:3000/
http://localhost:3000/blog/reliable-backend-code/
```

If you keep a tiny `package.json`, it can wrap these commands:

```bash
npm run build
npm run preview
```

This is optional.

## Testing Plan

Add tests after the generator works.

Search:

```text
OCaml alcotest tutorial
dune runtest
```

Useful tests:

```text
frontmatter parser parses valid post
missing title fails
missing slug fails
draft post is skipped
posts sort descending by date
post URL is /blog/slug/
post output path is build/blog/slug/index.html
HTML escaping escapes title
```

Manual tests:

```text
homepage loads
blog page loads directly
refresh on blog URL works
CSS loads
resume link works
mobile looks okay
Cloudflare deployment works
```

## Implementation Phases

### Phase 1: Skeleton

```text
create Dune project
make executable print "build ok"
wire dune exec
```

### Phase 2: Static HTML

```text
generate build/index.html from hardcoded string
copy style.css
serve locally
```

### Phase 3: Markdown About

```text
read content/about.md
parse frontmatter
render Markdown
insert into homepage
```

### Phase 4: Blog List

```text
read content/posts/*.md
parse metadata
sort by date
render links on homepage
```

### Phase 5: Blog Pages

```text
generate build/blog/<slug>/index.html for each post
link list to pages
add backlink
```

### Phase 6: Polish

```text
CSS
metadata
resume
favicon
mobile
focus states
```

### Phase 7: Deploy

```text
update GitHub Actions
verify wrangler deploy
test production URLs
```

## Common Mistakes

Avoid these:

```text
rendering Markdown in browser
keeping React for routing
making Cloudflare run OCaml at request time
committing build/
building too many features first
adding tags/RSS/search before basic pages work
using fragile string paths everywhere
not escaping titles
letting bad frontmatter silently pass
```

## Later Features

After v1 works, add:

```text
RSS/Atom feed
tags pages
syntax highlighting
previous/next post links
keyboard navigation JS
sitemap.xml
OpenGraph image
draft preview mode
```

Do not start there.

## Final Mental Model

You are building your own tiny Hugo/Jekyll, but in OCaml.

If the generated `build/` directory works with:

```bash
python3 -m http.server -d build
```

then it is basically ready for Cloudflare.

let escape_html s =
  let buf = Buffer.create (String.length s) in
  String.iter (function
    | '&' -> Buffer.add_string buf "&amp;"
    | '<' -> Buffer.add_string buf "&lt;"
    | '>' -> Buffer.add_string buf "&gt;"
    | '"' -> Buffer.add_string buf "&quot;"
    | c -> Buffer.add_char buf c
  ) s;
  Buffer.contents buf

let layout ~title ~description ~body =
  Printf.sprintf {|<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%s</title>
  <meta name="description" content="%s">
  <meta property="og:title" content="%s">
  <meta property="og:description" content="%s">
  <meta property="og:image" content="/og-image.png">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <div class="site">
%s
  </div>
  <script src="/keys.js" defer></script>
</body>
</html>
|} (escape_html title) (escape_html description)
  (escape_html title) (escape_html description) body

let home ~about_html ~posts =
  let post_rows =
    List.mapi (fun i p ->
      let meta = p.Post.meta in
      let summary =
        match meta.summary with
        | Some s -> Printf.sprintf "\n      <span class=\"sum\">%s</span>" (escape_html s)
        | None -> ""
      in
      let badge = if i = 0 then " <span class=\"new\">NEW</span>" else "" in
      Printf.sprintf {|
    <a class="row" href="%s">
      <span class="tit">%s%s</span>
      <span class="dat">%s</span>%s
    </a>|} (escape_html (Routes.post_url meta.slug))
        (escape_html meta.title) badge
        (escape_html meta.date) summary
    ) posts
  in
  let body = Printf.sprintf {|
  <header>
    <h1>AMR SHAMS</h1>
    <p class="sub">Backend engineer.<br>Systems, types, text, boring reliable software.</p>
    <nav class="nav">
      <a href="#about" data-key="ga">ga / about</a>
      <a href="#blog" data-key="gb">gb / blog</a>
    </nav>
  </header>

  <hr class="sec">

  <main class="tabs">
  <section id="about" class="tab">
    <div class="panel">
%s
    </div>
  </section>

  <section id="blog" class="tab">
    <div class="panel">
      <h2>posts</h2>
      <div class="lst">
%s
      </div>
    </div>
  </section>
  </main>

  <footer>
    <hr class="sec">
    <nav class="links">
      <a href="https://github.com/Amr-Shams" data-key="h">h GitHub</a>
      <a href="https://www.linkedin.com/in/amr-abdelmaqsoud-b5107519b/" data-key="l">l LinkedIn</a>
      <a href="https://x.com/AMR_SHAMS07" data-key="x">x X/Twitter</a>
      <a href="mailto:amr.shams2015.as@gmail.com" data-key="e">e Email</a>
      <a href="/resume.pdf" data-key="c">c Resume</a>
    </nav>
  </footer>|} about_html (String.concat "" post_rows)
  in
  layout ~title:"Amr Shams" ~description:"Backend engineer. Systems, types, text, boring reliable software." ~body

let post ~post =
  let meta = post.Post.meta in
  let tags_str =
    match meta.tags with
    | [] -> ""
    | ts -> " / " ^ String.concat " / " (List.map escape_html ts)
  in
  let meta_parts = ref [escape_html meta.date] in
  let () = match meta.last_updated with
    | Some u when u <> meta.date ->
        meta_parts := !meta_parts @ [Printf.sprintf "updated %s" (escape_html u)]
    | _ -> ()
  in
  let () = match meta.author with
    | Some a ->
        let t = match meta.author_title with
          | Some s -> ", " ^ escape_html s
          | None -> ""
        in
        meta_parts := !meta_parts @ [escape_html a ^ t]
    | None -> ()
  in
  let summary = match meta.summary with Some s -> s | None -> meta.title in
  let body = Printf.sprintf {|
  <header>
    <p class="brd">AMR SHAMS / BLOG</p>
    <h1>%s</h1>
    <p class="meta">%s%s</p>
  </header>

  <article class="panel">
%s
  </article>

  <footer>
    <hr class="sec">
    <p><a href="/" class="back">&larr; all posts</a></p>
  </footer>|}
    (escape_html meta.title)
    (String.concat " &middot; " !meta_parts)
    (if tags_str <> "" then Printf.sprintf " <span class=\"tags\">%s</span>" tags_str else "")
    post.body_html
  in
  let title = "Amr Shams / " ^ meta.title in
  layout ~title ~description:summary ~body

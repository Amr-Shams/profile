let str = Printf.sprintf

let rec delete_dir dir =
  if Sys.file_exists dir then (
    Array.iter (fun f ->
      let path = Filename.concat dir f in
      if Sys.is_directory path then delete_dir path
      else Sys.remove path
    ) (Sys.readdir dir);
    Sys.rmdir dir
  )

let rec mkdir_p dir =
  if not (Sys.file_exists dir) then (
    mkdir_p (Filename.dirname dir);
    Unix.mkdir dir 0o755
  )

let copy_file src dst =
  let ic = open_in_bin src in
  let oc = open_out_bin dst in
  let buf = Bytes.create 4096 in
  let rec loop () =
    let n = input ic buf 0 4096 in
    if n > 0 then (output oc buf 0 n; loop ())
  in
  loop (); close_in ic; close_out oc

let write_file path content =
  let oc = open_out path in
  output_string oc content;
  close_out oc

let copy_assets () =
  mkdir_p Routes.assets_dir;
  copy_file "assets/style.css" Routes.assets_output;
  print_endline "  copied assets/style.css"

let copy_static () =
  if Sys.file_exists "static" then
    Array.iter (fun f ->
      let src = Filename.concat "static" f in
      let dst = Filename.concat Routes.build_dir f in
      if not (Sys.is_directory src) then (
        copy_file src dst;
        print_endline (str "  copied static/%s" f)
      )
    ) (Sys.readdir "static")

let build () =
  print_endline "building site...";
  delete_dir Routes.build_dir;
  mkdir_p Routes.build_dir;
  print_endline "  cleaned build/";

  let about = Content.read_about "content/about.md" in
  print_endline "  read about page";

  let posts = Content.read_posts "content/posts" in
  let published =
    posts
    |> List.filter (fun p -> not p.Post.meta.draft)
    |> Post.sort_newest_first
  in
  print_endline (str "  read %d posts, %d published" (List.length posts) (List.length published));

  let index_html = Render.home ~about_html:about.body_html ~posts:published in
  write_file Routes.index_output index_html;
  print_endline "  wrote index.html";

  List.iter (fun p ->
    let slug = p.Post.meta.slug in
    let dir = Filename.dirname (Routes.post_output slug) in
    mkdir_p dir;
    let html = Render.post ~post:p in
    write_file (Routes.post_output slug) html;
    print_endline (str "  wrote blog/%s/index.html" slug)
  ) published;

  copy_assets ();
  copy_static ();
  print_endline "done!"
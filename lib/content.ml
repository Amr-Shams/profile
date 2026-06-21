open Post

let read_file file =
  In_channel.with_open_text file In_channel.input_all

let check_file_extension file =
  String.lowercase_ascii file
  |> String.ends_with ~suffix:".md"

let is_md_file file = 
  check_file_extension file && not (Sys.is_directory file)

let split_frontmatter content =
  let lines = String.split_on_char '\n' content in
  let rec loop state header body = function
    | [] ->
        Ok (String.concat "\n" (List.rev header),
            String.concat "\n" (List.rev body))
    | line :: rest ->
        let line = String.trim line in
        if line = "---" then
          let state = match state with
            | `Outside -> `In_header
            | `In_header -> `Outside
          in
          loop state header body rest
        else
          match state with
          | `In_header ->
              loop state (line :: header) body rest
          | `Outside ->
              loop state header (line :: body) rest
  in
  loop `Outside [] [] lines

let parse_yaml yaml_str =
  match Yaml.of_string yaml_str with
  | Error (`Msg msg) -> failwith ("YAML parse error: " ^ msg)
  | Ok v -> v

let get_field yaml key =
  match yaml with
  | `O fields -> List.assoc_opt key fields
  | _ -> None

let as_string = function
  | Some (`String s) -> Some s
  | _ -> None

let as_string_list = function
  | Some (`A lst) ->
      Some (List.filter_map (function
        | `String s -> Some s
        | _ -> None) lst)
  | _ -> None

let as_bool = function
  | Some (`Bool b) -> b
  | _ -> false

let yaml_to_meta yaml =
  let fields = match yaml with
    | `O fields -> fields
    | _ -> failwith "YAML frontmatter must be an object"
  in
  let get key = List.assoc_opt key fields in
  let title =
    match get "title" |> as_string with
    | Some v -> v
    | None -> failwith "missing title"
  in
  let date =
    match get "date" |> as_string with
    | Some v -> v
    | None -> failwith "missing date"
  in
  let slug =
    match get "slug" |> as_string with
    | Some v -> v
    | None -> ""
  in
  let tags =
    match get "tags" |> as_string_list with
    | Some v -> v
    | None -> []
  in
  let summary =
    match get "summary" |> as_string with
    | Some v -> Some v
    | None ->
      match get "description" |> as_string with
      | Some v -> Some v
      | None -> None
  in
  let draft =
    match get "draft" |> as_bool with
    | b -> b
  in
  let last_updated =
    match get "lastUpdated" |> as_string with
    | Some v -> Some v
    | None -> None
  in
  let author =
    match get "author" |> as_string with
    | Some v -> Some v
    | None -> None
  in
  let author_title =
    match get "authorTitle" |> as_string with
    | Some v -> Some v
    | None -> None
  in
  let author_bio =
    match get "authorBio" |> as_string with
    | Some v -> Some v
    | None -> None
  in
  { title; date; slug; tags; summary; draft; last_updated; author; author_title; author_bio }

let stem_of_file file =
  file |> Filename.basename |> Filename.remove_extension

let drop_leading_h1 body =
  let rec drop_blanks = function
    | line :: rest when String.trim line = "" -> drop_blanks rest
    | lines -> lines
  in
  match body |> String.split_on_char '\n' |> drop_blanks with
  | line :: rest when String.starts_with ~prefix:"# " (String.trim line) ->
      String.concat "\n" rest
  | lines -> String.concat "\n" lines

let parse_md_file file =
  if not (check_file_extension file) then
    failwith "not a md file"
  else
    let content = read_file file in
    let header, body = match split_frontmatter content with
      | Ok v -> v
      | Error e -> failwith e
    in
    let yaml = parse_yaml header in
    let meta = yaml_to_meta yaml in
    let slug = if meta.slug = "" then stem_of_file file else meta.slug in
    let body_html = body |> drop_leading_h1 |> Markdown.to_html in
    { meta = { meta with slug }; body_html }

let read_about file =
  if not (check_file_extension file) then
    failwith "not a md file"
  else
    let content = read_file file in
    let header, body = match split_frontmatter content with
      | Ok v -> v
      | Error e -> failwith e
    in
    let yaml = parse_yaml header in
    let title = match get_field yaml "title" |> as_string with
      | Some v -> v
      | None -> failwith "about page missing title"
    in
    let body_html = Markdown.to_html body in
    { title; body_html }

let read_posts dir =
  Sys.readdir dir
  |> Array.to_list
  |> List.map (fun f -> Filename.concat dir f)
  |> List.filter is_md_file
  |> List.map parse_md_file

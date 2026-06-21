let to_html s =
  let doc = Cmarkit.Doc.of_string ~strict:false s in
  Cmarkit_html.of_doc ~safe:false doc

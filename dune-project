(lang dune 3.23)

(name profile)

(generate_opam_files true)

(source
 (github Amr-Shams/profile))

(authors "Amr Shams <amr.shams2015.as@gmail.com>")


(license LICENSE)

(documentation https://url/to/documentation)

(package
 (name profile)
 (synopsis "43 number")
 (description "a profile and blog host")
 (depends
  ocaml
  (dune (>= 3.0))
  cmarkit
  yaml)
 (tags
  ("add topics" "to describe" your project)))

; See the complete stanza docs at https://dune.readthedocs.io/en/stable/reference/dune-project/index.html

type meta = {
  title: string;
  date: string;
  slug: string;
  tags: string list;
  summary: string option;
  draft: bool;
  last_updated: string option;
  author: string option;
  author_title: string option;
  author_bio: string option;
}

type t = {
  meta: meta;
  body_html: string;
}

type page = {
  title: string;
  body_html: string;
}

val sort_newest_first : t list -> t list
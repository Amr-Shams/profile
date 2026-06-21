val layout : title:string -> description:string -> body:string -> string
val home : about_html:string -> posts:Post.t list -> string
val post : post:Post.t -> string
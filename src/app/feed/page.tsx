import { redirect } from "next/navigation";

// La pestaña "Feed" ahora se llama OFERTAS. Los links viejos a /feed siguen funcionando.
export default function FeedRedirect() {
  redirect("/ofertas");
}

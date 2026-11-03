import Image from "next/image";
import { site } from "@/lib/site";

export default function Logo() {
  return (
    <Image src="/logo.jpeg" alt={site.name} width={1536} height={1024} priority className="h-14 w-auto" />
  );
}

import Image from "next/image";
import { site } from "@/lib/site";

export default function Logo() {
  return (
    <span className="relative block h-[5.5rem] w-[13.5rem] overflow-hidden sm:h-24 sm:w-[17.5rem] lg:h-[6.5rem] lg:w-[21rem]">
      <Image
        src="/logo.jpeg"
        alt={site.name}
        fill
        priority
        sizes="(min-width: 1024px) 336px, (min-width: 640px) 280px, 216px"
        className="object-contain object-center scale-[1.72]"
      />
    </span>
  );
}

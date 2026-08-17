import { Marquee } from "@/components/motion/Marquee";
import { announcements } from "@/content/site";

export function AnnouncementBar() {
  return (
    <div className="relative z-50 bg-rose-600 text-paper">
      <Marquee speed={38} className="py-2.5">
        {announcements.map((item) => (
          <span
            key={item}
            className="eyebrow flex items-center gap-4 px-6 whitespace-nowrap"
          >
            {item}
            <span className="text-rose-200/70" aria-hidden="true">
              ✳
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}

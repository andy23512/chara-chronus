import { timelineData } from "@/data/timeline";
import Clock from "./Clock";

export function TimelinePages() {
  return (
    <>
      {timelineData.map((entry) => {
        const slug = entry.year === null ? "future" : String(entry.year);
        return (
          <div
            key={slug}
            id={slug}
            className="h-screen flex items-center justify-center flex-wrap"
          >
            <div className="flex gap-16 justify-center flex-col lg:flex-row items-center">
              <div className="size-64 flex-none relative">
                <Clock
                  className="opacity-20"
                  idPrefix={slug}
                  labels={entry.yearInRoman
                    .repeat(Math.ceil(12 / entry.yearInRoman.length))
                    .split("")}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-10 text-6xl font-bold">
                  {entry.year}
                </div>
              </div>
              <div className="flex-none flex items-center justify-center gap-8 flex-col max-w-[600px] w-full">
                <h2 className="text-3xl lg:text-5xl font-bold">
                  {entry.title}
                </h2>
                <ul className="flex flex-col lg:text-xl">
                  {entry.items.map((item, index) => (
                    <li key={index}>
                      {item.time ? <span>{item.time} - </span> : null}
                      {item.description.map((desc, descIndex) => {
                        if (typeof desc === "string") {
                          return <span key={descIndex}>{desc}</span>;
                        } else if (desc.type === "url") {
                          return (
                            <a
                              key={descIndex}
                              href={desc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-4"
                            >
                              {desc.content}
                            </a>
                          );
                        }
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

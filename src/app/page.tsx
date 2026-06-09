import { EventsLanding } from "@/components/events/EventsLanding";
import { getContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getContent();
  return <EventsLanding content={content} />;
}

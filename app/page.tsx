import Academy from './ui';
import { initialCourse, allLessons } from './course';
export const dynamic = 'force-dynamic';
export default function Home() {
  const preview = structuredClone(initialCourse);
  for (const l of allLessons(preview)) l.questions = l.questions.map(({correct,explanation,...rest}) => rest as any);
  return <Academy initial={preview} />;
}

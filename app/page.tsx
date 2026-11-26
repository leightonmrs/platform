import Academy from './ui';
import { attachDefaultSelfCheck } from './self-check-data';
import { attachDefaultCaseStudy } from './case-study-data';
import { initialCourse, hideAnswerKeys } from './course';
export const dynamic = 'force-dynamic';
export default function Home() {
  const preview = structuredClone(initialCourse);
  attachDefaultSelfCheck(preview,'main');
  attachDefaultCaseStudy(preview,'main');
  hideAnswerKeys(preview);
  return <Academy initial={preview} />;
}

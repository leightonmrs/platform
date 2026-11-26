export type Resource = { id: string; title: string; url: string; kind: 'source' | 'file' };
export type Question = { id: string; prompt: string; options: string[]; correct: number; explanation: string };
export type SelfCheckImage = { url: string; alt: string; caption: string };
type SelfCheckQuestionBase = { id: string; number: number; prompt: string; explanation: string; image?: SelfCheckImage; reference?: string };
export type SelfCheckQuestion = SelfCheckQuestionBase & (
 { kind?: 'single'; options: string[]; correct: number } |
 { kind: 'order'; options: string[]; correct: number[] } |
 { kind: 'matching'; options: string[]; roles: string[]; correct: number[] } |
 { kind: 'multiple'; options: string[]; selectionCount: number; correct: number[] } |
 { kind: 'open'; rubric: string[] }
);
export type SelfCheckAnswer = number | number[] | string;
export type SelfCheckStage = { id: string; title: string; body: string; nextLabel?: string; table?: { headers: string[]; rows: string[][] }; questions: SelfCheckQuestion[] };
export type SelfCheck = { id: string; title: string; subtitle: string; instructions: string; closing: string; durationLabel?: string; stages: SelfCheckStage[] };
export type CaseQuestion = { id: string; number: number; prompt: string; modelAnswer?: string };
export type CaseStage = { id: string; title: string; body: string; table?: { headers: string[]; rows: string[][] }; rule?: string; questions: CaseQuestion[] };
export type CaseSolution = { introduction: string; report: string; physician: string; checklist: string };
export type CaseStudy = { id: string; title: string; subtitle: string; introduction: string; stages: CaseStage[]; solution?: CaseSolution };
export type Lesson = { selfCheck?: SelfCheck | null; caseStudy?: CaseStudy | null; id: string; title: string; type: 'reading' | 'video' | 'quiz'; minutes: number; body: string; videoUrl: string; videoAutoplay?: boolean; resources: Resource[]; questions: Question[] };
export type Module = { id: string; title: string; description: string; lessons: Lesson[] };
export const PLATFORM_NAME = 'Институт Лабораторной Медицины КАМЛАБ';
export type Commerce = { priceKzt: number; paymentUrl: string; published: boolean; category: string };
export type Course = { commerce?: Commerce; title: string; subtitle: string; organization: string; author: string; level: string; passScore: number; modules: Module[] };
export const SOURCE = {
  nhgri: { id: 'nhgri', title: 'NHGRI · Polymerase Chain Reaction', url: 'https://www.genome.gov/about-genomics/fact-sheets/Polymerase-Chain-Reaction-Fact-Sheet', kind: 'source' as const },
  miqe: { id: 'miqe', title: 'Bustin et al., 2025 · MIQE 2.0', url: 'https://pubmed.ncbi.nlm.nih.gov/40272429/', kind: 'source' as const },
  who: { id: 'who', title: 'ВОЗ · Система управления качеством в лаборатории', url: 'https://www.who.int/publications/i/item/9789241548274', kind: 'source' as const },
  samples: { id: 'samples', title: 'ВОЗ · Управление образцами', url: 'https://extranet.who.int/hslp/content/LQMS-training-toolkit', kind: 'source' as const },
  docs: { id: 'docs', title: 'ВОЗ · Документы и записи лаборатории', url: 'https://www.who.int/publications/m/item/laboratory-quality-manual', kind: 'source' as const },
  medline: { id: 'medline', title: 'MedlinePlus · PCR Tests', url: 'https://medlineplus.gov/lab-tests/pcr-tests/', kind: 'source' as const },
};
const reading = (id: string, title: string, minutes: number, body: string, resources: Resource[]): Lesson => ({ id, title, type: 'reading', minutes, body, resources, videoUrl: '', questions: [] });
const q = (id: string, prompt: string, options: string[], correct: number, explanation: string): Question => ({ id, prompt, options, correct, explanation });
export const initialCourse: Course = {
  title: 'ПЦР: от основ к уверенной интерпретации',
  subtitle: 'Разберитесь в принципах молекулярной диагностики, контроле качества и логике лабораторного заключения — в удобном темпе.',
  organization: PLATFORM_NAME, author: 'Учебная редакция', level: 'Базовый уровень', passScore: 80,
  modules: [
    { id: 'm1', title: 'Как работает ПЦР', description: 'Понятный фундамент молекулярной диагностики.', lessons: [
      reading('l1', 'ПЦР: идея, возможности и границы', 7, '## Что вы узнаете\nПосле урока вы сможете объяснить, что именно копирует ПЦР и почему амплификация помогает обнаруживать выбранный участок ДНК.\n\n## Главная идея\nПолимеразная цепная реакция — метод многократного копирования выбранного фрагмента ДНК. Копий становится больше, поэтому этот фрагмент легче исследовать. Праймеры задают границы копируемого участка.\n\n## Где применяется метод\nПЦР используют в генетических исследованиях и лабораторной диагностике. Один и тот же общий принцип лежит в основе разных методов; их назначение и способ регистрации результата различаются.\n\n## Подумайте\nЧем обнаружение выбранного фрагмента отличается от исследования всего генома? Сформулируйте ответ в заметках.\n\n## Главное из урока\nПЦР отвечает на заранее поставленный вопрос о выбранной мишени. Она не представляет собой универсальный поиск всех возможных изменений.', [SOURCE.nhgri]),
      reading('l2', 'ДНК, матрица и роль праймеров', 6, '## Три понятия\nМатрица — исходная ДНК, на основе которой синтезируются новые цепи. Праймеры — короткие фрагменты ДНК, обозначающие участок копирования. Полимераза — фермент, участвующий в синтезе новых цепей.\n\n## Логика процесса\nЦепи ДНК разделяются, праймеры связываются с соответствующими участками, затем происходит синтез новых цепей. Повторение этих этапов увеличивает число копий выбранного фрагмента.\n\n## Самопроверка\nПопробуйте описать роли матрицы, праймеров и полимеразы тремя отдельными предложениями.', [SOURCE.nhgri]),
    ] },
    { id: 'm2', title: 'Разновидности метода', description: 'Различайте ПЦР, qPCR и обратную транскрипцию.', lessons: [
      reading('l3', 'ПЦР, qPCR и RT-PCR: разбираем термины', 8, '## Разные вопросы — разные подходы\nПЦР с детекцией в реальном времени (qPCR) позволяет наблюдать изменение флуоресцентного сигнала в ходе реакции. Количественная интерпретация требует подходящей калибровки и проверки характеристик метода.\n\n## Обратная транскрипция\nЕсли исходный материал представлен РНК, перед амплификацией получают комплементарную ДНК. Этот этап называют обратной транскрипцией. Обозначение RT относится к reverse transcription; для real-time PCR лучше использовать qPCR.\n\n## Самопроверка\nПочему обратная транскрипция и регистрация сигнала в реальном времени описывают разные особенности анализа?', [SOURCE.medline, SOURCE.miqe]),
      reading('l4', 'Качественный и количественный результат', 6, '## Как читать формулировки\nКачественное исследование отвечает на вопрос об обнаружении мишени в рамках характеристик метода. Количественное исследование оценивает её количество с указанием единиц и применимого диапазона.\n\n## О чём помнить\nРезультат относится к исследованному образцу и конкретной системе. Его рассматривают вместе с назначением исследования, качеством образца и другими данными.\n\n## Задание\nНапишите два примера формулировок: качественный результат и количественный результат. Не добавляйте клинических выводов, которые не следуют из самого измерения.', [SOURCE.medline]),
    ] },
    { id: 'm3', title: 'Образец и качество', description: 'Проследите путь образца и точки контроля.', lessons: [
      reading('l5', 'Преаналитический этап: почему он важен', 7, '## Качество начинается до измерения\nИдентификация, сбор, транспортирование и хранение образца составляют важную часть лабораторного процесса. Ошибки на этих этапах способны повлиять на достоверность результата.\n\n## Прослеживаемость\nДля каждого образца должны быть понятны его происхождение, идентификатор и история движения. Критерии приёма и отклонения устанавливают в документах лаборатории для конкретного исследования.\n\n## Задание\nСоставьте в заметках перечень сведений, которые помогут проследить образец от получения до выдачи результата. Сравните его с действующей документацией вашей организации.', [SOURCE.samples]),
      reading('l6', 'Система качества: люди, процессы, записи', 7, '## Системный подход\nКачество лаборатории зависит от организации процессов, подготовки персонала, управления оборудованием, документами и несоответствиями. Проверка только последнего этапа не заменяет систему качества.\n\n## Работа с несоответствием\nОтклонение нужно зарегистрировать, оценить его влияние и передать ответственному сотруднику. Решение и выполненные действия должны быть прослеживаемыми.\n\n## Подумайте\nКакая запись позволит позже восстановить, кто и на каком основании принял решение по спорному результату?', [SOURCE.who]),
    ] },
    { id: 'm4', title: 'Контроли и достоверность', description: 'Понимайте назначение контроля и ограничения сигнала.', lessons: [
      reading('l7', 'Зачем исследованию нужны контроли', 8, '## Назначение контроля\nКонтроли помогают оценивать достоверность аналитического процесса. Отрицательный, положительный и внутренний контроль отвечают на разные вопросы. Конкретный состав контроля определяется назначением и валидацией метода.\n\n## Контроль как основание для решения\nПрежде чем интерпретировать образец, оценивают приемлемость результатов контролей по утверждённым критериям. Несоответствие нельзя игнорировать из-за ожидаемого результата образца.\n\n## Задание\nСформулируйте, почему один вид контроля не может автоматически заменить все остальные.', [SOURCE.miqe]),
      reading('l8', 'Cq: показатель с контекстом', 8, '## Что обозначает Cq\nCq — характеристика момента пересечения сигналом заданного порога при qPCR. Её интерпретация зависит от способа анализа и характеристик конкретной системы.\n\n## Ограничения сравнения\nОтдельное значение Cq не является самостоятельным клиническим диагнозом. Сравнение результатов разных систем требует обоснования сопоставимости.\n\n## Самопроверка\nЧто вы уточните перед сравнением результатов, полученных на разных аналитических системах?', [SOURCE.miqe]),
    ] },
    { id: 'm5', title: 'Интерпретация и отчёт', description: 'Связывайте результат с его ограничениями.', lessons: [
      reading('l9', 'Результат анализа и клинический вывод', 7, '## Два уровня интерпретации\nЛабораторный результат описывает исследование образца. Клиническое решение учитывает также симптомы, анамнез и другие исследования. Обнаружение генетического материала и оценка состояния пациента — связанные, но разные задачи.\n\n## Отрицательный результат\nОтсутствие обнаруженного сигнала интерпретируют с учётом чувствительности метода, вида и качества образца и времени исследования.\n\n## Учебная ситуация\nВрач спрашивает, исключает ли отрицательный результат любую причину симптомов. Запишите, какую информацию нужно уточнить, прежде чем отвечать.', [SOURCE.medline]),
      reading('l10', 'Понятный отчёт и управляемые документы', 6, '## Документирование\nУправляемые документы имеют идентифицируемую версию и утверждение. Записи фиксируют выполненные действия. Это помогает восстановить ход исследования и принятые решения.\n\n## Учебное задание\nПодготовьте структуру лабораторного отчёта: идентификатор образца, название исследования, результат, единицы при необходимости, применимые ограничения и сведения об утверждении.\n\n## Применение на рабочем месте\nСопоставьте учебную структуру с действующим шаблоном вашей лаборатории. Изменения документов вносят в рамках принятого процесса управления.', [SOURCE.docs]),
    ] },
    { id: 'm6', title: 'Проверка знаний', description: 'Закрепите главное и завершите обучение.', lessons: [
      reading('l11', 'Перед итоговым тестом', 4, '## Проверьте готовность\nВы можете объяснить назначение ПЦР, различить qPCR и обратную транскрипцию, описать роль преаналитики и контролей, назвать ограничения интерпретации результата.\n\n## Как устроен тест\nВыберите один ответ в каждом вопросе. После отправки вы увидите результат и пояснения. Можно повторить попытку; для зачёта учитывается лучший результат. Порог устанавливает автор курса.\n\n## После обучения\nВернитесь к своим заметкам и составьте личный план дальнейшего изучения. Учебное подтверждение завершения курса доступно после всех уроков и успешного теста.', []),
      { id: 'l12', title: 'Итоговый тест', type: 'quiz', minutes: 10, body: 'Проверьте понимание основных понятий. В каждом вопросе один правильный ответ.', videoUrl: '', resources: [], questions: [
        q('q1', 'Какова основная задача ПЦР?', ['Многократное копирование выбранного фрагмента ДНК', 'Определение всех белков в образце', 'Измерение количества клеток без анализа ДНК'], 0, 'ПЦР увеличивает число копий выбранного участка ДНК.'),
        q('q2', 'Что определяет границы амплифицируемого участка?', ['Цвет пробирки', 'Праймеры', 'Формат лабораторного отчёта'], 1, 'Праймеры задают участок, который будет копироваться.'),
        q('q3', 'Что означает RT в RT-PCR?', ['Регистрацию сигнала в реальном времени', 'Повторное тестирование', 'Обратную транскрипцию'], 2, 'RT означает reverse transcription — получение ДНК на основе РНК.'),
        q('q4', 'Что характеризует qPCR?', ['Только визуальную оценку в конце анализа', 'Наблюдение флуоресцентного сигнала в ходе реакции', 'Отсутствие необходимости в контролях'], 1, 'qPCR позволяет регистрировать изменение сигнала в реальном времени.'),
        q('q5', 'Как следует оценивать Cq?', ['С учётом метода и аналитической системы', 'Как универсальный показатель для любых систем', 'Как самостоятельный клинический диагноз'], 0, 'Cq требует контекста конкретной аналитической системы.'),
        q('q6', 'Что относится к преаналитическому этапу?', ['Только подписание отчёта', 'Только статистическая обработка', 'Идентификация и транспортирование образца'], 2, 'Преаналитика включает процессы до аналитического измерения.'),
        q('q7', 'Что делать, если контроль не соответствует критериям?', ['Игнорировать его при ожидаемом результате', 'Оценить несоответствие по утверждённому процессу', 'Автоматически выдать любой результат'], 1, 'Несоответствие контроля требует оценки до выдачи результата.'),
        q('q8', 'Что обеспечивает прослеживаемость?', ['Возможность восстановить ход исследования и решения', 'Только наличие логотипа на отчёте', 'Отсутствие записей о корректировках'], 0, 'Прослеживаемость основана на идентификации и записях.'),
        q('q9', 'Что нужно для клинической интерпретации?', ['Только название метода', 'Только значение Cq', 'Результат с учётом клинических и других данных'], 2, 'Клиническое решение учитывает контекст пациента и ограничения исследования.'),
        q('q10', 'Какой подход к документам поддерживает систему качества?', ['Использование любой найденной версии', 'Управление версиями и утверждением', 'Изменение записей без фиксации'], 1, 'Управление документами помогает поддерживать актуальность и прослеживаемость.'),
      ] },
    ] },
  ],
};
export function allLessons(c: Course) { return c.modules.flatMap(m => m.lessons); }
export function safeUrl(s: string) {
  if (s.startsWith('/api/files/')) return /^\/api\/files\/[a-zA-Z0-9_-]{1,100}$/.test(s);
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}

export function commerce(c: Course): Commerce { return { priceKzt: 0, paymentUrl: '', published: true, category: 'Лабораторная диагностика', ...c.commerce }; }
export function lessonKey(courseId: string, lessonId: string) { return courseId === 'main' ? lessonId : `${courseId}:${lessonId}`; }
export type CatalogItem = { id: string; title: string; subtitle: string; author: string; level: string; category: string; priceKzt: number; published: boolean; modules: number; lessons: number; minutes: number; access: boolean; enrolled: boolean; paymentReady: boolean; completed: number; moduleTitles: string[] };

export function hideAnswerKeys(course: Course) {
 for(const lesson of allLessons(course)){
  lesson.questions=lesson.questions.map(({correct,explanation,...rest})=>rest as Question);
  if(lesson.selfCheck)for(const stage of lesson.selfCheck.stages)stage.questions=stage.questions.map(q=>{const {correct,explanation,rubric,...rest}=q as SelfCheckQuestion&{correct?:unknown;rubric?:unknown};return rest as SelfCheckQuestion;});
  if(lesson.caseStudy){delete lesson.caseStudy.solution;for(const stage of lesson.caseStudy.stages)stage.questions=stage.questions.map(({modelAnswer,...rest})=>rest);}
 }
 return course;
}

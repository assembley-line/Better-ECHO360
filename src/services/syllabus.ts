import { HardService } from "@/services";
import {
    literal,
    object,
    pipe,
    string,
    transform,
    array,
    safeParse,
    optional,
    type InferOutput,
} from "valibot";

const SyllabusDateTimeSchema = pipe(
    string(),
    transform((input) => {
        const date = new Date(input);
        date.setSeconds(0, 0);
        return date;
    }),
);
const SyllabusItemSchema = pipe(
    object({
        type: literal("SyllabusLessonType"),
        lesson: object({
            captureStartedAt: optional(SyllabusDateTimeSchema), // undefined if not captured
            captureEndedAt: optional(SyllabusDateTimeSchema), // undefined if not captured
            startTimeUTC: SyllabusDateTimeSchema,
            endTimeUTC: SyllabusDateTimeSchema,
            lesson: object({
                id: string(),
            }),
        }),
    }),
    transform((input) => ({
        id: input.lesson.lesson.id,
        startDate: input.lesson.captureStartedAt ?? input.lesson.startTimeUTC,
        endDate: input.lesson.captureEndedAt ?? input.lesson.endTimeUTC,
    })),
);
const SyllabusListSchema = array(SyllabusItemSchema);

type SyllabusList = InferOutput<typeof SyllabusListSchema>;

export class SyllabusService extends HardService {
    private items: SyllabusList = [];

    constructor(private courseId: string) {
        super("Syllabus");
    }

    public async init(): Promise<boolean> {
        try {
            const response = await fetch(
                `https://echo360.net.au/section/${this.courseId}/syllabus`,
                {
                    credentials: "include",
                    method: "GET",
                    mode: "cors",
                },
            );

            const json = await response.json();

            if (!json.data) {
                this.reporter.warn("Syllabus response had no data field");
                return false;
            }

            const parsed: SyllabusList = [];
            let skipped = 0;

            for (const raw of json.data) {
                const result = safeParse(SyllabusItemSchema, raw);
                if (result.success) {
                    parsed.push(result.output);
                } else {
                    skipped++;
                    console.debug("Skipped syllabus item:", result.issues, raw);
                }
            }

            this.reporter.tell("Successfully read and parsed the syllabus");
            this.items = parsed;
            return true;
        } catch (e) {
            this.reporter.scream("Syllabus fetch threw an error: " + e);
            return false;
        }
    }

    private isSameDay(a: Date, b: Date): boolean {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    private findLessonsByDate(date: Date): SyllabusList {
        return this.items.filter((item) =>
            this.isSameDay(item.startDate, date),
        );
    }

    public getTodaysLessons(): SyllabusList {
        const today = new Date();
        return this.findLessonsByDate(today);
    }
}

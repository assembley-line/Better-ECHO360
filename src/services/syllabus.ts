import { HardService } from "@/services";
import template from "@/templates/syllabusPlatform.html?raw";
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
import waitForElement from "@/tools/waitForElement";
import fromTemplate from "@/tools/fromTemplate";
import { hidden } from "@/tools/hiddenDecorator";
import settings from "@/tools/settings";

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

@hidden(settings.syllabus.hidden)
export class SyllabusService extends HardService {
    private items: SyllabusList = [];

    constructor(private courseId: string) {
        super("Syllabus");

        this.init();
    }

    public async init(): Promise<boolean> {
        try {
            this.reporter.report("Fetching the syllabus");
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
                }
            }

            this.reporter.tell(
                "Successfully read and parsed the syllabus, skipped " +
                    skipped +
                    " items",
            );
            this.items = parsed;
            this.UI.attachOptionsPlatform();
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

    public async getTodaysLessonElement(): Promise<HTMLElement | null> {
        const todays = this.getTodaysLessons();
        if (todays.length == 0) {
            console.info("No lessons today");
            return null; // No lessons today, do nothing
        }
        const first = todays[0];
        // Check if the page contains that id box
        const lessonElement = await waitForElement(
            `[data-test-lessonid="${first.id}"]`,
        );
        if (!lessonElement) {
            console.error(
                "Something went wrong, no element found for lesson ",
                first.id,
            );
            return null;
        }

        return lessonElement;
    }

    public getTodaysLessons(): SyllabusList {
        const today = new Date();
        return this.findLessonsByDate(today);
    }

    private UI = {
        attachOptionsPlatform: async () => {
            const platform = fromTemplate<HTMLDivElement>(template);

            const first = this.getTodaysLessons()[0];
            const lessonElement = await this.getTodaysLessonElement();
            if (!lessonElement) {
                console.error("No lesson element found for today's lesson");
                return;
            }

            platform
                .querySelector(".jump-button")
                ?.addEventListener("click", () => {
                    lessonElement.scrollIntoView({ behavior: "smooth" });
                    const ring = this.createHighlightRing(lessonElement);
                    setTimeout(() => {
                        ring.remove();
                    }, 1500); // 1500 linked to css animation duration
                });
            platform
                .querySelector(".watch-button")
                ?.addEventListener("click", () => {
                    window.location.assign(
                        `https://echo360.net.au/lesson/${first.id}/classroom`,
                    );
                });

            document.body.append(platform);
        },
    };

    private createHighlightRing(target: Element): HTMLElement {
        const ring = document.createElement("div");
        ring.className = "be360-highlight-ring";
        document.body.appendChild(ring);
        const ringPadding = 3;

        function position() {
            const rect = target.getBoundingClientRect();
            ring.style.top = `${rect.top - ringPadding}px`;
            ring.style.left = `${rect.left - ringPadding}px`;
            ring.style.width = `${rect.width + 2 * ringPadding}px`;
            ring.style.height = `${rect.height + 2 * ringPadding}px`;
        }

        position();
        window.addEventListener("scroll", position, true);
        window.addEventListener("resize", position);

        return ring;
    }
}

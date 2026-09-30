import lesson from "@/routes/lesson";
import LessonList from "@/routes/lesson_list";
import { Service } from "@/services";

type MatchResult<T> = { matches: true; data: T } | { matches: false };

interface Route<T = void> {
    name: string;
    matcher: (location: Location) => MatchResult<T>;
    handler: (data: T) => void;
}

export class RouterService extends Service {
    private static routes: Route<any>[] = [
        {
            name: "Lesson",
            matcher: (location: Location) => {
                return { matches: location.pathname.includes("/lesson") };
            },
            handler: () => {
                lesson();
            },
        } as Route<void>,
        {
            name: "Lessons List",
            matcher: (location: Location) => {
                const regex = "\/section\/(?<course_id>.+)\/home";
                const match = location.pathname.match(regex);
                if (match && match.groups) {
                    const courseId = match.groups["course_id"];
                    if (courseId) {
                        return { matches: true, data: { courseId } };
                    }
                }
                return { matches: false };
            },
            handler: (data) => {
                LessonList(data.courseId);
            },
        } as Route<{ courseId: string }>,
    ];

    constructor() {
        super("Router");
    }

    private route(): void {
        var location = window.location;

        for (const route of RouterService.routes) {
            const result = route.matcher(location);
            if (result.matches) {
                this.reporter.tell(`Matched route for (${route.name})`);
                route.handler(result.data);
                return;
            }
        }

        this.reporter.warn(`No route matched for ${location.pathname}`);
    }

    public init(): void {
        this.route();
    }
}

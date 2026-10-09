import { SyllabusService } from "@/services/syllabus";

export default function LessonList(courseId: string) {
    new SyllabusService(courseId);
}

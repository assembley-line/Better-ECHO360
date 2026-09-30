export default function LessonList(courseId: string) {
    fetch(`https://echo360.net.au/section/${courseId}/syllabus`, {
        credentials: "include",
        method: "GET",
        mode: "cors",
    }).then((data) => console.log(data));
}

import "@/app/styles.css";

export default function AssignMentor() {
    return (
        <dialog className="">
            <div>
                <label htmlFor="mentorID">Mentor ID</label>
                <input type="text" name="mentorID" id="mentorID" />
            </div>
            <div>
                <label htmlFor="studentID">Student ID</label>
                <input type="text" name="studentID" id="studentID" />
            </div>
        </dialog>
    )
}
import Link from "next/link";
import "@/app/styles.css";

export default function Page() {
  return (
    <>
        <h1 className="text-center mt-6 text-5xl">Admin Dashboard</h1>
        <div className="optionList flex flex-col justify-center items-center my-14">
            <AdminOption link="/pages/admin/view-mentors" text="View Mentors" />
            <AdminOption link="/pages/admin/view-mentees" text="View Mentees" />
            <AdminOption link="" text="Generate Meeting Reports" />
            <AdminOption link="" text="Edit/Assign Mentors" onClick={() => console.log("hello")} />
        </div>
    </>
  );
}

function AdminOption({text, link}) {
    return (
        <div className="border-y w-1/3 text-center adminOption py-4 hover:underline underline-offset-4 text-xl" >
            <Link href={link}>{text}</Link>
        </div>
    )
}
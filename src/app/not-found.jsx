import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <Image
        src="/not-found.svg"
        alt="Not Found"
        width={500}
        height={500}
        className="mt-8 max-w-sm w-full select-none"
      />
      <p className="text-xl font-bold select-none">
        The page you’re looking for doesn’t exist.
      </p>
      <Link href="/" legacyBehavior>
        <a className="mt-6 px-6 py-3 bg-[#0fe8bf]/80 text-white rounded-full text-lg font-bold shadow-lg hover:bg-[#0fe8bf]/50 hover:scale-125 active:scale-90 active:bg-[#0fe8bf] transition duration-300 select-none">
          Go Back Home
        </a>
      </Link>
    </div>
  );
}

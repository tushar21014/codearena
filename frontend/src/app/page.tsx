"use client";
import Nav from "./components/Nav";
import CodeEditor from "./components/CodeEditor";
import HomePage from "./components/Home";
import Link from "next/link";

export default function Home() {
  return (
      <div>
        <HomePage/>
        <Link href={"/game"}>
        <button type="button" className="text-white mt-10 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" >Play Online</button>
        </Link>
      </div>
  );
}

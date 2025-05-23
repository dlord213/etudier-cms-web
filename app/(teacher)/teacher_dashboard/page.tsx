/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import HeaderNavbar from "../components/HeaderNavbar";
import Link from "next/link";

import pocketbase_instance from "@/app/lib/pocketbase";
import {
  ChartArea,
  ChartBar,
  FilePlus2,
  ListPlus,
  LoaderPinwheel,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const router = useRouter();
  const user = pocketbase_instance.authStore.record!;

  const { data }: { data: any } = useQuery({
    queryKey: ["teacher_dashboard"],
    queryFn: async () => {
      try {
        const quizCount = await pocketbase_instance
          .collection("quiz")
          .getList(1, 50, {
            filter: `teacher_id = '${user!.id}'`,
          });

        const modulesCount = await pocketbase_instance
          .collection("modules")
          .getList(1, 50, {
            filter: `teacher_id = '${user!.id}'`,
          });

        return {
          quizCount: quizCount.items.length,
          modulesCount: modulesCount.items.length,
        };
      } catch (err) {
        console.error(err);
        return err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: studentsData } = useQuery({
    queryFn: async () => {
      try {
        const { items } = await pocketbase_instance
          ?.collection("module_enrollments")
          .getList(1, 50, {
            filter: `teacher = '${user.id}'`,
            expand: "student, module",
          });

        console.log(items);

        return items;
      } catch (err) {
        throw err;
      }
    },
    queryKey: ["teacher_students_list"],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const checkSession = async () => {
      const user = JSON.parse(localStorage.getItem("pocketbase_auth")!);

      if (!user) {
        localStorage.removeItem("pocketbase_auth");
        router.replace("/");
      }

      if (user && user.record.account_type == "Student") {
        router.replace("/student_dashboard/");
      } else if (user && user.record.account_type == "Teacher") {
        router.replace("/teacher_dashboard/");
      }
    };

    checkSession();
  }, []);

  if (data) {
    return (
      <main className="flex flex-col gap-4 max-w-3xl min-h-screen mx-auto py-4">
        <HeaderNavbar />
        <h1 className="text-4xl font-bold">Stats</h1>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={"/teacher_modules"}
            className="flex flex-col gap-8 p-8 border border-gray-300 shadow bg-gray-50 rounded-3xl justify-between transition-all delay-0 duration-300 hover:-translate-y-2 cursor-pointer"
          >
            <ChartBar size={64} />
            <div className="flex flex-col">
              <h1 className="text-gray-500 text-lg">Modules created</h1>
              <p className="font-black text-3xl">{data.modulesCount!}</p>
            </div>
          </Link>
          <Link
            href={"/teacher_quiz"}
            className="flex flex-col gap-8 p-8 border border-gray-300 shadow bg-gray-50 rounded-3xl justify-between transition-all delay-0 duration-300 hover:-translate-y-2 cursor-pointer"
          >
            <ChartArea size={64} />
            <div className="flex flex-col">
              <h1 className="text-gray-500 text-lg">Quiz created</h1>
              <p className="font-black text-3xl">{data.quizCount!}</p>
            </div>
          </Link>
        </div>
        <h1 className="text-4xl font-bold">Create</h1>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={"/add_module"}
            className="flex flex-col gap-8 p-8 border border-gray-300 shadow bg-gray-50 rounded-3xl justify-between transition-all delay-0 duration-300 hover:-translate-y-2 cursor-pointer"
          >
            <FilePlus2 size={64} />
            <h1 className="text-2xl">Create a module</h1>
          </Link>
          <Link
            href={"/add_quiz"}
            className="flex flex-col gap-8 p-8 border border-gray-300 shadow bg-gray-50 rounded-3xl justify-between transition-all delay-0 duration-300 hover:-translate-y-2 cursor-pointer"
          >
            <ListPlus size={64} />
            <h1 className="text-2xl">Create a quiz</h1>
          </Link>
        </div>

        {Array.isArray(studentsData) && studentsData!.length > 0 && (
          <>
            <h1 className="text-4xl font-bold">Enrolled Students</h1>
            <div className="overflow-x-auto rounded-box border border-base-content/5 shadow  bg-gray-50">
              <table className="table">
                {/* head */}
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>School</th>
                    <th>Module</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.map((student, index) => (
                    <tr key={index}>
                      <th>{index}</th>
                      <th className="font-normal">
                        {student.expand!.student.name}
                      </th>
                      <th className="font-normal">
                        {student.expand!.student.course}
                      </th>
                      <th className="font-normal">
                        {student.expand!.student.school}
                      </th>
                      <th className="font-normal">
                        {student.expand!.module.title}
                      </th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 max-w-3xl min-h-screen mx-auto py-4 items-center justify-center">
      <LoaderPinwheel className="animate-spin" size={64} />
    </main>
  );
}

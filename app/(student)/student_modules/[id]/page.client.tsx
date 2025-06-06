/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import HeaderNavbar from "../../components/HeaderNavbar";
import pocketbase_instance from "@/app/lib/pocketbase";
import Link from "next/link";

import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCheckIcon,
  Download,
  NotebookIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function ClientComponent({ data }: { data: any }) {
  const router = useRouter();
  const user = pocketbase_instance.authStore.record;

  const [percent, setPercent] = useState("0%");
  const [bookmarked, setBookmark] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const { data: files } = useQuery({
    queryKey: ["module_files", data.id],
    queryFn: async () => {
      const temp = [];
      for (const file of data.contents) {
        const url = pocketbase_instance.files.getURL(data, file);
        temp.push({ url: url, title: url.split("/").pop() });
      }

      return {
        files: temp,
        thumbnail_url: pocketbase_instance.files.getURL(data, data.thumbnail),
      };
    },
  });

  const { data: quiz, error: noQuiz }: { data: any; error: any } = useQuery({
    queryKey: ["module_quiz", data.id],
    queryFn: async () => {
      try {
        const quiz = await pocketbase_instance!
          .collection("quiz")
          .getFullList({ filter: `module = '${data.id}'` });

        console.log(quiz);

        return quiz;
      } catch (err) {
        return err;
      }
    },
  });

  const { refetch: refetchUserProgress } = useQuery({
    queryKey: ["usersProgress", data!.id],
    queryFn: async () => {
      try {
        const record = await pocketbase_instance
          .collection("users_modules_progress")
          .getFirstListItem(
            `user_id = '${user!.id}' && module_id = '${data.id}'`
          );

        setPercent(record.percent);
        setBookmark(record.bookmarked);

        return 1;
      } catch (err: any) {
        console.log(err);
        return err;
      }
    },
  });

  const handleMarkAsCompleted = async () => {
    setIsMarking(true);
    try {
      const recordExist = await pocketbase_instance
        .collection("users_modules_progress")
        .getFirstListItem(
          `user_id = '${
            pocketbase_instance.authStore.record!.id
          }' && module_id = '${data!.id}'`
        );

      await pocketbase_instance
        .collection("users_modules_progress")
        .update(recordExist.id, {
          percent: "100%",
        });
      refetchUserProgress();
    } catch (err) {
      await pocketbase_instance.collection("users_modules_progress").create({
        user_id: pocketbase_instance.authStore.record!.id,
        module_id: data!.id,
        percent: "100%",
      });
      refetchUserProgress();
    }
    setIsMarking(false);
  };

  const handleUnmarkAsCompleted = async () => {
    setIsMarking(true);
    try {
      const recordExist = await pocketbase_instance
        .collection("users_modules_progress")
        .getFirstListItem(
          `user_id = '${
            pocketbase_instance.authStore.record!.id
          }' && module_id = '${data!.id}'`
        );

      await pocketbase_instance
        .collection("users_modules_progress")
        .update(recordExist.id, {
          percent: null,
        });
      refetchUserProgress();
    } catch (err) {}
    setIsMarking(false);
  };

  return (
    <>
      <HeaderNavbar />
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link href={"/student_dashboard"}>Home</Link>
          </li>
          <li>
            <Link href={"/student_modules"}>Modules</Link>
          </li>
          <li>{data!.title}</li>
        </ul>
      </div>
      <div className="flex flex-row items-center justify-between">
        <ArrowLeft
          size={24}
          onClick={() => router.back()}
          className="cursor-pointer"
        />
        {user && user.account_type == "Student" && (
          <div className="flex flex-row items-center gap-4">
            <Bookmark size={24} onClick={() => {}} className="cursor-pointer" />
            {percent != "100%" ? (
              <button
                className="btn btn-soft btn-success"
                onClick={handleMarkAsCompleted}
                disabled={isMarking}
              >
                <Check size={24} className="cursor-pointer" />
                <p>Mark as complete</p>
              </button>
            ) : (
              <button
                className="btn btn-soft btn-success"
                onClick={handleUnmarkAsCompleted}
                disabled={isMarking}
              >
                <CheckCheckIcon size={24} className="cursor-pointer" />
                <p>Completed</p>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-8">
        {files && (
          <img
            src={
              files.thumbnail_url ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg_ITtT5GMZ-5j9ybW17fpwAOm3Lg0hdzNcw&s"
            }
            className="w-full aspect-square rounded-3xl object-cover shadow-md"
          />
        )}

        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-3xl">{data.title}</h1>
          {data!.course && (
            <p className="px-6 py-2 bg-gray-200 text-gray-500 w-fit rounded-3xl">
              {data!.course}
            </p>
          )}
          {data.description && (
            <p className="text-sm text-gray-500">{data.description}</p>
          )}
        </div>
      </div>
      <h1 className="text-3xl font-black">Resources</h1>
      <div className="bg-gray-50 border border-gray-300 shadow-md p-8 rounded-3xl">
        {files &&
          files?.files.length > 0 &&
          files.files.map((file: any, index) => (
            <Link
              href={file.url}
              key={index}
              className="flex gap-6 items-center text-sm text-gray-700 bg-gray-100 rounded-3xl p-6"
            >
              <Download size={24} />
              <span>{file.title}</span>
            </Link>
          ))}
        {files && files?.files.length == 0 && <h1>No resources found.</h1>}
      </div>
      {quiz && quiz.length > 0 && (
        <>
          <h1 className="text-3xl font-black">Quiz</h1>
          <div className="bg-gray-50 border border-gray-300 shadow-md p-8 rounded-3xl">
            {quiz.map((quiz: any, index: any) => (
              <Link
                href={`/student_quiz/${quiz.id}`}
                key={index}
                className="flex gap-6 items-center text-sm text-gray-700 bg-gray-100 rounded-3xl p-6"
              >
                <NotebookIcon size={24} />
                <span>{quiz.title}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

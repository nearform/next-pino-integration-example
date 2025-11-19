'use client';

import { useEffect, useState } from "react";
import { getData } from "./getData";

export default function Home() {
  const [ data, setData ] = useState(null);
  useEffect(() => {
    async function fetchData() {
      console.log("Hello from Home page useEffect");
      const resData = await getData('https://jsonplaceholder.typicode.com/todos/1');
      setData(resData);
    }
    fetchData();
  }, [setData]);
  console.error('Rendering Home page');
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <p>{JSON.stringify(data)}</p>
    </div>
  );
}

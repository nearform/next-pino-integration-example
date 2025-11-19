'use server';

export async function getData(url: string) {
  console.log(`Fetching data from ${url}`);
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

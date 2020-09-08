import { Resolution, ContainerList } from "./types";
import fs from "fs";
import { Page } from "puppeteer";

// RANDOM STUFF
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + min;
}

export function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// FILES

export async function ensureFolderExists(path: string): Promise<any> {
  return fs.mkdir(path, { recursive: true }, (err) => {
    if (err) {
      console.log("Error while creating the folder", err);
      return;
    }
  });
}

interface GetFileNameParams {
  viewport?: Resolution;
  url?: string;
  start?: string | number;
  end: string | number;
}
export function getFileName({ viewport, url, start = "", end = "" }: GetFileNameParams): string {
  const resStr = viewport ? `${viewport.width}x${viewport.height}` : "";
  const hostname = url ? new URL(url).hostname : "";
  return [start, hostname, resStr, end].filter((x) => x).join("-");
}

//SCREENSHOTTING
export interface ScreenshotElementsParams {
  page: Page;
  elements: ContainerList; // TODO
  padding?: number;
  filepath: string;
}

export async function screenshotElements({ page, elements, filepath }: ScreenshotElementsParams): Promise<number> {
  const rects = await page.evaluate(async (elements) => {
    return Promise.all(
      Array.from(elements).map(async (elem: HTMLElement) => {
        const rect = await elem.getBoundingClientRect().toJSON();
        return rect as DOMRect;
      })
    );
  }, elements);

  await Promise.all(
    rects.map((rect, idx: number) => {
      screenshotRect({ rect, filepath: `${filepath}-${idx}`, page });
    })
  );
  return rects.length;
}

export interface ScreenshotRectParams {
  page: Page;
  rect: DOMRect;
  padding?: number;
  filepath: string;
}
export async function screenshotRect({ page, rect, filepath, padding = 2 }: ScreenshotRectParams): Promise<any> {
  const clip = {
    x: Math.max(0, rect.left - padding),
    y: Math.max(0, rect.top - padding),
    width: rect.width + padding * (rect.left > padding ? 2 : 1),
    height: rect.height + padding * (rect.top > padding ? 2 : 1)
  };
  return page
    .screenshot({
      clip,
      path: `${filepath}.png`
    })
    .catch((error: Error) => {
      console.error("Screenshot error. Filepath", filepath);
      console.error("Error", error);
    });
}
// const inRange = (value: number, range: [number, number]): boolean => value >= range[0] && value <= range[1];
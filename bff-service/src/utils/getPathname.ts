import * as url from "url"

export const getPathname = (inputUrl?: string) => {
  return url.parse(inputUrl!, true).pathname?.slice(1) || ""
}

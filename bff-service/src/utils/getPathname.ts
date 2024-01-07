export const getPathname = (inputUrl?: string) => {
  return inputUrl?.split("/")[1].split("?")[0] || ""
}

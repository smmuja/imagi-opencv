export function getAdjustedFileName(originalName: string) {
  const nameWithoutExtension = originalName.substring(
    0,
    originalName.lastIndexOf(".")
  );
  const extension = originalName.substring(originalName.lastIndexOf("."));
  return `${nameWithoutExtension}-adjusted${extension}`;
}

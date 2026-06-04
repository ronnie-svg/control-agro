export function readAttachment() {
  const file = document.querySelector("#attachment").files[0];
  if (!file) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || "application/octet-stream",
      data: String(reader.result).split(",")[1]
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

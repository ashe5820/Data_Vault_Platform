export async function fetchUserAssets(userId: string) {
    try {
      const res = await fetch(`/api/assets/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch assets");
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  }
  
  export async function fetchUploadAsset({ file, userId }: { file: File; userId: string }) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("assetName", file.name);
    formData.append("description", `Uploaded on ${new Date().toLocaleDateString()}`);
  
    const response = await fetch("/api/assets/upload", {
      method: "POST",
      body: formData,
    });
  
    return response.json();
  }
  
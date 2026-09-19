/**
 * Origin Private File System (OPFS) Storage Engine for Trophy Room
 * Stores large binary books/comics in the sandboxed browser file system for offline reading
 */

const memoryFallback = new Map<string, Blob>();

export const isOpfsSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 
         typeof navigator.storage !== 'undefined' && 
         typeof navigator.storage.getDirectory === 'function';
};

/**
 * Save a File or Blob into OPFS as `<id>.bin`
 */
export async function saveBookToOpfs(bookId: string, data: Blob | File | ArrayBuffer): Promise<boolean> {
  const fileName = `${bookId}.bin`;
  const blob = data instanceof Blob ? data : new Blob([data]);

  if (!isOpfsSupported()) {
    memoryFallback.set(fileName, blob);
    return true;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(fileName, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.warn(`[OPFS] Error saving file ${fileName}, using memory fallback:`, err);
    memoryFallback.set(fileName, blob);
    return true;
  }
}

/**
 * Retrieve a book binary from OPFS as a Blob
 */
export async function getBookFromOpfs(bookId: string): Promise<Blob | null> {
  const fileName = `${bookId}.bin`;

  if (!isOpfsSupported()) {
    return memoryFallback.get(fileName) || null;
  }

  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file;
  } catch (err: any) {
    if (memoryFallback.has(fileName)) {
      return memoryFallback.get(fileName) || null;
    }
    return null;
  }
}

/**
 * Delete a book binary from OPFS
 */
export async function deleteBookFromOpfs(bookId: string): Promise<boolean> {
  const fileName = `${bookId}.bin`;
  memoryFallback.delete(fileName);

  if (!isOpfsSupported()) return true;

  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(fileName);
    return true;
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return true;
    }
    console.warn(`[OPFS] Could not remove ${fileName}:`, err);
    return false;
  }
}

/**
 * Check if a book exists in OPFS
 */
export async function isBookInOpfs(bookId: string): Promise<boolean> {
  const fileName = `${bookId}.bin`;
  if (memoryFallback.has(fileName)) return true;
  if (!isOpfsSupported()) return false;

  try {
    const root = await navigator.storage.getDirectory();
    await root.getFileHandle(fileName);
    return true;
  } catch {
    return false;
  }
}

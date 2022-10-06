import { PathLike, constants as fsConstants } from 'fs';
import { access } from 'fs/promises';

export async function fileExists(path: PathLike): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

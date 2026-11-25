import { useEffect, useState } from 'preact/hooks';
import type { Child } from '../../types';
import { CHILD_COLORS } from '../theme/themes';
import { useApp } from '../../state/app';
import { getPhoto } from '../../data/repositories/childrenRepo';

export function childDisplayName(child: Pick<Child, 'name'>): string {
  return child.name ?? 'Your child';
}

function initial(child: Pick<Child, 'name'>): string {
  const n = child.name?.trim();
  return n ? n[0]!.toUpperCase() : '•';
}

/** Loads a child's stored photo as an object URL (revoked on change/unmount). */
export function usePhotoUrl(photoId: string | null): string | null {
  const { db } = useApp();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setUrl(null);
    if (photoId) {
      getPhoto(db, photoId).then((p) => {
        if (cancelled || !p) return;
        objectUrl = URL.createObjectURL(p.blob);
        setUrl(objectUrl);
      });
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [db, photoId]);
  return url;
}

export function Avatar({ child, size = 40 }: { child: Child; size?: number }) {
  const url = usePhotoUrl(child.photoId);
  return (
    <span class="avatar" style={{ width: `${size}px`, height: `${size}px`, background: CHILD_COLORS[child.color].hex, fontSize: `${Math.round(size * 0.42)}px` }} aria-hidden="true">
      {url ? <img src={url} alt="" /> : initial(child)}
    </span>
  );
}

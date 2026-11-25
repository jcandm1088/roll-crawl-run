import { useEffect, useState } from 'preact/hooks';
import { onUpdateAvailable, applyUpdate } from '../../sw/register';
import { Icon } from './Icon';

/** Shown when a new version has been downloaded. Updating never touches stored data. */
export function UpdateBanner() {
  const [available, setAvailable] = useState(false);
  useEffect(() => onUpdateAvailable(() => setAvailable(true)), []);
  if (!available) return null;
  return (
    <div class="update-banner" role="status">
      <Icon name="refresh" size={20} />
      <span class="grow small">A new version is available.</span>
      <button class="btn btn-sm" onClick={applyUpdate}>Refresh</button>
    </div>
  );
}

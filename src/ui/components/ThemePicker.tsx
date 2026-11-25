import { THEMES, type ThemeId } from '../theme/themes';
import { Icon } from './Icon';
import { radioGroupKeyDown, rovingTabIndex } from '../a11y';

/** Each option previews the theme's own palette so parents can compare before choosing. */
export function ThemePicker({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void }) {
  return (
    <div class="theme-grid" role="radiogroup" aria-label="Color theme" onKeyDown={radioGroupKeyDown}>
      {THEMES.map((t, i) => (
        <button type="button" key={t.id} class="theme-option" role="radio" aria-checked={value === t.id} tabIndex={rovingTabIndex(value === t.id, i, THEMES.some((x) => x.id === value))} onClick={() => onChange(t.id)} data-testid={`theme-${t.id}`}>
          <span class="theme-swatch" aria-hidden="true">
            <span style={{ background: t.tokens.bg }} />
            <span style={{ background: t.tokens.primarySoft }} />
            <span style={{ background: t.tokens.accent }} />
            <span style={{ background: t.tokens.primary }} />
          </span>
          <span class="row-between">
            <span>{t.name}</span>
            {value === t.id && (
              <span style={{ color: 'var(--primary)' }}>
                <Icon name="check" size={18} />
              </span>
            )}
          </span>
          <span class="xsmall muted">{t.description}</span>
        </button>
      ))}
    </div>
  );
}

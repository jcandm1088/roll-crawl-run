/**
 * Shared primary page heading. Every tab uses this component, so all primary
 * headings have the same font, size, weight, line height, tracking, and spacing.
 */
export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header class="page-header">
      <h1 class="title-1" data-testid="page-title">{title}</h1>
      {intro && <p class="page-intro">{intro}</p>}
    </header>
  );
}

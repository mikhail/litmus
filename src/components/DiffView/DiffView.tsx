import { diffWords } from 'diff';
import './DiffView.css';

interface Props {
  original: string;
  rewritten: string;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

export default function DiffView({ original, rewritten }: Props) {
  const oldText = stripHtml(original);
  const newText = stripHtml(rewritten);
  const changes = diffWords(oldText, newText);

  return (
    <div className="diff-view">
      {changes.map((part, i) => {
        if (part.added) {
          return <span key={i} className="diff-added">{part.value}</span>;
        }
        if (part.removed) {
          return <span key={i} className="diff-removed">{part.value}</span>;
        }
        return <span key={i}>{part.value}</span>;
      })}
    </div>
  );
}

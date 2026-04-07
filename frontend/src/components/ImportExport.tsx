import type { ChangeEvent } from 'react';
import { Upload01Icon, Download01Icon } from 'hugeicons-react';

interface ImportExportProps {
  onImport: (file: File) => Promise<void>;
  onExport: () => void;
}

export default function ImportExport({ onImport, onExport }: ImportExportProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImport(file);
      event.target.value = '';
    }
  };

  return (
    <div className="buttons" style={{ gap: '0.5rem' }}>
      <label className="button is-small is-light">
        <Upload01Icon size={16} style={{ marginRight: '0.5rem' }} />
        Import HTML
        <input type="file" accept="text/html" onChange={handleFileChange} className="hidden" />
      </label>
      <button
        type="button"
        onClick={onExport}
        className="button is-small is-primary"
      >
        <Download01Icon size={16} style={{ marginRight: '0.5rem' }} />
        Export
      </button>
    </div>
  );
}

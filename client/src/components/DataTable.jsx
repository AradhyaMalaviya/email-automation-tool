import './DataTable.css';

export default function DataTable({ columns = [], data = [], onRowClick, actions, emptyMessage = 'No data found.', loading = false }) {
  if (loading) {
    return (
      <div className="data-table-wrapper card">
        <div className="data-table-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="data-table-skeleton-row">
              {columns.map((_, j) => (
                <div key={j} className="data-table-skeleton-cell" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="data-table-wrapper card">
        <div className="data-table-empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper card">
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'data-table-row--clickable' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>
                    <div className="data-table-actions">
                      {actions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          className={`btn btn-sm ${action.className || 'btn-secondary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          title={action.label}
                        >
                          {action.icon && <span>{action.icon}</span>}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

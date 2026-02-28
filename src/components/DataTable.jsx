import { useState, useMemo } from 'react';

export default function DataTable({ columns, data, defaultSortKey, defaultSortDir = 'desc', maxRows }) {
    const [sortKey, setSortKey] = useState(defaultSortKey || (columns[0]?.key));
    const [sortDir, setSortDir] = useState(defaultSortDir);

    const sorted = useMemo(() => {
        const copy = [...data];
        copy.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === 'string') {
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
        return maxRows ? copy.slice(0, maxRows) : copy;
    }, [data, sortKey, sortDir, maxRows]);

    const handleSort = (key) => {
        if (key === sortKey) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`data-table__th ${sortKey === col.key ? 'data-table__th--sorted' : ''} ${col.align || ''}`}
                                onClick={() => handleSort(col.key)}
                            >
                                <span>{col.label}</span>
                                {sortKey === col.key && (
                                    <span className="sort-indicator">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((row, i) => (
                        <tr key={i} className="data-table__row">
                            {columns.map((col) => (
                                <td key={col.key} className={`data-table__td ${col.align || ''}`}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {maxRows && data.length > maxRows && (
                <div className="table-footer">Showing top {maxRows} of {data.length} rows</div>
            )}
        </div>
    );
}

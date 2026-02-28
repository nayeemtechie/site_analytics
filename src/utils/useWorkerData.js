import { useState, useEffect, useRef } from 'react';

/**
 * Singleton worker instance — shared across all hooks.
 * Data is sent to the worker once and cached; subsequent calls only send the function name + args.
 */
let worker = null;
let dataVersion = 0;
let lastDataRef = null;
let pendingDataSet = null;

function getWorker() {
    if (!worker) {
        worker = new Worker(new URL('./dataWorker.js', import.meta.url), { type: 'module' });
    }
    return worker;
}

let idCounter = 0;
function nextId() {
    return `call-${++idCounter}-${Date.now()}`;
}

/**
 * Ensure the worker has the latest data. Returns a promise that resolves
 * when the data has been set in the worker.
 */
function ensureData(data) {
    if (data === lastDataRef && !pendingDataSet) {
        return Promise.resolve();
    }

    // If same data is already being sent, reuse the pending promise
    if (data === lastDataRef && pendingDataSet) {
        return pendingDataSet;
    }

    lastDataRef = data;
    dataVersion++;

    const w = getWorker();
    const id = `data-${dataVersion}`;

    pendingDataSet = new Promise((resolve) => {
        const handler = (e) => {
            if (e.data.id === id && e.data.type === 'DATA_SET') {
                w.removeEventListener('message', handler);
                pendingDataSet = null;
                resolve();
            }
        };
        w.addEventListener('message', handler);
        w.postMessage({ type: 'SET_DATA', id, payload: data });
    });

    return pendingDataSet;
}

/**
 * Hook to call a data aggregation function in the Web Worker.
 *
 * @param {Array} data - The raw data array
 * @param {string} fnName - Name of the aggregation function (e.g. 'getKPISummary')
 * @param  {...any} args - Additional arguments to pass to the function
 * @returns {{ result: any, loading: boolean }}
 */
export function useWorkerData(data, fnName, ...args) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const activeCallId = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0) {
            setResult(null);
            setLoading(false);
            return;
        }

        const callId = nextId();
        activeCallId.current = callId;
        setLoading(true);

        const w = getWorker();

        const handler = (e) => {
            if (e.data.id !== callId) return;
            w.removeEventListener('message', handler);

            // Ignore if a newer call has been made
            if (activeCallId.current !== callId) return;

            if (e.data.type === 'RESULT') {
                setResult(e.data.result);
            } else if (e.data.type === 'ERROR') {
                console.error(`Worker error in ${fnName}:`, e.data.error);
                setResult(null);
            }
            setLoading(false);
        };

        w.addEventListener('message', handler);

        // Ensure data is set, then make the call
        ensureData(data).then(() => {
            // Check if this call is still active
            if (activeCallId.current !== callId) {
                w.removeEventListener('message', handler);
                return;
            }
            w.postMessage({ type: 'CALL', id: callId, payload: { fn: fnName, args } });
        });

        return () => {
            activeCallId.current = null;
            w.removeEventListener('message', handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, fnName, ...args]);

    return { result, loading };
}

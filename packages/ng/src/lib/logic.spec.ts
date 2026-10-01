import { HttpErrorResponse } from '@angular/common/http';
import { conditionRank, conditionTone, firstProblem, healthy } from './conditions';
import { describeError, isNotFound } from './errors';
import { bytes, count, plural, shortId } from './format';
import { DEFAULT_SORT, formatSort, nextSort, parseSort, searchRows, sortRows } from './table';
import { ago, duration, isoInstant, span, timestamp } from './time';

describe('table', () => {
  it('parses and formats ?sort=, leaving the default out', () => {
    expect(parseSort(undefined)).toEqual(DEFAULT_SORT);
    expect(parseSort('-size')).toEqual({ key: 'size', desc: true });
    expect(formatSort({ key: 'name', desc: false })).toBeNull();
    expect(formatSort({ key: 'size', desc: true })).toBe('-size');
    const fallback = { key: 'created', desc: true };
    expect(parseSort(null, fallback)).toEqual(fallback);
    expect(formatSort(fallback, fallback)).toBeNull();
  });

  it('turns a column around on the second click', () => {
    expect(nextSort({ key: 'a', desc: false }, 'a')).toEqual({ key: 'a', desc: true });
    expect(nextSort({ key: 'a', desc: true }, 'b')).toEqual({ key: 'b', desc: false });
  });

  it('sorts naturally, numbers as numbers, missing values last, ties by name', () => {
    const rows = [
      { name: 'agent-10', n: 3 },
      { name: 'agent-2', n: undefined },
      { name: 'agent-1', n: 3 },
      { name: 'agent-3', n: 20 },
    ];
    const byName = sortRows(rows, { key: 'name', desc: false }, {}, (r) => r.name).map((r) => r.name);
    expect(byName).toEqual(['agent-1', 'agent-2', 'agent-3', 'agent-10']);
    const byN = sortRows(rows, { key: 'n', desc: true }, { n: (r) => r.n }, (r) => r.name).map((r) => r.name);
    expect(byN).toEqual(['agent-3', 'agent-1', 'agent-10', 'agent-2']);
  });

  it('searches any of the texts, ignoring case', () => {
    const rows = [{ a: 'Memory', b: undefined }, { a: 'tools', b: 'grep' }];
    expect(searchRows(rows, 'GREP', (r) => [r.a, r.b])).toEqual([rows[1]]);
    expect(searchRows(rows, '  ', (r) => [r.a])).toEqual(rows);
  });
});

describe('time', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  it('says how long ago, precisely enough', () => {
    expect(ago('2026-10-01T11:59:18Z', now)).toBe('42s ago');
    expect(ago('2026-10-01T11:15:00Z', now)).toBe('45m ago');
    expect(ago('2026-10-01T08:48:00Z', now)).toBe('3h 12m ago');
    expect(ago('2026-09-26T12:00:00Z', now)).toBe('5d ago');
    expect(ago(undefined, now)).toBe('—');
    expect(ago('not a date', now)).toBe('—');
    expect(ago(now - 5000, now)).toBe('5s ago');
  });

  it('gives the absolute and ISO forms', () => {
    expect(isoInstant('2026-10-01T12:00:00Z')).toBe('2026-10-01T12:00:00.000Z');
    expect(isoInstant('')).toBeNull();
    expect(timestamp('garbage')).toBe('garbage');
    expect(timestamp(undefined)).toBe('—');
  });

  it('writes durations and spans', () => {
    expect(duration(340)).toBe('340 ms');
    expect(duration(1234)).toBe('1.2 s');
    expect(span(12_400)).toBe('12.4 s');
    expect(span(185_000)).toBe('3 min 5 s');
    expect(span(4_320_000)).toBe('1 h 12 min');
  });
});

describe('format', () => {
  it('counts, pluralises and sizes', () => {
    expect(count(undefined)).toBe('—');
    expect(plural(1, 'memory', 'memories')).toBe('1 memory');
    expect(plural(3, 'memory', 'memories')).toBe('3 memories');
    expect(plural(2, 'tag set')).toBe('2 tag sets');
    expect(bytes(512)).toBe('512 B');
    expect(bytes(1536)).toBe('1.5 KiB');
    expect(bytes(50 * 1024 * 1024)).toBe('50 MiB');
  });

  it('shortens identifiers so they stay recognisable', () => {
    expect(shortId('sha256:3f2a9c1e0b7d55aa66bb77cc')).toBe('sha256:3f2a9c1e0b7d');
    expect(shortId('3f2a9c1e0b7d55aa66bb')).toBe('3f2a9c1e0b7d');
    expect(shortId('registry.example/metapatrol/steward:0.14.2')).toBe('registry.exa…eward:0.14.2');
    expect(shortId('short-id')).toBe('short-id');
    expect(shortId(undefined)).toBe('—');
  });
});

describe('errors', () => {
  it('describes an error the way the API told it, or says the service is unreachable', () => {
    expect(describeError(new HttpErrorResponse({ status: 409, error: { error: 'already exists' } }))).toBe('409 · already exists');
    expect(describeError(new HttpErrorResponse({ status: 422, error: { message: 'invalid name' } }))).toBe('422 · invalid name');
    expect(describeError(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' }))).toBe('500 · Internal Server Error');
    expect(describeError(new HttpErrorResponse({ status: 0 }), 'engram')).toBe('engram is not reachable');
    expect(describeError(new Error('boom'))).toBe('boom');
    expect(isNotFound(new HttpErrorResponse({ status: 404 }))).toBe(true);
  });
});

describe('conditions', () => {
  const ready = (status: string, reason?: string) => ({ type: 'Ready', status, reason });
  it('tones: True ok, Unknown neutral, False bad unless inherited', () => {
    expect(conditionTone(ready('True'))).toBe('ok');
    expect(conditionTone(ready('Unknown'))).toBe('neutral');
    expect(conditionTone(undefined)).toBe('neutral');
    expect(conditionTone(ready('False', 'CrashLoop'))).toBe('bad');
    expect(conditionTone(ready('False', 'ServerUnavailable'), ['ServerUnavailable'])).toBe('warn');
  });

  it('ranks broken first and finds the problem worth showing', () => {
    expect([ready('True'), ready('False'), ready('Unknown')].map(conditionRank)).toEqual([2, 0, 1]);
    const cs = [{ type: 'Valid', status: 'True' }, { type: 'Ready', status: 'False', reason: 'NoBackend' }];
    expect(healthy(cs, ['Valid'])).toBe(true);
    expect(healthy(cs, ['Valid', 'Ready'])).toBe(false);
    expect(healthy(cs, ['Missing'])).toBe(false);
    expect(firstProblem(cs, ['Valid', 'Ready'])?.reason).toBe('NoBackend');
  });
});
